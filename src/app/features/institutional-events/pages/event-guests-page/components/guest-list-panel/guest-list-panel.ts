import {
  ChangeDetectionStrategy, Component, DestroyRef, EventEmitter,
  Input, OnChanges, OnInit, Output, SimpleChanges,
  computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, map, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccessType, ACCESS_TYPE_META } from '../../../../models/institutional-event.model';
import {
  EffectiveGuest,
  GuestCount,
  GuestSocioSearchResult,
  EventPublicRegistrant,
} from '../../../../models/event-guest.model';
import { EventGuestsService } from '../../../../services/event-guests.service';

/**
 * Panel izquierdo del split-screen del guest list (mapa 16 §3.2).
 *
 * Muestra:
 *  1. Tabla del listado EFECTIVO de invitados (auto + manual mergeados).
 *  2. Buscador de socios / public registrants por `access_type` en modo `manual`.
 *  3. Botón `+ Agregar` por resultado; botón `x` por fila manual.
 *
 * Recarga automáticamente cuando cambia `reloadTick` (marca del padre).
 */
@Component({
  selector: 'app-guest-list-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './guest-list-panel.html',
  styleUrl: './guest-list-panel.scss',
})
export class GuestListPanelComponent implements OnInit, OnChanges {
  private readonly svc = inject(EventGuestsService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) eventId!: number;
  @Input() subeventId: number | null = null;
  @Input() scopeAccessTypes: AccessType[] = [];
  /** Cambia cuando el padre requiere recarga forzada (después de un scope toggle). */
  @Input() reloadTick = 0;

  @Output() guestChanged = new EventEmitter<void>();

  readonly accessMeta = ACCESS_TYPE_META;

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly guests = signal<EffectiveGuest[]>([]);
  readonly counts = signal<GuestCount[]>([]);

  // Buscador manual
  readonly searchTerm = signal('');
  readonly searching = signal(false);
  readonly searchResults = signal<Array<GuestSocioSearchResult | EventPublicRegistrant>>([]);
  /** Access_type activo en el buscador (uno de los que está en modo manual). */
  readonly manualAccessType = signal<AccessType | null>(null);
  /** True cuando la búsqueda cross-type encontró resultados en otro access_type distinto al activo. */
  readonly foundInOtherAccessType = signal<AccessType | null>(null);
  private readonly search$ = new Subject<string>();

  // Formulario "Crear externo" (para public / registration)
  readonly showExternalForm = signal(false);
  readonly savingExternal = signal(false);
  readonly externalFormError = signal<string | null>(null);
  readonly externalForm = signal<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    notes: string;
  }>({ first_name: '', last_name: '', email: '', phone: '', notes: '' });

  // Paginación local simple
  readonly page = signal(1);
  readonly limit = signal(50);
  readonly total = signal(0);

  /** Access types del scope que están en modo `manual` (para el dropdown del buscador). */
  readonly manualAccessTypes = computed((): AccessType[] =>
    this.counts()
      .filter(c => c.mode === 'manual' && this.scopeAccessTypes.includes(c.access_type))
      .map(c => c.access_type),
  );

  /** Total de manuales en el scope (para mostrar en header). */
  readonly manualCount = computed((): number =>
    this.counts().reduce((sum, c) => sum + (c.manual_count ?? 0), 0),
  );

  /** Total de auto en el scope. */
  readonly autoCount = computed((): number =>
    this.counts().reduce((sum, c) => sum + (c.auto_count ?? 0), 0),
  );

  /** True si el access_type actual admite crear externos (public/registration). */
  readonly canCreateExternal = computed((): boolean => {
    const at = this.manualAccessType();
    return at === 'public' || at === 'registration';
  });

  ngOnInit(): void {
    // Debounce del buscador
    type SearchItem = GuestSocioSearchResult | EventPublicRegistrant;
    this.search$.pipe(
      debounceTime(320),
      distinctUntilChanged(),
      switchMap((q): Observable<SearchItem[]> => {
        const at = this.manualAccessType();
        if (!q || q.trim().length < 2 || !at) {
          this.searching.set(false);
          return of([] as SearchItem[]);
        }
        this.searching.set(true);
        // Rutea la búsqueda según el `access_type`:
        //  - members, patron, committee → search-socios
        //  - public, registration → search-public-registrants
        if (at === 'public' || at === 'registration') {
          return this.svc.searchPublicRegistrants(this.eventId, q, at).pipe(
            map(r => (r.data?.registrants ?? []) as SearchItem[]),
            catchError(() => of([] as SearchItem[])),
          );
        }
        return this.svc.searchSocios(this.eventId, q, at).pipe(
          map(r => (r.data?.socios ?? []) as SearchItem[]),
          catchError(() => of([] as SearchItem[])),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(items => {
      this.searchResults.set(items);
      this.searching.set(false);
      // Cross-type hint: si no hay resultados en el access_type activo,
      // hacer una búsqueda auxiliar sin filtro para ver si existe en otro tipo.
      if (items.length === 0 && this.searchTerm().trim().length >= 2) {
        void this.checkOtherAccessTypes(this.searchTerm());
      } else {
        this.foundInOtherAccessType.set(null);
      }
    });
  }

  /**
   * Búsqueda auxiliar sin filtro `access_type`: si el usuario buscó en
   * `members` pero la persona es patrona, se le informa para cambiar el tipo.
   * Solo aplica para socios (members/patron/committee).
   */
  private async checkOtherAccessTypes(q: string): Promise<void> {
    const activeAt = this.manualAccessType();
    if (!activeAt || activeAt === 'public' || activeAt === 'registration') {
      this.foundInOtherAccessType.set(null);
      return;
    }
    try {
      const res = await firstValueFrom(this.svc.searchSocios(this.eventId, q, null));
      const socios = res?.data?.socios ?? [];
      if (socios.length === 0) {
        this.foundInOtherAccessType.set(null);
        return;
      }
      const first = socios[0];
      const patronIds = [1, 2, 3];
      const isPatron = first.patrimonial_condition_id !== null
        && patronIds.includes(first.patrimonial_condition_id);
      const otherAt: AccessType = isPatron ? 'patron' : 'members';
      if (otherAt !== activeAt) {
        this.foundInOtherAccessType.set(otherAt);
      } else {
        this.foundInOtherAccessType.set(null);
      }
    } catch {
      this.foundInOtherAccessType.set(null);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] || changes['subeventId'] || changes['reloadTick']) {
      void this.reload();
    }
  }

  async reload(): Promise<void> {
    if (!this.eventId) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const [listRes, countsRes] = await Promise.all([
        firstValueFrom(this.svc.getList(this.eventId, this.subeventId, null, this.page(), this.limit())),
        firstValueFrom(this.svc.getCounts(this.eventId, this.subeventId)),
      ]);
      this.guests.set(listRes?.data?.guests ?? []);
      this.total.set(listRes?.data?.pagination?.total ?? 0);
      this.counts.set(countsRes?.data?.counts ?? []);

      // Auto-selecciona el primer access_type en manual, si existe.
      const manualAts = this.manualAccessTypes();
      if (manualAts.length > 0 && !this.manualAccessType()) {
        this.manualAccessType.set(manualAts[0]);
      } else if (manualAts.length === 0) {
        this.manualAccessType.set(null);
        this.searchResults.set([]);
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error cargando invitados.');
      this.guests.set([]);
      this.counts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onManualAccessTypeChange(value: string): void {
    this.manualAccessType.set(value as AccessType);
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.foundInOtherAccessType.set(null);
  }

  /**
   * Si el hint sugiere que la persona está en otro `access_type`, permitir
   * cambiar al dropdown y reintentar la búsqueda con el mismo término.
   */
  switchToSuggestedAccessType(): void {
    const suggested = this.foundInOtherAccessType();
    if (!suggested) return;
    // Solo aplica si el sugerido está también en modo manual (aparece en el dropdown).
    if (!this.manualAccessTypes().includes(suggested)) return;
    this.manualAccessType.set(suggested);
    this.foundInOtherAccessType.set(null);
    // Re-disparar la búsqueda actual.
    const term = this.searchTerm();
    if (term && term.trim().length >= 2) {
      this.search$.next(term);
    }
  }

  onSearchInput(q: string): void {
    this.searchTerm.set(q);
    this.search$.next(q);
  }

  /** Devuelve un nombre completo listo para mostrar, según el tipo de resultado. */
  resultFullName(r: GuestSocioSearchResult | EventPublicRegistrant): string {
    if ('entityid' in r) {
      return r.fullname ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();
    }
    return `${(r as EventPublicRegistrant).first_name ?? ''} ${(r as EventPublicRegistrant).last_name ?? ''}`.trim();
  }

  /** Etiqueta secundaria: entityid para socios, email para public registrants. */
  resultSubtitle(r: GuestSocioSearchResult | EventPublicRegistrant): string {
    if ('entityid' in r) {
      return `Socio #${(r as GuestSocioSearchResult).entityid}${r.email ? ' · ' + r.email : ''}`;
    }
    return (r as EventPublicRegistrant).email ?? '';
  }

  async addResult(r: GuestSocioSearchResult | EventPublicRegistrant): Promise<void> {
    const at = this.manualAccessType();
    if (!at) return;
    try {
      const payload = 'entityid' in r
        ? [{ socio_id: r.id }]
        : [{ public_registrant_id: r.id }];
      const res = await firstValueFrom(this.svc.addManual(this.eventId, this.subeventId, at, payload));
      if (res?.success) {
        // Remover el resultado agregado del dropdown (evita agregarlo dos veces).
        this.searchResults.update(list => list.filter(x => x.id !== r.id));
        await this.reload();
        this.guestChanged.emit();
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error agregando invitado.');
    }
  }

  async removeManual(g: EffectiveGuest): Promise<void> {
    if (!g.guest_id) return;
    if (!confirm(`¿Quitar a ${g.person.full_name} de la lista de invitados?`)) return;
    try {
      await firstValueFrom(this.svc.deleteManual(this.eventId, g.guest_id));
      await this.reload();
      this.guestChanged.emit();
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error al quitar invitado.');
    }
  }

  // ── Formulario "Crear externo" (public / registration) ───────────────────

  openExternalForm(): void {
    this.externalFormError.set(null);
    this.externalForm.set({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
    this.showExternalForm.set(true);
  }

  closeExternalForm(): void {
    if (this.savingExternal()) return;
    this.showExternalForm.set(false);
    this.externalFormError.set(null);
  }

  updateExternalField<K extends keyof ReturnType<typeof this.externalForm>>(key: K, value: string): void {
    this.externalForm.update(f => ({ ...f, [key]: value }));
  }

  async saveExternal(): Promise<void> {
    const at = this.manualAccessType();
    if (at !== 'public' && at !== 'registration') return;

    const form = this.externalForm();
    if (!form.first_name.trim()) {
      this.externalFormError.set('El nombre es obligatorio.');
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      this.externalFormError.set('Ingresa un email válido.');
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      this.externalFormError.set('El teléfono debe tener 10 dígitos.');
      return;
    }

    this.savingExternal.set(true);
    this.externalFormError.set(null);
    try {
      const res = await firstValueFrom(this.svc.createPublicRegistrant(
        this.eventId,
        this.subeventId,
        at,
        {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      ));
      if (res?.success) {
        this.showExternalForm.set(false);
        await this.reload();
        this.guestChanged.emit();
      } else {
        this.externalFormError.set(res?.message ?? 'No se pudo crear el invitado externo.');
      }
    } catch (err: any) {
      this.externalFormError.set(err?.error?.message ?? 'Error al crear invitado externo.');
    } finally {
      this.savingExternal.set(false);
    }
  }

  // ── Paginación ──────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.limit()));
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page.set(p);
    void this.reload();
  }
}
