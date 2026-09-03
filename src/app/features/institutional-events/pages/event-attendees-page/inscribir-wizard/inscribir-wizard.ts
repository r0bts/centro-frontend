import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject, debounceTime, distinctUntilChanged,
  switchMap, of, catchError, takeUntil,
} from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { InstitutionalEventsService } from '../../../services/institutional-events.service';
import {
  InstitutionalEvent,
  InstitutionalEventAttendee,
  InstitutionalEventSubevent,
  EventSocioSearchResult,
  PendingMember,
} from '../../../models/institutional-event.model';

type Paso = 'search' | 'family' | 'confirm' | 'done';

interface BatchApiResult {
  socio_id: number;
  full_name: string;
  status: 'inscrito' | 'skipped' | 'error';
  message?: string;
  attendee_id?: number;
  amount?: number;
}

@Component({
  selector: 'app-inscribir-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscribir-wizard.html',
  styleUrl: './inscribir-wizard.scss',
})
export class InscribirWizardComponent implements OnDestroy {
  @Input({ required: true }) event!: InstitutionalEvent;
  @Input() attendees: InstitutionalEventAttendee[] = [];
  @Output() inscripcionGuardada = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  // ── Estado del wizard ─────────────────────────────────────────────────────
  readonly paso = signal<Paso>('search');
  readonly searchTerm = signal('');
  readonly buscando = signal(false);
  readonly resultados = signal<EventSocioSearchResult[]>([]);
  readonly pendingMembers = signal<PendingMember[]>([]);
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly notas = signal('');

  // ── Resultados del batch ──────────────────────────────────────────────────
  readonly batchResults = signal<BatchApiResult[]>([]);
  readonly nsSoId = signal<number | null>(null);
  readonly nsSoError = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly subevents = computed((): InstitutionalEventSubevent[] =>
    (this.event.institutional_event_subevents ?? []).filter(s => s.status !== 'cancelled')
  );

  readonly tieneSubeventos = computed(() => this.subevents().length > 0);

  readonly miembrosActivos = computed(() =>
    this.pendingMembers().filter(m => m.selected && !m.alreadyEnrolled)
  );

  readonly totalGrupo = computed(() =>
    this.miembrosActivos().reduce((sum, m) => sum + m.totalCost, 0)
  );

  readonly generaOrdenNS = computed(() =>
    this.event.has_cost && !!this.event.ns_item_id && this.totalGrupo() > 0
  );

  readonly inscritosOk = computed(() =>
    this.batchResults().filter(r => r.status === 'inscrito').length
  );
  readonly skipped = computed(() =>
    this.batchResults().filter(r => r.status === 'skipped').length
  );
  readonly errores = computed(() =>
    this.batchResults().filter(r => r.status === 'error').length
  );

  constructor(private svc: InstitutionalEventsService) {
    this.searchInput$.pipe(
      debounceTime(320),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.buscando.set(false); return of({ data: { socios: [] } }); }
        this.buscando.set(true);
        return this.svc.searchSocio(q).pipe(catchError(() => of({ data: { socios: [] } })));
      }),
      takeUntil(this.destroy$),
    ).subscribe(res => {
      this.resultados.set((res as any).data?.socios ?? []);
      this.buscando.set(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(q: string): void {
    this.searchTerm.set(q);
    this.searchInput$.next(q);
  }

  // ── Paso 1 → 2: seleccionar resultado y cargar familia ───────────────────
  seleccionarResultado(result: EventSocioSearchResult): void {
    const familia = result.family?.length ? result.family : [{
      id: result.id, entityid: result.entityid, fullname: result.fullname,
      email: result.email, phone: result.phone, parentesco: 'Socio', is_titular: true,
    }];

    const baseCost = this.event.has_cost ? Number(this.event.cost ?? 0) : 0;

    const members: PendingMember[] = familia.map(f => {
      const alreadyEnrolled = this.estaYaInscrito(f.id);
      return {
        socio_id: f.id, entityid: f.entityid, fullname: f.fullname,
        parentesco: f.parentesco, is_titular: f.is_titular,
        selected: false,
        alreadyEnrolled,
        selectedSubeventIds: [],
        baseCost,
        subeventsCost: 0,
        totalCost: 0,
      };
    });

    this.pendingMembers.set(members);
    this.errorMsg.set(null);
    this.paso.set('family');
  }

  estaYaInscrito(socioId: number): boolean {
    return this.attendees.some(a => a.socio_id === socioId && a.status !== 'cancelled');
  }

  // ── Paso 2: toggles de miembros y subeventos ─────────────────────────────
  toggleMiembro(socioId: number): void {
    this.pendingMembers.update(ms => ms.map(m => {
      if (m.socio_id !== socioId || m.alreadyEnrolled) return m;
      const nowSelected = !m.selected;
      // Al deseleccionar: limpiar subeventos y poner totalCost en 0
      // Al seleccionar: asignar baseCost (subeventos siguen en 0 hasta que se marquen)
      return {
        ...m,
        selected: nowSelected,
        selectedSubeventIds: nowSelected ? m.selectedSubeventIds : [],
        subeventsCost: nowSelected ? m.subeventsCost : 0,
        totalCost: nowSelected ? m.baseCost + m.subeventsCost : 0,
      };
    }));
  }

  toggleSubevento(socioId: number, svId: number): void {
    this.pendingMembers.update(ms => ms.map(m => {
      if (m.socio_id !== socioId) return m;
      const sv = this.subevents().find(s => s.id === svId);
      if (!sv || sv.access_type === 'committee') return m;
      const ids = m.selectedSubeventIds.includes(svId)
        ? m.selectedSubeventIds.filter(id => id !== svId)
        : [...m.selectedSubeventIds, svId];
      const subCost = ids.reduce((sum, id) => sum + Number(this.subevents().find(s => s.id === id)?.cost ?? 0), 0);
      return { ...m, selectedSubeventIds: ids, subeventsCost: subCost, totalCost: m.baseCost + subCost };
    }));
  }

  isSubeventoSeleccionado(socioId: number, svId: number): boolean {
    return this.pendingMembers().find(m => m.socio_id === socioId)?.selectedSubeventIds.includes(svId) ?? false;
  }

  subevCss(sv: InstitutionalEventSubevent): string {
    const map: Record<string, string> = {
      public:       'bg-success-subtle text-success-emphasis border-success-subtle',
      registration: 'bg-info-subtle text-info-emphasis border-info-subtle',
      members:      'bg-primary-subtle text-primary-emphasis border-primary-subtle',
      patron:       'bg-warning-subtle text-warning-emphasis border-warning-subtle',
      committee:    'bg-danger-subtle text-danger-emphasis border-danger-subtle',
    };
    return 'badge border ' + (map[sv.access_type] ?? map['public']);
  }

  avanzarAConfirm(): void {
    if (!this.miembrosActivos().length) {
      this.errorMsg.set('Selecciona al menos un miembro para inscribir.');
      return;
    }
    this.errorMsg.set(null);
    this.paso.set('confirm');
  }

  volver(): void {
    const p = this.paso();
    if (p === 'family') { this.paso.set('search'); }
    else if (p === 'confirm') { this.paso.set('family'); }
  }

  // ── Paso 3 → confirmar → batch ───────────────────────────────────────────
  async confirmar(): Promise<void> {
    const activos = this.miembrosActivos();
    if (!activos.length || this.guardando()) return;

    this.guardando.set(true);
    this.errorMsg.set(null);

    try {
      const res = await firstValueFrom(this.svc.addAttendeesBatch(this.event.id, {
        attendees: activos.map(m => ({
          socio_id:     m.socio_id,
          full_name:    m.fullname,
          subevent_ids: m.selectedSubeventIds,
        })),
        registration_channel: 'admin_manual',
        access_type_selected: 'members',
        notes:           this.notas() || null,
        create_ns_order: this.generaOrdenNS(),
      }));

      this.batchResults.set(res?.data?.results ?? []);
      this.nsSoId.set(res?.data?.ns_so_id ?? null);
      this.nsSoError.set(res?.data?.ns_so_error ?? null);

      if ((res?.data?.summary?.inscribed ?? 0) > 0) {
        this.inscripcionGuardada.emit();
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error de red al inscribir.');
    }

    this.guardando.set(false);
    this.paso.set('done');
  }

  nombreSubevento(id: number): string {
    return this.subevents().find(s => s.id === id)?.name ?? `#${id}`;
  }

  emitirYCerrar(): void { this.cerrar.emit(); }
}
