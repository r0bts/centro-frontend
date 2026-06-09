import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

import { ScRegistrationsService }   from '../../../services/summer-course/sc-registrations.service';
import { ScCoursesService }         from '../../../services/summer-course/sc-courses.service';
import { ScKitDeliveriesService }   from '../../../services/summer-course/sc-kit-deliveries.service';
import { ScCredentialDeliveriesService } from '../../../services/summer-course/sc-credential-deliveries.service';
import { ScEnrollmentsService }     from '../../../services/summer-course/sc-enrollments.service';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../services/user.service';
import {
  ScCourse,
  ScLevel,
  ScGuest,
  ScRegistrationGroup,
  ScRegisteredParticipant,
  ScSocioSearchResult,
  ScRegistrationParticipant,
  ScCostWithTotal,
  SC_PARTICIPANT_TYPES,
  ScKitDeliveryItem,
  ScKitDeliverySummary,
  ScCredentialDeliveryItem,
  ScCredentialPreview,
  ScIntensiveActivity,
} from '../../../models/summer-course/summer-course.model';
import { GuestModalComponent } from '../guest-modal/guest-modal.component';
import { AuthorizedPickupsModalComponent } from './authorized-pickups-modal/authorized-pickups-modal';

interface LevelGroupFD {
  id: number;
  level_id: number;
  roman: string;
  alias: string;
  capacity: number;
}

interface LvlModalTarget {
  enrollment_id: number;
  titular_id: string | null;
  current_level: number | null;
}

interface GrpModalTarget {
  enrollment_id: number;
  titular_id: string | null;
  assigned_level: number;
}

type WizardStep = 'search' | 'participants' | 'confirm' | 'done';

interface PendingParticipant {
  socio_id: string | null;
  fullName: string;
  type: 'member' | 'guest' | 'staff' | 'staff_guest';
  weeks: { week_number: number; intensive_activity_id: number | null }[];
  birth_date: string | null;
  age: number | null;
  memberType: string;
  alreadyEnrolled: boolean;
  suggestedLevel: ScLevel | null;
  outOfRange: boolean;  // age < 3 o age > 15 o sin fecha
  guest_db_id?: number; // ID real en summer_course_guests (solo para invitados)
  // Nivel/grupo elegido antes de inscribir
  selectedLevel:      number | null;
  selectedGroupId:    number | null;
  selectedGroupAlias: string | null;
}

interface DoneParticipant {
  enrollmentId:    number;
  participantName: string;
  accessCode:      string;
  suggestedLevel:  number | null;
  assignedLevel:   number | null;
  groupId:         number | null;
  groupAlias:      string | null;
}

@Component({
  selector: 'app-summer-course-enrollments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, GuestModalComponent, AuthorizedPickupsModalComponent],
  templateUrl: './summer-course-enrollments.html',
  styleUrl: './summer-course-enrollments.scss',
})
export class SummerCourseEnrollmentsComponent implements OnInit {
  private svc          = inject(ScRegistrationsService);
  private coursesSvc   = inject(ScCoursesService);
  private kitSvc       = inject(ScKitDeliveriesService);
  private credSvc      = inject(ScCredentialDeliveriesService);
  private enrollSvc    = inject(ScEnrollmentsService);
  private userSvc      = inject(UserService);

  // ── Global ────────────────────────────────────────────────────────────────
  courses        = signal<ScCourse[]>([]);
  selectedCourse = signal<ScCourse | null>(null);
  loading        = signal(true);
  toast          = signal<string | null>(null);
  toastType      = signal<'success' | 'danger' | 'info'>('success');
  error          = signal<string | null>(null);

  // ── Admin table ───────────────────────────────────────────────────────────
  registrations      = signal<ScRegistrationGroup[]>([]);
  tableLoading       = signal(false);
  searchFilter       = signal('');
  expandedGroups     = signal<Set<string>>(new Set());

  filteredRegistrations = computed(() => {
    const q = this.searchFilter().toLowerCase();
    if (!q) return this.registrations();
    return this.registrations().filter(g =>
      g.titular_name?.toLowerCase().includes(q) ||
      g.participants.some(p => p.full_name.toLowerCase().includes(q))
    );
  });

  totalParticipants = computed(() =>
    this.registrations().reduce((s, g) => s + g.participants.length, 0)
  );

  // ── Kit delivery ─────────────────────────────────────────────────────────
  kitItems        = signal<ScKitDeliveryItem[]>([]);
  kitSummary      = signal<ScKitDeliverySummary>({ total: 0, delivered: 0, pending: 0 });
  kitLoading      = signal(false);
  kitModalOpen    = signal(false);
  kitModalGroup   = signal<ScRegistrationGroup | null>(null);
  kitGroupChecked = signal<Set<number>>(new Set());
  kitReceivedBy   = signal('');
  kitNotes        = signal('');
  kitSaving       = signal(false);

  // ── Foto de perfil ────────────────────────────────────────────────────────
  photoModalOpen        = signal(false);
  photoModalParticipant = signal<ScRegisteredParticipant | null>(null);
  
  // Authorized Pickups modal
  authorizedPickupsParticipant = signal<any | null>(null);
  
  credParticipant = signal<ScRegisteredParticipant | null>(null);
  photoModalGroupTitular = signal<ScRegistrationGroup | null>(null);
  photoPreviewUrl       = signal<string | null>(null);   // base64 capturado antes de guardar
  photoSaving           = signal(false);
  photoCameraStream     = signal<MediaStream | null>(null);
  photoCameraMode       = signal<'camera' | 'file'>('camera');

  // ── Credencial ────────────────────────────────────────────────────────────
  credItems         = signal<ScCredentialDeliveryItem[]>([]);
  credLoading       = signal(false);
  credModalOpen     = signal(false);
  credModalData     = signal<ScCredentialPreview | null>(null);
  credModalLoading  = signal(false);
  credSaving        = signal(false);
  credNotes         = signal('');

  // ── Level / Group assignment ──────────────────────────────────────────────
  levelGroupsFD     = signal<LevelGroupFD[]>([]);

  lvlModalOpen      = signal(false);
  lvlModalTarget    = signal<LvlModalTarget | null>(null);
  lvlModalValue     = signal<number>(1);
  lvlModalNotes     = signal('');
  lvlModalSaving    = signal(false);

  grpModalOpen      = signal(false);
  grpModalTarget    = signal<GrpModalTarget | null>(null);
  grpModalValue     = signal<number | null>(null);
  grpModalSaving    = signal(false);

  // índice del PendingParticipant cuyo panel inline está abierto (-1 = ninguno)
  pendingExpandIdx   = signal<number>(-1);

  // ── Wizard ────────────────────────────────────────────────────────────────
  wizardOpen         = signal(false);
  wizardStep         = signal<WizardStep>('search');
  wizardMode         = signal<'socio'|'colaborador'>('socio');
  colaboradorNo      = signal('');
  colaboradorName    = signal('');

  searchQuery        = signal('');
  searchResults      = signal<ScSocioSearchResult[]>([]);
  searching          = signal(false);
  selectedTitular    = signal<ScSocioSearchResult | null>(null);
  pendingParticipants = signal<PendingParticipant[]>([]);
  costs              = signal<ScCostWithTotal[]>([]);
  levels             = signal<ScLevel[]>([]);
  intensiveActivities = signal<ScIntensiveActivity[]>([]);
  saving             = signal(false);
  registrationResult = signal<any>(null);
  doneParticipants   = signal<DoneParticipant[]>([]);

  // ── Guest modal ───────────────────────────────────────────────────────────
  guestModalOpen     = signal(false);

  private search$ = new Subject<string>();
  private colabSearch$ = new Subject<string>();
  colaboradorLoading = signal(false);

  totalAmount = computed(() =>
    this.pendingParticipants()
      .filter(p => p.weeks.length > 0 && !p.outOfRange && !p.alreadyEnrolled)
      .reduce((sum, p) => sum + this.participantCost(p), 0)
  );

  /** IDs de invitados ya agregados al wizard — se pasa al GuestModalComponent */
  guestIds = computed(() =>
    this.pendingParticipants()
      .filter(p => p.guest_db_id != null)
      .map(p => p.guest_db_id!)
  );

  courseWeeksCount = computed(() => this.selectedCourse()?.sc_weeks?.length ?? 0);

  readonly participantTypes = SC_PARTICIPANT_TYPES;

  readonly MIN_AGE = 3;
  readonly MAX_AGE = 15;

  _isOutOfRange(age: number | null): boolean {
    if (age === null) return true;
    return age < this.MIN_AGE || age > this.MAX_AGE;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Cargar niveles al inicio (necesario para los badges de nivel en la tabla)
    this.svc.getLevels().subscribe({
      next: res => this.levels.set(res.data ?? []),
      error: () => {},
    });

    this.svc.getIntensiveActivities().subscribe({
      next: res => this.intensiveActivities.set(res.data ?? []),
      error: () => {},
    });

    this.coursesSvc.getAll({ status: 'active' }).subscribe({
      next: res => {
        const list = res.data?.courses ?? [];
        this.courses.set(list);
        if (list.length) {
          this.selectedCourse.set(list[0]);
          this._loadRegistrations(list[0].id);
          this._loadKits(list[0].id);
          this._loadCredentials(list[0].id);
          this._loadLevelGroups(list[0].id);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.searchResults.set([]); this.searching.set(false); return []; }
        this.searching.set(true);
        return this.svc.searchSocios(q, this.selectedCourse()?.id);
      }),
    ).subscribe({
      next: (res: any) => { this.searchResults.set(res?.data ?? []); this.searching.set(false); },
      error: () => this.searching.set(false),
    });

    this.colabSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 1) {
          this.colaboradorName.set('');
          this.colaboradorLoading.set(false);
          return [];
        }
        this.colaboradorLoading.set(true);
        return this.userSvc.getAllUsers(10, 1, q);
      })
    ).subscribe({
      next: (users) => {
        this.colaboradorLoading.set(false);
        if (users && users.length > 0) {
          const u = users[0];
          this.colaboradorName.set(`${u.firstName} ${u.lastName}`.trim());
        } else {
          this.colaboradorName.set('');
        }
      },
      error: () => {
        this.colaboradorLoading.set(false);
      }
    });
  }

  // ── Course selector ───────────────────────────────────────────────────────
  onCourseChange(courseId: string): void {
    const c = this.courses().find(c => c.id === +courseId) ?? null;
    this.selectedCourse.set(c);
    if (c) {
      this._loadRegistrations(c.id);
      this._loadKits(c.id);
      this._loadCredentials(c.id);
      this._loadLevelGroups(c.id);
    }
  }

  private _loadRegistrations(courseId: number): void {
    this.tableLoading.set(true);
    this.svc.getRegistrations(courseId).subscribe({
      next: res => { this.registrations.set(res.data ?? []); this.tableLoading.set(false); },
      error: () => this.tableLoading.set(false),
    });
  }

  refreshTable(): void {
    const c = this.selectedCourse();
    if (c) this._loadRegistrations(c.id);
  }

  // ── Group expand ─────────────────────────────────────────────────────────
  toggleGroup(key: string | null): void {
    const k = key ?? '__none__';
    const s = new Set(this.expandedGroups());
    if (s.has(k)) s.delete(k); else s.add(k);
    this.expandedGroups.set(s);
  }

  isExpanded(key: string | null): boolean {
    return this.expandedGroups().has(key ?? '__none__');
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  openWizard(): void {
    this.wizardOpen.set(true);
    this.wizardStep.set('search');
    this.wizardMode.set('socio');
    this.colaboradorNo.set('');
    this.colaboradorName.set('');
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedTitular.set(null);
    this.pendingParticipants.set([]);
    this.registrationResult.set(null);
    this.doneParticipants.set([]);
    this._loadCosts();
  }

  closeWizard(): void { this.wizardOpen.set(false); }

  private _loadCosts(): void {
    const cId = this.selectedCourse()?.id;
    this.svc.getCosts(cId).subscribe({
      next: res => this.costs.set(res.data ?? []),
      error: () => {},
    });
    this.svc.getLevels().subscribe({
      next: res => this.levels.set(res.data ?? []),
      error: () => {},
    });
  }

  onSearchInput(q: string): void {
    this.searchQuery.set(q);
    this.search$.next(q);
  }

  onColaboradorNoInput(q: string): void {
    this.colaboradorNo.set(q);
    this.colabSearch$.next(q);
  }

  _getLevelForAge(age: number | null): ScLevel | null {
    if (age === null) return null;
    return this.levels().find(l =>
      l.min_age <= age && (l.max_age === null || l.max_age >= age)
    ) ?? null;
  }

  selectTitular(s: ScSocioSearchResult): void {
    this.selectedTitular.set(s);
    this.searchResults.set([]);

    const titular: PendingParticipant = {
      socio_id: s.id, fullName: s.fullName, type: 'member',
      weeks: [], birth_date: s.birth_date, age: s.age,
      memberType: 'Titular', alreadyEnrolled: s.enrolled,
      suggestedLevel: this._getLevelForAge(s.age),
      outOfRange: this._isOutOfRange(s.age),
      selectedLevel: null, selectedGroupId: null, selectedGroupAlias: null,
    };
    const family: PendingParticipant[] = s.family.map(f => ({
      socio_id: f.id, fullName: f.fullName, type: 'member' as const,
      weeks: [], birth_date: f.birth_date, age: f.age,
      memberType: f.memberType, alreadyEnrolled: f.enrolled,
      suggestedLevel: this._getLevelForAge(f.age),
      outOfRange: this._isOutOfRange(f.age),
      selectedLevel: null, selectedGroupId: null, selectedGroupAlias: null,
    }));
    this.pendingParticipants.set([titular, ...family]);
    this.wizardStep.set('participants');
  }

  selectColaborador(): void {
    const colNo = this.colaboradorNo().trim();
    if (!colNo) {
      this.showToast('El número de empleado es requerido', 'danger');
      return;
    }
    
    let colName = this.colaboradorName().trim();
    if (!colName) {
      colName = 'Colaborador #' + colNo;
    }
    
    const s: ScSocioSearchResult = {
      id: 'EMP-' + colNo,
      fullName: colName,
      membershipNumber: 'EMP-' + colNo,
      birth_date: null,
      age: null,
      enrolled: false,
      family: []
    };
    
    this.selectedTitular.set(s);
    // Un colaborador no se inscribe a sí mismo, solo invitados
    this.pendingParticipants.set([]);
    this.wizardStep.set('participants');
  }

  backToSearch(): void { this.wizardStep.set('search'); this.selectedTitular.set(null); }

  // ── Utils ─────────────────────────────────────────────────────────────────
  photoBaseUrl(): string { 
    return environment.apiUrl.replace('/api', '/'); 
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────
  get courseWeeks() { return this.selectedCourse()?.sc_weeks ?? []; }

  toggleWeek(pIdx: number, weekNum: number): void {
    const p = this.pendingParticipants()[pIdx];
    if (p?.alreadyEnrolled || p?.outOfRange) return;
    this.pendingParticipants.update(list => {
      const updated = [...list];
      const participant = { ...updated[pIdx] };
      const idx = participant.weeks.findIndex(w => w.week_number === weekNum);
      if (idx !== -1) {
        participant.weeks = participant.weeks.filter(w => w.week_number !== weekNum);
      } else {
        participant.weeks = [...participant.weeks, { week_number: weekNum, intensive_activity_id: null }];
        participant.weeks.sort((a, b) => a.week_number - b.week_number);
      }
      updated[pIdx] = participant;
      return updated;
    });
  }

  isWeekSelected(pIdx: number, weekNum: number): boolean {
    return this.pendingParticipants()[pIdx]?.weeks.some(w => w.week_number === weekNum) ?? false;
  }

  setWeekIntensiveActivity(pIdx: number, weekNum: number, intensiveId: string | null): void {
    const parsedId = intensiveId === null || intensiveId === 'null' || intensiveId === '' ? null : parseInt(intensiveId, 10);
    this.pendingParticipants.update(list => {
      const updated = [...list];
      const participant = { ...updated[pIdx] };
      const idx = participant.weeks.findIndex(w => w.week_number === weekNum);
      if (idx !== -1) {
        participant.weeks = [...participant.weeks];
        participant.weeks[idx] = { ...participant.weeks[idx], intensive_activity_id: parsedId };
      }
      updated[pIdx] = participant;
      return updated;
    });
  }

  getWeekIntensiveActivity(pIdx: number, weekNum: number): number | null {
    const w = this.pendingParticipants()[pIdx]?.weeks.find(w => w.week_number === weekNum);
    return w?.intensive_activity_id ?? null;
  }

  removeParticipant(idx: number): void {
    this.pendingParticipants.update(list => list.filter((_, i) => i !== idx));
  }

  changeGuestType(idx: number, newType: 'guest' | 'staff_guest' | 'staff'): void {
    this.pendingParticipants.update(list => {
      const updated = [...list];
      updated[idx] = { ...updated[idx], type: newType };
      return updated;
    });
  }

  get activePending(): PendingParticipant[] {
    return this.pendingParticipants().filter(p => p.weeks.length > 0 && !p.outOfRange);
  }

  canConfirm(): boolean { return this.activePending.length > 0; }

  goToConfirm(): void { if (this.canConfirm()) this.wizardStep.set('confirm'); }
  backToParticipants(): void { this.wizardStep.set('participants'); }

  // ── Step 3 ────────────────────────────────────────────────────────────────
  _getCost(type: string, weeksCount: number): number {
    const costs = this.costs();
    const match = costs.find(c => c.participant_type === type && c.weeks_count === weeksCount);
    if (match) return Number(match.total) || 0;
    // Fallback: tarifa W1 × semanas (sin descuento)
    const weekly = costs.find(c => c.participant_type === type && c.weeks_count === 1);
    return weekly ? (Number(weekly.cost_per_week) || 0) * weeksCount : 0;
  }

  formatPendingWeeks(weeks: {week_number: number, intensive_activity_id: number | null}[]): string {
    const sorted = [...weeks].sort((a, b) => a.week_number - b.week_number);
    return sorted.map(w => {
      let lbl = `${w.week_number}`;
      if (w.intensive_activity_id) {
         const act = this.intensiveActivities().find(a => a.id === w.intensive_activity_id);
         if (act) lbl += ` (${act.name})`;
      }
      return lbl;
    }).join(', ');
  }

  /** Total extra de intensivos seleccionados por el participante */
  private _getIntensiveExtraCost(p: PendingParticipant): number {
    const activities = this.intensiveActivities();
    return p.weeks.reduce((sum, w) => {
      if (w.intensive_activity_id) {
        const act = activities.find(a => a.id === w.intensive_activity_id);
        if (act) return sum + (Number(act.extra_cost) || 0);
      }
      return sum;
    }, 0);
  }

  /** Precio lista (sin descuento) para el participante según tipo y semanas */
  participantListPrice(p: PendingParticipant): number {
    const costs = this.costs();
    const match = costs.find(c => c.participant_type === p.type && c.weeks_count === p.weeks.length);
    let base = 0;
    if (match) {
      base = match.list_price ?? match.total;
    } else {
      const weekly = costs.find(c => c.participant_type === p.type && c.weeks_count === 1);
      base = weekly ? weekly.cost_per_week * p.weeks.length : 0;
    }
    return base + this._getIntensiveExtraCost(p);
  }

  /** Descuento absoluto del participante (0 si no hay descuento) */
  participantDiscount(p: PendingParticipant): number {
    return Math.max(0, this.participantListPrice(p) - this.participantCost(p));
  }

  participantCost(p: PendingParticipant): number {
    return this._getCost(p.type, p.weeks.length) + this._getIntensiveExtraCost(p);
  }

  /** Total de descuentos de todos los participantes activos */
  totalDiscount = computed(() =>
    this.pendingParticipants()
      .filter(p => p.weeks.length > 0 && !p.outOfRange && !p.alreadyEnrolled)
      .reduce((sum, p) => sum + this.participantDiscount(p), 0)
  );

  /** Total precio lista de todos los participantes activos */
  totalListPrice = computed(() =>
    this.pendingParticipants()
      .filter(p => p.weeks.length > 0 && !p.outOfRange && !p.alreadyEnrolled)
      .reduce((sum, p) => sum + this.participantListPrice(p), 0)
  );

  saveRegistration(): void {
    const titular = this.selectedTitular();
    const course  = this.selectedCourse();
    if (!titular || !course || !this.activePending.length) return;

    this.saving.set(true);
    // Si el buscado no es el titular real, buscar al titular en su familia
    // Preferir el titular ACTIVO (isinactive=false) si hay más de uno
    const realTitularId = (
      titular.family?.find(f => f.memberType === 'Titular' && !f.isinactive) ??
      titular.family?.find(f => f.memberType === 'Titular')
    )?.id ?? titular.id;
    const payload = {
      titular_id:   realTitularId,
      course_id:    course.id,
      total_amount: this.totalAmount(),
      participants: this.activePending.map(p => ({
        socio_id:        p.socio_id,
        guest_db_id:     p.guest_db_id ?? null,
        type:            p.type,
        weeks:           p.weeks,
        birth_date:      p.birth_date,
        suggested_level: p.suggestedLevel?.level_number ?? null,
        assigned_level:  p.selectedLevel,
        group_id:        p.selectedGroupId,
      })),
    };

    this.svc.register(payload as any).subscribe({
      next: res => {
        this.saving.set(false);
        this.registrationResult.set(res.data);
        // Construir lista de participantes del step done para asignar nivel/grupo
        const tokens: Array<{participantId:string; participantName:string; accessCode:string; enrollmentId:number; suggestedLevel:number|null}>
          = res.data?.pick_up_tokens ?? [];
        this.doneParticipants.set(tokens.map(t => ({
          enrollmentId:    t.enrollmentId,
          participantName: t.participantName,
          accessCode:      t.accessCode,
          suggestedLevel:  t.suggestedLevel ?? null,
          assignedLevel:   null,
          groupId:         null,
          groupAlias:      null,
        })));
        this.wizardStep.set('done');
        this.refreshTable();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Error al registrar');
      },
    });
  }

  // ── Guest modal ───────────────────────────────────────────────────────────
  openGuestModal(): void {
    this.guestModalOpen.set(true);
  }

  closeGuestModal(): void {
    this.guestModalOpen.set(false);
  }

  /**
   * Callback cuando el usuario selecciona/crea un invitado en el modal.
   * Agrega el invitado a la lista de participantes pendientes.
   */
  onGuestSelected(guest: ScGuest): void {
    this.guestModalOpen.set(false);

    // Evitar duplicados
    const guestUniqueId = `guest_${guest.id}`;
    if (this.pendingParticipants().some(p => p.socio_id === guestUniqueId)) {
      this.showToast(`${guest.full_name} ya está en la lista`, 'info');
      return;
    }

    const age = guest.birth_date
      ? (() => {
          const b = new Date(guest.birth_date!);
          const n = new Date();
          let a = n.getFullYear() - b.getFullYear();
          const m = n.getMonth() - b.getMonth();
          if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
          return a;
        })()
      : null;

    const participant: PendingParticipant = {
      socio_id:       guestUniqueId,
      fullName:       guest.full_name,
      type:           'guest',
      weeks:          [],
      birth_date:     guest.birth_date,
      age,
      memberType:     'Invitado',
      alreadyEnrolled: false,
      suggestedLevel:  this._getLevelForAge(age),
      outOfRange:      this._isOutOfRange(age),
      guest_db_id:     guest.id,
      selectedLevel: null, selectedGroupId: null, selectedGroupAlias: null,
    };

    if (this.wizardMode() === 'colaborador') {
      const rel = (guest.relationship || '').toLowerCase();
      if (rel.startsWith('hijo') || rel.startsWith('sobrino') || rel.startsWith('nieto')) {
        participant.type = 'staff';
      } else {
        participant.type = 'staff_guest';
      }
    }

    this.pendingParticipants.update(list => [...list, participant]);
    this.showToast(`${guest.full_name} agregado como invitado`, 'success');
  }

  // ── Level/Group assignment ────────────────────────────────────────────────

  /** Abre/cierra el panel inline de nivel∕grupo del wizard (step 2) */
  togglePendingExpand(idx: number): void {
    this.pendingExpandIdx.set(this.pendingExpandIdx() === idx ? -1 : idx);
  }

  /** Establece el nivel elegido para un pending participant (inline, sin API) */
  setPendingLevel(idx: number, levelNum: number): void {
    this.pendingParticipants.update(list => list.map((p, i) =>
      i === idx ? { ...p, selectedLevel: levelNum, selectedGroupId: null, selectedGroupAlias: null } : p
    ));
    // Cargar grupos si no están cargados aún
    const cId = this.selectedCourse()?.id;
    if (cId) this._loadLevelGroups(cId);
  }

  /** Establece el grupo elegido para un pending participant (inline, sin API) */
  setPendingGroup(idx: number, groupId: number | null, alias: string | null): void {
    this.pendingParticipants.update(list => list.map((p, i) =>
      i === idx ? { ...p, selectedGroupId: groupId, selectedGroupAlias: alias } : p
    ));
    this.pendingExpandIdx.set(-1); // cerrar panel al elegir grupo
  }

  private _loadLevelGroups(courseId: number): void {
    this.enrollSvc.getFormData(courseId).subscribe({
      next: res => this.levelGroupsFD.set(res.data?.level_groups ?? []),
      error: () => {},
    });
  }

  groupsForLevel(levelId: number): LevelGroupFD[] {
    return this.levelGroupsFD().filter(g => g.level_id === levelId);
  }

  openLevelModal(p: ScRegisteredParticipant, titularId: string | null): void {
    this.lvlModalTarget.set({ enrollment_id: p.enrollment_id, titular_id: titularId, current_level: p.assigned_level ?? null });
    this.lvlModalValue.set(p.assigned_level ?? 1);
    this.lvlModalNotes.set('');
    this.lvlModalOpen.set(true);
  }

  closeLevelModal(): void { this.lvlModalOpen.set(false); }

  saveLevelModal(): void {
    // ── Contexto tabla: llamar API ─────────────────────────────────────────
    const target = this.lvlModalTarget();
    if (!target) return;
    this.lvlModalSaving.set(true);
    this.enrollSvc.assignLevel(target.enrollment_id, {
      assigned_level: this.lvlModalValue(),
      level_notes: this.lvlModalNotes() || undefined,
    }).subscribe({
      next: res => {
        const newLevel = res.data?.assigned_level ?? this.lvlModalValue();
        this._patchParticipant(target.titular_id, target.enrollment_id, p => ({
          ...p, assigned_level: newLevel, group_id: null, group_alias: null,
        }));
        this.patchDoneLevel(target.enrollment_id, newLevel);
        this.lvlModalSaving.set(false);
        this.lvlModalOpen.set(false);
        this.showToast('Nivel asignado correctamente ✓', 'success');
      },
      error: err => {
        this.lvlModalSaving.set(false);
        this.showToast(err?.error?.message ?? 'Error al asignar nivel', 'danger');
      },
    });
  }

  openGroupModal(p: ScRegisteredParticipant, titularId: string | null): void {
    if (!p.assigned_level) return;
    this.grpModalTarget.set({ enrollment_id: p.enrollment_id, titular_id: titularId, assigned_level: p.assigned_level });
    this.grpModalValue.set(p.group_id ?? null);
    this.grpModalOpen.set(true);
  }

  closeGroupModal(): void { this.grpModalOpen.set(false); }

  saveGroupModal(): void {
    // ── Contexto tabla: llamar API ─────────────────────────────────────────
    const target = this.grpModalTarget();
    if (!target) return;
    this.grpModalSaving.set(true);
    this.enrollSvc.assignGroup(target.enrollment_id, { group_id: this.grpModalValue() }).subscribe({
      next: res => {
        const newGroupId   = res.data?.group_id ?? this.grpModalValue();
        const matchedGroup = this.levelGroupsFD().find(g => g.id === newGroupId);
        this._patchParticipant(target.titular_id, target.enrollment_id, p => ({
          ...p, group_id: newGroupId ?? null, group_alias: matchedGroup?.alias ?? null,
        }));
        this.patchDoneGroup(target.enrollment_id, newGroupId ?? null, matchedGroup?.alias ?? null);
        this.grpModalSaving.set(false);
        this.grpModalOpen.set(false);
        this.showToast(newGroupId ? 'Grupo asignado correctamente ✓' : 'Grupo removido', 'success');
      },
      error: err => {
        this.grpModalSaving.set(false);
        this.showToast(err?.error?.message ?? 'Error al asignar grupo', 'danger');
      },
    });
  }

  private _patchParticipant(
    titularId: string | null,
    enrollmentId: number,
    patcher: (p: ScRegisteredParticipant) => ScRegisteredParticipant,
  ): void {
    this.registrations.update(groups =>
      groups.map(g => {
        if ((g.titular_id ?? '__none__') !== (titularId ?? '__none__')) return g;
        return { ...g, participants: g.participants.map(p =>
          p.enrollment_id === enrollmentId ? patcher(p) : p
        )};
      })
    );
  }

  // ── Level/Group assignment desde step DONE ───────────────────────────────
  openLevelModalFromDone(dp: DoneParticipant): void {
    this.lvlModalTarget.set({ enrollment_id: dp.enrollmentId, titular_id: null, current_level: dp.assignedLevel });
    this.lvlModalValue.set(dp.assignedLevel ?? dp.suggestedLevel ?? 1);
    this.lvlModalNotes.set('');
    this.lvlModalOpen.set(true);
  }

  openGroupModalFromDone(dp: DoneParticipant): void {
    const level = dp.assignedLevel;
    if (!level) return;
    this.grpModalTarget.set({ enrollment_id: dp.enrollmentId, titular_id: null, assigned_level: level });
    this.grpModalValue.set(dp.groupId);
    this.grpModalOpen.set(true);
  }

  patchDoneLevel(enrollmentId: number, newLevel: number): void {
    this.doneParticipants.update(list => list.map(d =>
      d.enrollmentId === enrollmentId ? { ...d, assignedLevel: newLevel, groupId: null, groupAlias: null } : d
    ));
  }

  patchDoneGroup(enrollmentId: number, groupId: number | null, groupAlias: string | null): void {
    this.doneParticipants.update(list => list.map(d =>
      d.enrollmentId === enrollmentId ? { ...d, groupId, groupAlias } : d
    ));
  }

  // ── Kit delivery ─────────────────────────────────────────────────────────
  private _loadKits(courseId: number): void {
    this.kitLoading.set(true);
    this.kitSvc.getStatus(courseId).subscribe({
      next: res => {
        this.kitItems.set(res.data?.items ?? []);
        this.kitSummary.set(res.data?.summary ?? { total: 0, delivered: 0, pending: 0 });
        this.kitLoading.set(false);
      },
      error: () => this.kitLoading.set(false),
    });
  }

  kitGroupItems(group: ScRegistrationGroup): ScKitDeliveryItem[] {
    const ids = new Set(group.participants.map(p => p.enrollment_id));
    return this.kitItems().filter(i => ids.has(i.enrollment_id));
  }

  kitDeliveredCount(group: ScRegistrationGroup): number {
    return this.kitGroupItems(group).filter(i => i.kit_delivered).length;
  }

  kitGroupStatus(group: ScRegistrationGroup): 'none' | 'partial' | 'all' {
    const items = this.kitGroupItems(group);
    if (!items.length) return 'none';
    const delivered = items.filter(i => i.kit_delivered).length;
    if (delivered === 0) return 'none';
    return delivered === items.length ? 'all' : 'partial';
  }

  openKitModal(group: ScRegistrationGroup, event: Event): void {
    event.stopPropagation();
    const items = this.kitGroupItems(group);
    const pendingIds = new Set(items.filter(i => !i.kit_delivered).map(i => i.enrollment_id));
    this.kitModalGroup.set(group);
    this.kitGroupChecked.set(new Set(pendingIds));
    this.kitReceivedBy.set('');
    this.kitNotes.set('');
    this.kitModalOpen.set(true);
  }

  kitCloseModal(): void { this.kitModalOpen.set(false); }

  toggleKitCheck(enrollmentId: number): void {
    this.kitGroupChecked.update(s => {
      const next = new Set(s);
      next.has(enrollmentId) ? next.delete(enrollmentId) : next.add(enrollmentId);
      return next;
    });
  }

  confirmKitDelivery(): void {
    const receivedBy = this.kitReceivedBy().trim();
    if (!receivedBy) { this.showToast('El nombre de quien recibe es requerido', 'danger'); return; }

    const courseId   = this.selectedCourse()!.id;
    const checkedIds = this.kitGroupChecked();
    const items      = this.kitGroupItems(this.kitModalGroup()!).filter(i => !i.kit_delivered && checkedIds.has(i.enrollment_id));
    if (!items.length) { this.showToast('No hay participantes seleccionados', 'danger'); return; }

    this.kitSaving.set(true);
    let done = 0; let delivered = 0;
    items.forEach(item => {
      this.kitSvc.deliver({
        enrollment_id:    item.enrollment_id,
        received_by_name: receivedBy,
        notes:            this.kitNotes() || undefined,
      }).subscribe({
        next: () => {
          delivered++;
          if (++done === items.length) {
            this.kitSaving.set(false);
            this.kitCloseModal();
            this.showToast(`${delivered} kit${delivered > 1 ? 's' : ''} marcado${delivered > 1 ? 's' : ''} como entregado${delivered > 1 ? 's' : ''} ✓`, 'success');
            this._loadKits(courseId);
          }
        },
        error: err => {
          if (++done === items.length) {
            this.kitSaving.set(false);
            this.showToast(err?.error?.message ?? 'Error al registrar entrega', 'danger');
            this._loadKits(courseId);
          }
        },
      });
    });
  }

  kitFormatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  paymentClass(s: string): string {
    return ({ paid:'badge-success', pending:'badge-warning', partial:'badge-info', cancelled:'badge-danger' })[s] ?? 'badge-secondary';
  }

  paymentLabel(s: string): string {
    return ({ paid:'Pagado', pending:'Pendiente', partial:'Parcial', cancelled:'Cancelado' })[s] ?? s;
  }

  typeLabel(t: string): string {
    return this.participantTypes.find(x => x.value === t)?.label ?? t;
  }

  changeWeekIntensiveActivity(enrollmentWeekId: number | undefined, activityIdStr: string): void {
    if (!enrollmentWeekId) return;
    const newActivityId = activityIdStr ? parseInt(activityIdStr, 10) : null;
    this.svc.updateWeekIntensiveActivity(enrollmentWeekId, newActivityId).subscribe({
      next: () => {
        this.showToast('Actividad intensiva actualizada', 'success');
        this._loadRegistrations(this.selectedCourse()!.id);
      },
      error: () => this.showToast('Error al actualizar la actividad', 'danger')
    });
  }

  weekChips(weeks: Array<{week_number: number; label: string; intensive_activity_id?: number | null; intensive_activity_name?: string | null; enrollment_week_id?: number}>): Array<{short: string; dates: string; intensiveActivityId?: number | null; intensiveActivityName?: string | null; enrollmentWeekId?: number}> {
    if (!weeks.length) return [];
    return weeks.map(w => {
      const courseWeek = this.courseWeeks.find(cw => cw.week_number === w.week_number);
      const dates = courseWeek
        ? this._fmtWeekRange(courseWeek.start_date, courseWeek.end_date)
        : (w.label ?? '');
      return { short: `Sem ${w.week_number}`, dates, intensiveActivityId: w.intensive_activity_id, intensiveActivityName: w.intensive_activity_name, enrollmentWeekId: w.enrollment_week_id };
    });
  }

  private _fmtWeekRange(start: string, end: string): string {
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const s = new Date(start.substring(0, 10) + 'T12:00:00');
    const e = new Date(end.substring(0, 10)   + 'T12:00:00');
    const dS = s.getDate();
    const dE = e.getDate();
    const mS = months[s.getMonth()];
    const mE = months[e.getMonth()];
    return mS === mE ? `${dS}–${dE} ${mS}` : `${dS} ${mS}–${dE} ${mE}`;
  }

  currency(val: number): string {
    return '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 0 });
  }

  showToast(msg: string, type: 'success'|'danger'|'info' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 4000);
  }

  clearError(): void { this.error.set(null); }

  levelByNumber(n: number | null | undefined): ScLevel | null {
    if (n == null) return null;
    return this.levels().find(l => l.level_number === n) ?? null;
  }

  // ── Credenciales ──────────────────────────────────────────────────────────

  private _loadCredentials(courseId: number): void {
    this.credLoading.set(true);
    this.credSvc.getStatus(courseId).subscribe({
      next: res => {
        this.credItems.set(res.data?.items ?? []);
        this.credLoading.set(false);
      },
      error: () => this.credLoading.set(false),
    });
  }

  /** Retorna el item de credencial para un enrollment_id */
  credForEnrollment(enrollmentId: number): ScCredentialDeliveryItem | undefined {
    return this.credItems().find(i => i.enrollment_id === enrollmentId);
  }

  /** Items de credencial para todos los participantes del grupo */
  credGroupItems(group: ScRegistrationGroup): ScCredentialDeliveryItem[] {
    const ids = new Set(group.participants.map(p => p.enrollment_id));
    return this.credItems().filter(i => ids.has(i.enrollment_id));
  }

  /** Cuántos participantes del grupo ya tienen foto */
  photoGroupCount(group: ScRegistrationGroup): number {
    return this.credGroupItems(group).filter(i => i.has_photo).length;
  }

  /** Estado de fotos del grupo: none | partial | all */
  photoGroupStatus(group: ScRegistrationGroup): 'none' | 'partial' | 'all' {
    const items = this.credGroupItems(group);
    if (!items.length) return 'none';
    const count = items.filter(i => i.has_photo).length;
    if (count === 0) return 'none';
    if (count === items.length) return 'all';
    return 'partial';
  }

  /** Cuántas credenciales entregadas en el grupo */
  credGroupCount(group: ScRegistrationGroup): number {
    return this.credGroupItems(group).filter(i => i.credential_delivered).length;
  }

  /** Estado de credenciales del grupo: none | partial | all */
  credGroupStatus(group: ScRegistrationGroup): 'none' | 'partial' | 'all' {
    const items = this.credGroupItems(group);
    if (!items.length) return 'none';
    const count = items.filter(i => i.credential_delivered).length;
    if (count === 0) return 'none';
    if (count === items.length) return 'all';
    return 'partial';
  }

  /** Abre el modal de foto del primer participante sin foto del grupo */
  openPhotoModalGroup(group: ScRegistrationGroup, event: Event): void {
    event.stopPropagation();
    const items   = this.credGroupItems(group);
    const pending = group.participants.find(p => {
      const ci = items.find(i => i.enrollment_id === p.enrollment_id);
      return !ci?.has_photo;
    }) ?? group.participants[0];
    if (pending) this.openPhotoModal(pending, group, event);
  }

  /** Abre el modal de credencial del primer participante con foto pero sin credencial entregada */
  openCredentialModalGroup(group: ScRegistrationGroup, event: Event): void {
    event.stopPropagation();
    const items   = this.credGroupItems(group);
    const pending = group.participants.find(p => {
      const ci = items.find(i => i.enrollment_id === p.enrollment_id);
      return ci?.has_photo && !ci?.credential_delivered;
    }) ?? group.participants.find(p => {
      const ci = items.find(i => i.enrollment_id === p.enrollment_id);
      return ci?.has_photo;
    }) ?? group.participants[0];
    if (pending) this.openCredentialModal(pending, event);
  }

  // ── Modal de Fotografía ───────────────────────────────────────────────────

  photoModalCredData = signal<any>(null);
  photoModalCredLoading = signal<boolean>(false);

  openPhotoModal(p: ScRegisteredParticipant, group: ScRegistrationGroup, event: Event): void {
    event.stopPropagation();
    this.photoModalParticipant.set(p);
    this.photoModalGroupTitular.set(group);
    this.photoPreviewUrl.set(null);
    this.photoCameraMode.set('camera');
    this.photoModalOpen.set(true);
    
    // Cargar previsualización de credencial
    this.photoModalCredLoading.set(true);
    this.photoModalCredData.set(null);
    this.credSvc.getPreview(p.participant_id, this.selectedCourse()!.id).subscribe({
      next: res => {
        this.photoModalCredData.set(res.data);
        this.photoModalCredLoading.set(false);
      },
      error: () => this.photoModalCredLoading.set(false)
    });
    
    // Iniciar cámara automáticamente
    setTimeout(() => {
      const videoEl = document.querySelector('video.photo-video') as HTMLVideoElement;
      if (videoEl) {
        this.startCamera(videoEl);
      }
    }, 50);
  }

  closePhotoModal(): void {
    this._stopCamera();
    this.photoModalOpen.set(false);
    this.photoModalParticipant.set(null);
    this.photoPreviewUrl.set(null);
  }

  async startCamera(videoEl: HTMLVideoElement): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      this.photoCameraStream.set(stream);
      videoEl.srcObject = stream;
    } catch {
      this.showToast('No se pudo acceder a la cámara', 'danger');
      this.photoCameraMode.set('file');
    }
  }

  capturePhoto(videoEl: HTMLVideoElement): void {
    const canvas = document.createElement('canvas');
    canvas.width  = videoEl.videoWidth  || 640;
    canvas.height = videoEl.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0);
    this.photoPreviewUrl.set(canvas.toDataURL('image/jpeg', 0.85));
    this._stopCamera();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => this.photoPreviewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  savePhoto(): void {
    const base64 = this.photoPreviewUrl();
    const p      = this.photoModalParticipant();
    if (!base64 || !p) return;

    this.photoSaving.set(true);
    this.credSvc.uploadPhoto(p.participant_id, base64).subscribe({
      next: () => {
        this.photoSaving.set(false);
        this.closePhotoModal();
        this.showToast('Fotografía guardada correctamente ✓', 'success');
        const courseId = this.selectedCourse()!.id;
        this._loadCredentials(courseId);
      },
      error: err => {
        this.photoSaving.set(false);
        this.showToast(err?.error?.message ?? 'Error al guardar la fotografía', 'danger');
      },
    });
  }

  _stopCamera(): void {
    this.photoCameraStream()?.getTracks().forEach(t => t.stop());
    this.photoCameraStream.set(null);
  }

  // ── Modal de Credencial ───────────────────────────────────────────────────

  openCredentialModal(p: ScRegisteredParticipant, event: Event): void {
    event.stopPropagation();
    this.credParticipant.set(p);
    this.credModalOpen.set(true);
    this.credModalData.set(null);
    this.credModalLoading.set(true);
    this.credNotes.set('');

    const courseId = this.selectedCourse()!.id;
    this.credSvc.getPreview(p.participant_id, courseId).subscribe({
      next: res => {
        this.credModalData.set(res.data);
        this.credModalLoading.set(false);
      },
      error: () => {
        this.credModalLoading.set(false);
        this.showToast('Error al cargar datos de la credencial', 'danger');
      },
    });
  }

  openAuthorizedPickupsModal(p: ScRegisteredParticipant, event: Event): void {
    event.stopPropagation();
    const participantInfo = {
       id: p.participant_id,
       full_name: p.full_name,
       socio_id: p.socio_id,
       titular_id: p.titular_id
    };
    this.authorizedPickupsParticipant.set(participantInfo as any);
  }

  copyPortalLink(event: Event): void {
    event.stopPropagation();
    const url = window.location.origin + '/tutor-portal/login';
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('Liga del portal copiada al portapapeles', 'success');
    }).catch(() => {
      this.showToast('Error al copiar la liga', 'danger');
    });
  }

  closeCredentialModal(): void {
    this.credModalOpen.set(false);
    this.credModalData.set(null);
  }

  /** Base URL para archivos estáticos del webroot */
  printCredential(): void {
    const data = this.credModalData();
    const card = document.querySelector('.credential-card') as HTMLElement | null;
    if (!card) return;

    const openPrintWindow = (cardHtml: string) => {
      const win = window.open('', '_blank', 'width=350,height=550');
      if (!win) return;
      
      let stylesHtml = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        stylesHtml += el.outerHTML;
      });

      win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Credencial - ${data?.full_name || ''}</title>
${stylesHtml}
<style>
  @page { size: 54mm 85mm; margin: 0; }
  body { margin: 0; padding: 0; background: white; display: flex; justify-content: center; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .credential-card {
    transform: none !important;
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
  }
</style>
</head>
<body>
  ${cardHtml}
</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 600);
    };

    const toBase64 = (url: string): Promise<string> =>
      fetch(url)
        .then(r => r.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));

    const logoUrl = '/assets/images/ARZ_SUITE_HORIZONTAL.png';
    const courseLogoUrl = '/assets/images/logocurso2026.webp';
    const photoUrl = data?.photo_url ? this.photoBaseUrl() + data.photo_url : null;

    const logoP = toBase64(logoUrl).catch(() => null);
    const courseLogoP = toBase64(courseLogoUrl).catch(() => null);
    const photoP = photoUrl ? toBase64(photoUrl).catch(() => null) : Promise.resolve(null);

    Promise.all([logoP, courseLogoP, photoP]).then(([logoB64, courseLogoB64, photoB64]) => {
      let html = card.outerHTML;
      if (logoB64) {
        html = html.replace(/src="\/assets\/images\/ARZ_SUITE_HORIZONTAL\.png"/g, `src="${logoB64}"`);
      }
      if (courseLogoB64) {
        html = html.replace(/src="\/assets\/images\/logocurso2026\.webp"/g, `src="${courseLogoB64}"`);
      }
      if (photoB64) {
        html = html.replace(/<img[^>]*class="cred-photo-img"[^>]*src="([^"]+)"[^>]*>/, (match, p1) => {
          return match.replace(p1, photoB64);
        });
      }
      openPrintWindow(html);
    });
  }

  markCredentialDelivered(): void {
    const data = this.credModalData();
    if (!data?.enrollment_id) return;

    this.credSaving.set(true);
    this.credSvc.deliver({
      enrollment_id: data.enrollment_id,
      notes: this.credNotes() || undefined,
    }).subscribe({
      next: () => {
        this.credSaving.set(false);
        this.closeCredentialModal();
        this.showToast('Credencial marcada como entregada ✓', 'success');
        this._loadCredentials(this.selectedCourse()!.id);
      },
      error: err => {
        this.credSaving.set(false);
        this.showToast(err?.error?.message ?? 'Error al registrar entrega', 'danger');
      },
    });
  }
}
