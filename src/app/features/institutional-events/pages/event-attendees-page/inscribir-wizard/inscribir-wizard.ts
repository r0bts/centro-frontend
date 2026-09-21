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
import { SocioGuestsService } from '../../../../../services/socio-guests.service';
import { SocioGuest } from '../../../../../models/socio-guest.model';
import {
  InstitutionalEvent,
  InstitutionalEventAttendee,
  InstitutionalEventSubevent,
  EventSocioSearchResult,
  PendingMember,
  AccessType,
} from '../../../models/institutional-event.model';

type Paso = 'type' | 'search' | 'family' | 'confirm' | 'done';
type WizardMode = 'socio' | 'publico' | 'patrono' | 'registro_previo' | 'invitacion';

interface BatchApiResult {
  socio_id: number;
  full_name: string;
  status: 'inscrito' | 'skipped' | 'error';
  message?: string;
  attendee_id?: number;
  amount?: number;
}

import { SocioGuestModal } from '../../../components/socio-guest-modal/socio-guest-modal';

@Component({
  selector: 'app-inscribir-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SocioGuestModal],
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
  readonly wizardMode = signal<WizardMode>('socio');
  readonly paso = signal<Paso>('type');
  readonly registrationMode = signal<'socio' | 'publico' | 'registro_previo' | null>(null);
  readonly searchTerm = signal('');
  readonly buscando = signal(false);
  readonly resultados = signal<EventSocioSearchResult[]>([]);

  // ── Búsqueda de Público General (Externos) ───────────────────────────────
  readonly externalVisitorSearchInput$ = new Subject<string>();
  readonly searchExternalTerm = signal('');
  readonly buscandoExternal = signal(false);
  readonly resultadosExternal = signal<any[]>([]);
  readonly manualExternalId = signal<number | null>(null);

  readonly pendingMembers = signal<PendingMember[]>([]);
  readonly guardando = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly notas = signal('');
  readonly skipBilling = signal(false);

  // ── Formulario Manual ──────────────────────────────────────────────────────
  readonly manualFullname = signal('');
  readonly manualEmail = signal('');
  readonly manualPhone = signal('');
  readonly manualAccessType = signal<AccessType>('public');

  // ── Modal de invitados ────────────────────────────────────────────────────
  readonly guestModalOpen = signal(false);
  readonly selectedHostSocio = signal<any>(null); // Guardamos info del socio anfitrión

  readonly enrolledGuestIds = computed(() => {
    return this.pendingMembers()
      .filter(m => m.attendee_type === 'invitado' && m.socio_guest_id)
      .map(m => m.socio_guest_id as number);
  });

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
    this.pendingMembers().filter(m => m.selected)
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

  constructor(
    private svc: InstitutionalEventsService,
    private guestsSvc: SocioGuestsService
  ) {
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

    this.externalVisitorSearchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.length < 3) {
          this.buscandoExternal.set(false);
          return of({ data: [] });
        }
        this.buscandoExternal.set(true);
        if (this.wizardMode() === 'registro_previo') {
          return this.svc.searchPreregistrant(q).pipe(catchError(() => of({ data: [] })));
        }
        return this.svc.searchExternalVisitor(q).pipe(catchError(() => of({ data: [] })));
      }),
      takeUntil(this.destroy$),
    ).subscribe(res => {
      this.resultadosExternal.set(res.data ?? []);
      this.buscandoExternal.set(false);
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

  onSearchExternalInput(q: string): void {
    this.searchExternalTerm.set(q);
    this.externalVisitorSearchInput$.next(q);
  }

  seleccionarModo(modo: 'socio' | 'publico' | 'registro_previo'): void {
    this.registrationMode.set(modo);
    this.setWizardMode(modo);
    this.paso.set('search');
  }

  seleccionarVisitanteExterno(r: any): void {
    this.manualExternalId.set(r.id);
    this.manualFullname.set(r.full_name);
    this.manualEmail.set(r.email);
    this.manualPhone.set(r.phone || '');
    this.resultadosExternal.set([]);
    this.searchExternalTerm.set('');
  }

  setWizardMode(mode: WizardMode): void {
    this.wizardMode.set(mode);
    this.searchTerm.set('');
    this.resultados.set([]);
    this.pendingMembers.set([]);
    this.errorMsg.set(null);

    if (mode !== 'socio') {
      let ac: AccessType = 'public';
      if (mode === 'registro_previo') ac = 'registration';
      if (mode === 'patrono') ac = 'patron';
      
      // Fallback if the selected event doesn't support the determined access type
      if (this.eventAccessTypes().length > 0 && !this.eventAccessTypes().includes(ac)) {
        ac = this.eventAccessTypes()[0];
      }

      this.manualAccessType.set(ac);
      this.manualFullname.set('');
      this.manualEmail.set('');
      this.manualPhone.set('');
    }
  }

  avanzarManual(): void {
    if (!this.manualFullname().trim() || !this.manualEmail().trim()) {
      this.errorMsg.set('Nombre y correo son obligatorios.');
      return;
    }
    const ac = this.manualAccessType();
    
    // Check if the external visitor is already enrolled
    const extId = this.manualExternalId();
    const existingAttendee = extId ? this.attendees.find(a => a.external_visitor_id === extId && a.status !== 'cancelled') : null;
    const alreadyEnrolled = !!existingAttendee;
    const existingSubevents = existingAttendee?.institutional_event_attendee_subevents?.map(s => s.subevent_id) || [];
    
    const baseCost = alreadyEnrolled ? 0 : this.resolveEventBase(ac);

    const m: PendingMember = {
      socio_id: 0,
      entityid: 'EXTERNO',
      fullname: this.manualFullname().trim(),
      email: this.manualEmail().trim(),
      phone: this.manualPhone().trim(),
      parentesco: 'Participante',
      is_titular: true,
      selected: false,
      alreadyEnrolled,
      selectedSubeventIds: existingSubevents,
      existingSubeventIds: existingSubevents,
      baseCost,
      subeventsCost: 0,
      totalCost: alreadyEnrolled ? 0 : baseCost,
      access_type_selected: ac,
    };

    this.pendingMembers.set([m]);
    this.errorMsg.set(null);
    this.paso.set('family');
  }

  // ── Paso 1 → 2: seleccionar resultado y cargar familia ───────────────────
  async seleccionarResultado(result: EventSocioSearchResult): Promise<void> {
    this.errorMsg.set(null);
    let defaultAccessType: AccessType = 'members';
    if (this.eventAccessTypes().length > 0 && !this.eventAccessTypes().includes('members')) {
      defaultAccessType = this.eventAccessTypes()[0] as AccessType;
    }
    const baseCost = this.resolveEventBase(defaultAccessType);

    this.selectedHostSocio.set(result); // Guardar host socio para el modal

    if (this.wizardMode() === 'invitacion') {
      try {
        const res: any = await firstValueFrom(this.guestsSvc.getBySocio(result.id));
        const guests = res.data ?? [];
        if (guests.length === 0) {
          this.errorMsg.set('El socio no tiene invitados registrados.');
          // Aún así, pasamos al paso 2 para que pueda agregar invitados con el botón
          this.pendingMembers.set([]);
          this.paso.set('family');
          return;
        }

        const members: PendingMember[] = guests.map((g: SocioGuest) => {
          return {
            socio_id: 0,
            entityid: 'GUEST',
            fullname: `${g.first_name} ${g.last_name} ${g.second_last_name || ''}`.trim(),
            parentesco: g.relationship,
            is_titular: false,
            selected: false,
            alreadyEnrolled: false, // We could check if they are enrolled by fullname
            selectedSubeventIds: [],
            existingSubeventIds: [],
            baseCost,
            subeventsCost: 0,
            totalCost: 0,
            access_type_selected: defaultAccessType,
            attendee_type: 'invitado',
            socio_guest_id: g.id,
            host_socio_id: result.id,
          };
        });

        this.pendingMembers.set(members);
        this.paso.set('family');
      } catch (e: any) {
        this.errorMsg.set('Error al cargar los invitados.');
      }
      return;
    }

    const familia = result.family?.length ? result.family : [{
      id: result.id, entityid: result.entityid, fullname: result.fullname,
      email: result.email, phone: result.phone, parentesco: 'Socio', is_titular: true,
    }];

    const members: PendingMember[] = familia.map(f => {
      const existingAttendees = this.wizardMode() === 'publico' 
        ? this.attendees.filter(a => a.external_visitor_id === f.id && a.status !== 'cancelled')
        : this.attendees.filter(a => a.socio_id === f.id && a.status !== 'cancelled');
      const alreadyEnrolled = existingAttendees.length > 0;
      const existingSubevents = existingAttendees.flatMap(a => a.institutional_event_attendee_subevents?.map(s => s.subevent_id) || []);
      
      let assignedAccessType = defaultAccessType;
      if (this.wizardMode() === 'socio') {
        assignedAccessType = 'members';
      }

      return {
        socio_id: f.id, entityid: f.entityid, fullname: f.fullname,
        parentesco: f.parentesco, is_titular: f.is_titular,
        selected: false,
        alreadyEnrolled,
        selectedSubeventIds: existingSubevents,
        existingSubeventIds: existingSubevents,
        baseCost: alreadyEnrolled ? 0 : this.resolveEventBase(assignedAccessType),
        subeventsCost: 0,
        totalCost: 0,
        access_type_selected: assignedAccessType,
        attendee_type: 'socio'
      };
    });

    this.pendingMembers.set(members);
    this.paso.set('family');
  }

  estaYaInscrito(socioId: number): boolean {
    return this.attendees.some(a => a.socio_id === socioId && a.status !== 'cancelled');
  }

  // ── Paso 2: toggles de miembros y subeventos ─────────────────────────────
  toggleMiembro(member: PendingMember): void {
    this.pendingMembers.update(ms => ms.map(m => {
      const isMatch = (m.attendee_type === 'invitado') 
        ? (m.socio_guest_id === member.socio_guest_id)
        : (m.socio_id === member.socio_id);
      
      if (!isMatch) return m;
      const nowSelected = !m.selected;
      
      let newSubeventIds = m.selectedSubeventIds;
      if (!m.alreadyEnrolled) {
         newSubeventIds = nowSelected ? m.selectedSubeventIds : [];
      }
      
      return {
        ...m,
        selected: nowSelected,
        selectedSubeventIds: newSubeventIds,
        subeventsCost: nowSelected ? m.subeventsCost : 0,
        totalCost: nowSelected ? m.baseCost + m.subeventsCost : 0,
      };
    }));
  }

  toggleSubevento(member: PendingMember, svId: number): void {
    this.pendingMembers.update(ms => ms.map(m => {
      const isMatch = (m.attendee_type === 'invitado') 
        ? (m.socio_guest_id === member.socio_guest_id)
        : (m.socio_id === member.socio_id);
      if (!isMatch) return m;
      const sv = this.subevents().find(s => s.id === svId);
      if (!sv) return m;
      // Fase 2 §9.3 P4: bloqueo por access_types[] del subevento.
      if (!this.isSubeventoDisponible(sv, m.access_type_selected)) return m;
      
      // Si ya está inscrito y tiene el subevento de antes, no se permite desmarcarlo
      if (m.alreadyEnrolled && m.existingSubeventIds.includes(svId)) return m;
      
      const ids = m.selectedSubeventIds.includes(svId)
        ? m.selectedSubeventIds.filter(id => id !== svId)
        : [...m.selectedSubeventIds, svId];
      // Fase 2 §9.3 P3: precio desde la matriz según el access_type del miembro.
      const subCost = ids.reduce((sum, id) => {
        // No cobrar si ya estaba inscrito a este subevento previamente
        if (m.existingSubeventIds.includes(id)) return sum;
        const s = this.subevents().find(x => x.id === id);
        return sum + (s ? this.resolveSubeventCost(s, m.access_type_selected) : 0);
      }, 0);
      return { ...m, selectedSubeventIds: ids, subeventsCost: subCost, totalCost: m.baseCost + subCost };
    }));
  }

  isSubeventoSeleccionado(member: PendingMember, svId: number): boolean {
    const isMatch = (m: PendingMember) => (m.attendee_type === 'invitado') 
      ? (m.socio_guest_id === member.socio_guest_id)
      : (m.socio_id === member.socio_id);
    return this.pendingMembers().find(isMatch)?.selectedSubeventIds.includes(svId) ?? false;
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
      const baseRows = this.event.institutional_event_prices.filter(p => p.subevent_id === null || p.subevent_id === undefined);
      
      const row = baseRows.find(p => p.access_type === accessType);
      if (row) return Number(row.cost) || 0;

      // Fallback: public or first available
      const publicRow = baseRows.find(p => p.access_type === 'public');
      if (publicRow) return Number(publicRow.cost) || 0;
      if (baseRows.length > 0) return Number(baseRows[0].cost) || 0;
    }
    return Number(this.event.cost ?? 0);
  }

  resolveSubeventCostPublic(sv: InstitutionalEventSubevent, accessType: AccessType): number {
    return this.resolveSubeventCost(sv, accessType);
  }

  private resolveSubeventCost(sv: InstitutionalEventSubevent, accessType: AccessType): number {
    if (sv.has_matrix_pricing && sv.institutional_event_prices) {
      const row = sv.institutional_event_prices.find(p => p.access_type === accessType);
      if (row) return Number(row.cost) || 0;

      // Fallback: public or first available
      const publicRow = sv.institutional_event_prices.find(p => p.access_type === 'public');
      if (publicRow) return Number(publicRow.cost) || 0;
      if (sv.institutional_event_prices.length > 0) return Number(sv.institutional_event_prices[0].cost) || 0;
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
  changeAccessType(member: PendingMember, accessType: AccessType): void {
    this.pendingMembers.update(ms => ms.map(m => {
      const isMatch = (m.attendee_type === 'invitado') 
        ? (m.socio_guest_id === member.socio_guest_id)
        : (m.socio_id === member.socio_id);
      if (!isMatch) return m;
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
    if (p === 'search') {
      this.paso.set('type');
      this.searchTerm.set('');
      this.resultados.set([]);
    } else if (p === 'family') { 
      this.paso.set('search'); 
    } else if (p === 'confirm') { 
      this.paso.set('family'); 
    }
  }

  // ── Botón Modal Invitados ───────────────────────────────────────────────
  abrirModalInvitados(): void {
    this.guestModalOpen.set(true);
  }

  onGuestSelected(g: SocioGuest): void {
    this.guestModalOpen.set(false);
    // Agregarlo a pendingMembers si no existe
    if (!this.enrolledGuestIds().includes(g.id!)) {
      const defaultAccessType: AccessType = 'members';
      const baseCost = this.resolveEventBase(defaultAccessType);
      const guestFullName = `${g.first_name} ${g.last_name} ${g.second_last_name || ''}`.trim();
      const existingGuestAttendees = this.attendees.filter(a => 
        a.attendee_type === 'invitado' && 
        a.full_name.trim() === guestFullName && 
        a.status !== 'cancelled'
      );
      const alreadyEnrolled = existingGuestAttendees.length > 0;
      const existingSubevents = existingGuestAttendees.flatMap(a => a.institutional_event_attendee_subevents?.map(s => s.subevent_id) || []);

      const newMember: PendingMember = {
        socio_id: 0,
        entityid: 'GUEST',
        fullname: `${g.first_name} ${g.last_name} ${g.second_last_name || ''}`.trim(),
        parentesco: g.relationship,
        is_titular: false,
        selected: true,
        alreadyEnrolled,
        selectedSubeventIds: [],
        existingSubeventIds: existingSubevents,
        baseCost,
        subeventsCost: 0,
        totalCost: baseCost,
        access_type_selected: defaultAccessType,
        attendee_type: 'invitado',
        socio_guest_id: g.id,
        host_socio_id: this.selectedHostSocio()?.id,
      };

      this.pendingMembers.update(m => [...m, newMember]);
    }
  }

  // ── Fase 3: confirmar y enviar ───────────────────────────────────────────
  async confirmar(): Promise<void> {
    const activos = this.miembrosActivos().filter(m => {
      if (!m.alreadyEnrolled) return true;
      const newSubs = m.selectedSubeventIds.filter(id => !m.existingSubeventIds?.includes(id));
      return newSubs.length > 0;
    });

    if (!activos.length || this.guardando()) {
      this.guardando.set(false);
      this.errorMsg.set('No seleccionó nuevos subeventos para los miembros ya inscritos.');
      return;
    }

    this.guardando.set(true);
    this.errorMsg.set(null);

    try {
      if (this.wizardMode() === 'socio' || this.wizardMode() === 'invitacion') {
        const res = await firstValueFrom(this.svc.addAttendeesBatch(this.event.id, {
          attendees: activos.map(m => ({
            socio_id:     m.socio_id,
            host_socio_id: m.host_socio_id,
            socio_guest_id: m.socio_guest_id,
            attendee_type: m.attendee_type,
            full_name:    m.fullname,
            subevent_ids: m.selectedSubeventIds.filter(id => !m.existingSubeventIds?.includes(id)),
            // Fase 2 mapa 15 §9.3 P3: access_type por-attendee (el backend cobra
            // según la matriz de precios para este tipo específico).
            access_type_selected: m.access_type_selected,
          })),
          registration_channel: 'admin_manual',
          // Fallback a nivel batch para retro-compat (backend usa el por-attendee si viene).
          access_type_selected: activos[0]?.access_type_selected ?? 'members',
          notes:           this.notas() || null,
          create_ns_order: this.generaOrdenNS(),
          skip_billing:    this.skipBilling(),
        }));

        this.batchResults.set(res?.data?.results ?? []);
        this.nsSoId.set(res?.data?.ns_so_id ?? null);
        this.nsSoError.set(res?.data?.ns_so_error ?? null);

        if ((res?.data?.summary?.inscribed ?? 0) > 0) {
          this.inscripcionGuardada.emit();
        }
      } else {
        // Enrolar manual uno por uno (normalmente es solo 1) usando el endpoint add() para no depender de socio_id
        for (const m of activos) {
          const res = await firstValueFrom(this.svc.addAttendee(this.event.id, {
            attendee_type: 'externo',
            full_name: m.fullname,
            email: m.email || null,
            phone: m.phone || null,
            subevent_ids: m.selectedSubeventIds.filter(id => !m.existingSubeventIds?.includes(id)),
            access_type_selected: m.access_type_selected,
            registration_channel: 'admin_manual',
            notes: this.notas() || null,
            skip_billing: this.skipBilling(),
          }));
          
          this.batchResults.update(prev => [...prev, {
            socio_id: 0,
            full_name: m.fullname,
            status: 'inscrito',
            attendee_id: res.data?.attendee?.id
          }]);
        }
        this.inscripcionGuardada.emit();
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error de red al inscribir.');
      this.guardando.set(false);
      return; // Do not advance to 'done' if there is an error
    }

    this.guardando.set(false);
    this.paso.set('done');
  }

  nombreSubevento(id: number): string {
    return this.subevents().find(s => s.id === id)?.name ?? `#${id}`;
  }

  emitirYCerrar(): void { this.cerrar.emit(); }
}
