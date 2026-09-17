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
  AccessType,
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

    // Fase 2 mapa 15 §9.3 P3: cada miembro arranca con el primer access_type del
    // evento como default. El admin puede cambiarlo en el paso 2 con el dropdown.
    const defaultAccessType: AccessType = (this.eventAccessTypes()[0] ?? 'members') as AccessType;
    const baseCost = this.resolveEventBase(defaultAccessType);

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
        access_type_selected: defaultAccessType,
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
      if (!sv) return m;
      // Fase 2 §9.3 P4: bloqueo por access_types[] del subevento.
      if (!this.isSubeventoDisponible(sv, m.access_type_selected)) return m;
      const ids = m.selectedSubeventIds.includes(svId)
        ? m.selectedSubeventIds.filter(id => id !== svId)
        : [...m.selectedSubeventIds, svId];
      // Fase 2 §9.3 P3: precio desde la matriz según el access_type del miembro.
      const subCost = ids.reduce((sum, id) => {
        const s = this.subevents().find(x => x.id === id);
        return sum + (s ? this.resolveSubeventCost(s, m.access_type_selected) : 0);
      }, 0);
      return { ...m, selectedSubeventIds: ids, subeventsCost: subCost, totalCost: m.baseCost + subCost };
    }));
  }

  isSubeventoSeleccionado(socioId: number, svId: number): boolean {
    return this.pendingMembers().find(m => m.socio_id === socioId)?.selectedSubeventIds.includes(svId) ?? false;
  }

  // ── Fase 2 mapa 15 §9.3 P3: resolución de precios desde la matriz ─────────

  /** Access types válidos del evento — para el selector por miembro (paso 2). */
  readonly eventAccessTypes = computed((): AccessType[] =>
    (this.event.access_types ?? []) as AccessType[]
  );

  /**
   * Precio del evento base según la matriz para el `access_type` dado. Si el
   * evento tiene `has_matrix_pricing=true` busca la fila con `subevent_id=null`;
   * si no hay fila (o no hay matriz), cae al `event.cost` legacy.
   */
  private resolveEventBase(accessType: AccessType): number {
    if (!this.event.has_cost) return 0;
    if (this.event.has_matrix_pricing && this.event.institutional_event_prices) {
      const row = this.event.institutional_event_prices.find(p =>
        (p.subevent_id === null || p.subevent_id === undefined) && p.access_type === accessType,
      );
      if (row) return Number(row.cost) || 0;
    }
    return Number(this.event.cost ?? 0);
  }

  /**
   * Precio de un subevento según la matriz para el `access_type` dado. Busca
   * primero en la matriz del subevento (`institutional_event_prices` embebido
   * en el subevento) — si no está, cae al `subevent.cost` legacy. Público
   * porque también lo usa el HTML para mostrar el precio dinámico según el
   * access_type del miembro.
   */
  resolveSubeventCostPublic(sv: InstitutionalEventSubevent, accessType: AccessType): number {
    return this.resolveSubeventCost(sv, accessType);
  }

  private resolveSubeventCost(sv: InstitutionalEventSubevent, accessType: AccessType): number {
    if (sv.has_matrix_pricing && sv.institutional_event_prices) {
      const row = sv.institutional_event_prices.find(p => p.access_type === accessType);
      if (row) return Number(row.cost) || 0;
    }
    return Number(sv.cost ?? 0);
  }

  /** True cuando `sv.access_types[]` acepta el `access_type` del miembro. */
  isSubeventoDisponible(sv: InstitutionalEventSubevent, accessType: AccessType): boolean {
    if (!sv.access_types || sv.access_types.length === 0) return true;
    return sv.access_types.includes(accessType);
  }

  /**
   * Cambio de access_type del miembro (dropdown en paso 2). Recalcula `baseCost`
   * y `subeventsCost` con la matriz, y quita subeventos que ya no aplican.
   */
  changeAccessType(socioId: number, accessType: AccessType): void {
    this.pendingMembers.update(ms => ms.map(m => {
      if (m.socio_id !== socioId) return m;
      const newBase = this.resolveEventBase(accessType);
      // Filtra subeventos que ya no acepten este access_type.
      const validSubs = m.selectedSubeventIds.filter(svId => {
        const sv = this.subevents().find(s => s.id === svId);
        return sv ? this.isSubeventoDisponible(sv, accessType) : false;
      });
      const newSubCost = validSubs.reduce((sum, id) => {
        const sv = this.subevents().find(s => s.id === id);
        return sum + (sv ? this.resolveSubeventCost(sv, accessType) : 0);
      }, 0);
      return {
        ...m,
        access_type_selected: accessType,
        baseCost: newBase,
        selectedSubeventIds: validSubs,
        subeventsCost: newSubCost,
        totalCost: m.selected ? newBase + newSubCost : 0,
      };
    }));
  }

  subevCss(sv: InstitutionalEventSubevent): string {
    const map: Record<string, string> = {
      public:       'bg-success-subtle text-success-emphasis border-success-subtle',
      registration: 'bg-info-subtle text-info-emphasis border-info-subtle',
      members:      'bg-primary-subtle text-primary-emphasis border-primary-subtle',
      patron:       'bg-warning-subtle text-warning-emphasis border-warning-subtle',
      committee:    'bg-danger-subtle text-danger-emphasis border-danger-subtle',
    };
    // Mapa 15 §8: el subevento ahora usa access_types[] (múltiple). Se toma
    // el primer elemento para pintar el badge; fallback a access_type singular
    // (retro-compat) y luego a 'public' como último recurso.
    const first = (sv.access_types && sv.access_types.length > 0)
      ? sv.access_types[0]
      : (sv.access_type ?? 'public');
    return 'badge border ' + (map[first] ?? map['public']);
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
          // Fase 2 mapa 15 §9.3 P3: access_type por-attendee (el backend cobra
          // según la matriz de precios para este tipo específico).
          access_type_selected: m.access_type_selected,
        })),
        registration_channel: 'admin_manual',
        // Fallback a nivel batch para retro-compat (backend usa el por-attendee si viene).
        access_type_selected: activos[0]?.access_type_selected ?? 'members',
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
