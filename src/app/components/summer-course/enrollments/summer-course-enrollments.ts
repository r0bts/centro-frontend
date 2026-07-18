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
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';
import Swal from 'sweetalert2';
import { ScKitDeliveriesService }   from '../../../services/summer-course/sc-kit-deliveries.service';
import { ScCredentialDeliveriesService } from '../../../services/summer-course/sc-credential-deliveries.service';
import { ScEnrollmentsService }     from '../../../services/summer-course/sc-enrollments.service';
import { ScGuestSyncService }       from '../../../services/summer-course/sc-guest-sync.service';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
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
  ScCredentialReplacementResult,
  ScIntensiveActivity,
  ScEnrollmentWeek,
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
  isReEnrollment: boolean;  // inscrito con pago => se permite agregar semanas
  participant_id: number | null; // ID real en sc_participants si ya estaba inscrito
  suggestedLevel: ScLevel | null;
  outOfRange: boolean;  // age < 3 o age > 15 o sin fecha
  guest_db_id?: number; // ID real en summer_course_guests (solo para invitados)
  emergency_phone: string | null;
  lockedWeekNumbers: number[];  // semanas ya inscritas (paid) — no se pueden desmarcar
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
  private guestSvc     = inject(ScGuestSyncService);
  private userSvc      = inject(UserService);
  private authSvc      = inject(AuthService);
  private scannerSvc   = inject(SummerCourseScannerService);

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
  photoCameraStream = signal<MediaStream | null>(null);
  photoCameraFacingMode = signal<'user' | 'environment'>('user');
  photoPreviewUrl       = signal<string | null>(null);   // base64 capturado antes de guardar
  photoSaving           = signal(false);
  photoCameraMode       = signal<'camera' | 'file'>('camera');

  // ── Credencial ────────────────────────────────────────────────────────────
  credItems         = signal<ScCredentialDeliveryItem[]>([]);
  credLoading       = signal(false);
  credModalOpen     = signal(false);
  credModalData     = signal<ScCredentialPreview | null>(null);
  credModalLoading  = signal(false);
  credSaving        = signal(false);
  credNotes         = signal('');
  credReplacementLoading = signal(false);
  credReplacementResult  = signal<ScCredentialReplacementResult | null>(null);
  credReplacementList    = signal<ScCredentialReplacementResult[]>([]);
  credReplacementSyncing = signal(false);
  credDeliveringId       = signal<number | null>(null); // id de la reposición que se está entregando

  // ── Edit weeks ────────────────────────────────────────────────────────────
  canEditWeeks           = signal<boolean>(false);
  canPrintFormato        = signal<boolean>(false);
  canExportCsv           = signal<boolean>(false);
  // ── Export CSV signals ────────────────────────────────────────────────────
  exportFilter           = signal<'all' | 'day' | 'week' | 'month'>('all');
  exportDate             = signal<string>('');
  exportWeekId           = signal<number>(0);
  exportMonth            = signal<string>('');
  // ── Género inline ────────────────────────────────────────────────────────
  updatingGenderId       = signal<number | null>(null);
  // ── Edit guest signals ─────────────────────────────────────────────────
  editGuestOpen          = signal(false);
  editGuestData          = signal<ScGuest | null>(null);
  editGuestLoading       = signal(false);
  // ── Wizard: validación teléfono ─────────────────────────────────────────
  confirmAttempted       = signal(false);
  // ── Bypass de límite de edad ─────────────────────────────────────────
  canBypassAge           = signal<boolean>(false);
  editWeeksParticipant   = signal<ScRegisteredParticipant | null>(null);  // participante en modal
  editWeeksIds           = signal<number[]>([]);          // selección actual (sc_week ids)
  editWeeksSaving        = signal(false);
  editWeeksDetail        = signal<ScEnrollmentWeek[]>([]);  // semanas con payment_status

  get editingWeeksForId(): number | null { return this.editWeeksParticipant()?.enrollment_id ?? null; }

  /** Calcula el nuevo total de paquete dado el participant_type y N semanas seleccionadas */
  editWeeksNewTotal = computed(() => {
    const p = this.editWeeksParticipant();
    if (!p) return 0;
    const n = this.editWeeksIds().length;
    if (n === 0) return 0;
    const ptype = p.participant_type;
    const match = this.costs().find(c => c.participant_type === ptype && c.weeks_count === n);
    if (match) return match.total;
    const base = this.costs().find(c => c.participant_type === ptype && c.weeks_count === 1);
    return base ? base.cost_per_week * n : 0;
  });

  /** IDs de semanas que se agregarán (nuevas) */
  editWeeksAdded = computed(() => {
    const origIds = this.editWeeksDetail().map(w => w.week_id);
    return this.editWeeksIds().filter(id => !origIds.includes(id));
  });

  /** IDs de semanas que se eliminarán (removidas) */
  editWeeksRemoved = computed(() => {
    const newIds = this.editWeeksIds();
    return this.editWeeksDetail().map(w => w.week_id).filter(id => !newIds.includes(id));
  });

  /** Etiqueta de una semana del curso por su id */
  courseWeekLabel(weekId: number): string {
    return (this.selectedCourse()?.sc_weeks ?? []).find(w => w.id === weekId)?.label ?? `Semana ${weekId}`;
  }

  editWeeksAddedLabels(): string {
    return this.editWeeksAdded().map(id => this.courseWeekLabel(id)).join(', ');
  }

  editWeeksRemovedLabels(): string {
    return this.editWeeksRemoved().map(id => this.courseWeekLabel(id)).join(', ');
  }
  
  // ── Enviar Liga ───────────────────────────────────────────────────────────
  sendingLinkMap    = signal<Record<number, boolean>>({});

  // ── Permisos ──────────────────────────────────────────────────────────────
  canAdd                = signal<boolean>(false);

  // ── Level / Group assignment ──────────────────────────────────────────────
  canReasignar          = signal<boolean>(false);
  canVerPagos           = signal<boolean>(false);
  syncingEnrollmentId   = signal<number | null>(null);
  levelGroupsFD     = signal<LevelGroupFD[]>([]);

  lvlModalOpen           = signal(false);
  lvlModalTarget         = signal<LvlModalTarget | null>(null);
  lvlModalValue          = signal<number>(1);
  lvlModalSuggestedLevel = signal<number | null>(null);
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
  wizardMode         = signal<'socio'|'colaborador'|'colaborador_externo'>('socio');
  createNsOrder      = signal(false);
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
      .filter(p => p.weeks.length > 0 && !p.outOfRange)
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
    if (this.canBypassAge()) return false;  // bypass total con permiso
    if (age === null) return true;
    return age < this.MIN_AGE || age > this.MAX_AGE;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.canAdd.set(this.authSvc.hasPermission('sc.enrollments', 'create'));
    this.canReasignar.set(this.authSvc.hasPermission('sc.enrollments', 'reasignacion_grupo'));
    this.canVerPagos.set(this.authSvc.hasPermission('sc.enrollments', 'ver_pagos_inscritos'));
    this.canEditWeeks.set(this.authSvc.hasPermission('sc.enrollments', 'edit_weeks'));
    this.canPrintFormato.set(this.authSvc.hasPermission('sc.enrollments', 'imprimir_formato_colaborador'));
    this.canExportCsv.set(this.authSvc.hasPermission('sc.enrollments', 'exportar_csv'));
    this.canBypassAge.set(this.authSvc.hasPermission('sc.enrollments', 'inscribir_sin_limite_edad'));

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
          this._loadLevelGroups();
          this._loadCosts(); // pre-cargar costos para el modal de edición de semanas
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
      next: (res: any) => {
        let results: ScSocioSearchResult[] = res?.data ?? [];
        if (this.wizardMode() === 'colaborador_externo') {
          results = results.filter(s => 
            s.membershipNumber?.toUpperCase().startsWith('CL') || 
            s.fullName.toUpperCase().startsWith('CL')
          );
        }
        this.searchResults.set(results); 
        this.searching.set(false); 
      },
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
        // Búsqueda exacta por número de empleado — evita falsos positivos con LIKE
        return this.userSvc.getAllUsers(2, 1, q, true);
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
      this._loadLevelGroups();
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
    this.setWizardMode('socio');
    this.pendingParticipants.set([]);
    this.registrationResult.set(null);
    this.doneParticipants.set([]);
    this._loadCosts();
  }

  setWizardMode(mode: 'socio'|'colaborador'|'colaborador_externo'): void {
    this.wizardMode.set(mode);
    this.colaboradorNo.set('');
    this.colaboradorName.set('');
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedTitular.set(null);
    this.createNsOrder.set(false);
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

  private _ageAtCourseStart(birthDateStr: string | null): number | null {
    if (!birthDateStr) return null;
    const course = this.selectedCourse();
    const ref    = course?.start_date ? new Date(course.start_date) : new Date();
    const birth  = new Date(birthDateStr);
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : null;
  }

  selectTitular(s: ScSocioSearchResult): void {
    this.selectedTitular.set(s);
    this.searchResults.set([]);

    const tType = this.wizardMode() === 'colaborador_externo' ? 'staff' : 'member';

    // Find the real Titular's phone (either the queried member, or a family member marked as Titular)
    let realTitularPhone = s.phone;
    const realTitularInFamily = s.family.find(f => f.memberType === 'Titular');
    if (realTitularInFamily && realTitularInFamily.phone) {
        realTitularPhone = realTitularInFamily.phone;
    }
    const defaultPhone = realTitularPhone ?? null;

    const titular: PendingParticipant = {
      socio_id: s.id, fullName: s.fullName, type: tType,
      weeks: [], birth_date: s.birth_date, age: s.age,
      memberType: 'Titular', alreadyEnrolled: s.enrolled,
      isReEnrollment: s.enrolled, // Tratamos cualquier enrollado previo como re-enrollment para ui
      participant_id: s.participant_id ?? null,
      suggestedLevel: this._getLevelForAge(s.age),
      outOfRange: this._isOutOfRange(s.age),
      emergency_phone: s.emergency_phone ?? s.phone ?? defaultPhone,
      lockedWeekNumbers: s.enrolled ? (s.enrolled_week_numbers ?? []) : [],
      selectedLevel: null, selectedGroupId: null, selectedGroupAlias: null,
    };
    const family: PendingParticipant[] = s.family.map(f => ({
      socio_id: f.id, fullName: f.fullName, type: tType as 'member'|'staff',
      weeks: [], birth_date: f.birth_date, age: f.age,
      memberType: f.memberType, alreadyEnrolled: f.enrolled,
      isReEnrollment: f.enrolled,
      participant_id: f.participant_id ?? null,
      suggestedLevel: this._getLevelForAge(f.age),
      outOfRange: this._isOutOfRange(f.age),
      emergency_phone: f.emergency_phone ?? f.phone ?? defaultPhone,
      lockedWeekNumbers: f.enrolled ? (f.enrolled_week_numbers ?? []) : [],
      selectedLevel: null, selectedGroupId: null, selectedGroupAlias: null,
    }));
    
    // Un colaborador no se inscribe a sí mismo, solo a sus invitados (family)
    if (this.wizardMode() === 'colaborador' || this.wizardMode() === 'colaborador_externo') {
      this.pendingParticipants.set([...family]);
    } else {
      this.pendingParticipants.set([titular, ...family]);
    }
    
    this.wizardStep.set('participants');
  }

  selectColaborador(): void {
    const colNo = this.colaboradorNo().trim();
    if (!colNo) {
      this.showToast('El número de empleado es requerido', 'danger');
      return;
    }
    
    this.colaboradorLoading.set(true);
    const courseId = this.selectedCourse()?.id;
    this.svc.searchSocios('EMP-' + colNo, courseId).subscribe({
      next: (res: any) => {
        this.colaboradorLoading.set(false);
        if (res.success && res.data && res.data.length > 0) {
          const s = res.data[0];
          // Use the provided name if it's not a real user yet? Actually the backend will return the real name.
          if (this.colaboradorName().trim()) {
             s.fullName = this.colaboradorName().trim();
          }
          this.selectTitular(s);
        } else {
          // Si el colaborador no existe en backend (no se ha logueado / no hay tabla users), mock fallback
          let colName = this.colaboradorName().trim();
          if (!colName) colName = 'Colaborador #' + colNo;
          
          const s: ScSocioSearchResult = {
            id: 'EMP-' + colNo,
            fullName: colName,
            membershipNumber: 'EMP-' + colNo,
            birth_date: null,
            age: null,
            enrolled: false,
            family: []
          };
          this.selectTitular(s);
        }
      },
      error: () => {
        this.colaboradorLoading.set(false);
        this.showToast('Error al buscar colaborador', 'danger');
      }
    });
  }

  isEmp(group: ScRegistrationGroup): boolean {
    return typeof group.titular_id === 'string' && group.titular_id.startsWith('EMP-');
  }

  enrollMoreWeeks(group: ScRegistrationGroup, p: ScRegisteredParticipant): void {
    const isEmp = this.isEmp(group);
    
    // Set wizard mode
    this.wizardMode.set(isEmp ? 'colaborador' : 'socio');
    if (isEmp) {
      this.colaboradorNo.set((group.titular_id as string).replace('EMP-', ''));
      this.colaboradorName.set(group.titular_name ?? '');
    } else {
      this.searchQuery.set(String(group.titular_id ?? ''));
    }

    // Instead of calling backend, build mock search result
    const titularIdStr = String(group.titular_id ?? '');
    const familyMemberId = p.participant_type === 'guest' || p.participant_type === 'staff_guest' 
      ? `guest_${p.guest_id}` 
      : `emp_part_${p.participant_id}`;

    // Collect locked weeks
    const lockedWeeks = (p.weeks ?? [])
      .filter(w => w.week_number != null)
      .map(w => w.week_number!);

    const mockFamily = [{
      id: familyMemberId,
      fullName: p.full_name,
      memberType: p.participant_type === 'guest' || p.participant_type === 'staff_guest' ? 'Invitado' : 'Familiar',
      birth_date: p.birth_date,
      age: this._ageAtCourseStart(p.birth_date ?? null),
      email: null,
      phone: p.phone ?? null,
      enrolled: true,
      enrolled_status: p.payment_status ?? 'pending',
      enrolled_week_numbers: lockedWeeks,
      participant_id: p.participant_id
    }];

    const mockResult: ScSocioSearchResult = {
      id: titularIdStr,
      fullName: group.titular_name ?? 'Titular',
      membershipNumber: titularIdStr,
      birth_date: null,
      age: null,
      enrolled: false,
      family: mockFamily
    };

    // Open Wizard
    this.wizardOpen.set(true);
    
    // Inject directly into step 2
    this.selectTitular(mockResult);
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
    if (p?.outOfRange || p?.lockedWeekNumbers.includes(weekNum)) return;
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

  canConfirm(): boolean {
    const active = this.activePending;
    if (!active.length) return false;
    return active.every(p => p.emergency_phone && p.emergency_phone.trim().length >= 8);
  }

  goToConfirm(): void {
    this.confirmAttempted.set(true);
    if (this.canConfirm()) this.wizardStep.set('confirm');
  }
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
      .filter(p => p.weeks.length > 0 && !p.outOfRange)
      .reduce((sum, p) => sum + this.participantDiscount(p), 0)
  );

  /** Total precio lista de todos los participantes activos */
  totalListPrice = computed(() =>
    this.pendingParticipants()
      .filter(p => p.weeks.length > 0 && !p.outOfRange)
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
      create_ns_order: this.wizardMode() === 'colaborador_externo' ? this.createNsOrder() : true,
      participants: this.activePending.map(p => ({
        socio_id:        p.socio_id,
        participant_id:  p.participant_id,
        guest_db_id:     p.guest_db_id ?? null,
        emergency_phone: p.emergency_phone ?? null,
        type:            p.type,
        weeks:           p.weeks,
        birth_date:      p.birth_date,
        suggested_level: p.suggestedLevel?.level_number ?? null,
        assigned_level:  p.selectedLevel,
        group_id:        p.weeks.some(w => w.intensive_activity_id) ? null : p.selectedGroupId,
      })),
    };

    this.svc.register(payload as any).subscribe({
      next: res => {
        this.saving.set(false);
        this.registrationResult.set(res.data);
        // Construir lista de participantes del step done para asignar nivel/grupo
        const tokens: Array<{participantId:string; participantName:string; accessCode:string; enrollmentId:number; suggestedLevel:number|null; assignedLevel:number|null; groupId:number|null}>
          = res.data?.pick_up_tokens ?? [];
        this.doneParticipants.set(tokens.map(t => ({
          enrollmentId:    t.enrollmentId,
          participantName: t.participantName,
          accessCode:      t.accessCode,
          suggestedLevel:  t.suggestedLevel ?? null,
          assignedLevel:   t.assignedLevel  ?? null,
          groupId:         t.groupId        ?? null,
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

  /** Abre el modal de edición para el invitado de un participante inscrito */
  openEditGuest(p: ScRegisteredParticipant): void {
    if (!p.guest_id) return;
    this.editGuestLoading.set(true);
    this.guestSvc.getGuestById(p.guest_id).subscribe({
      next: r => {
        this.editGuestLoading.set(false);
        if (r.data?.guest) {
          this.editGuestData.set(r.data.guest);
          this.editGuestOpen.set(true);
        }
      },
      error: () => {
        this.editGuestLoading.set(false);
        this.showToast('Error al cargar los datos del invitado', 'danger');
      },
    });
  }

  /** Alias para llamadas desde la plantilla en la lista de inscritos */
  editGuestName(p: ScRegisteredParticipant, _event?: Event): void {
    this.openEditGuest(p);
  }

  /** Valida que el teléfono tenga al menos 10 dígitos numéricos */
  isPhoneValid(phone: string | null | undefined): boolean {
    if (!phone) return false;
    return (phone.replace(/\D/g, '').length >= 10);
  }

  closeEditGuest(): void {
    this.editGuestOpen.set(false);
    this.editGuestData.set(null);
  }

  /** Callback cuando el modal de edición guarda correctamente */
  onGuestUpdated(updatedGuest: ScGuest): void {
    // Actualizar el nombre en la lista de inscritos si cambió
    this.registrations.update(regs =>
      regs.map(reg => ({
        ...reg,
        participants: reg.participants.map(p =>
          p.guest_id === updatedGuest.id
            ? { ...p, full_name: updatedGuest.full_name }
            : p
        ),
      }))
    );
    this.closeEditGuest();
    this.showToast(`${updatedGuest.full_name} actualizado correctamente`, 'success');
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
      alreadyEnrolled: !!guest.enrolled,
      isReEnrollment:  !!guest.enrolled,
      participant_id:  guest.participant_id ?? null,
      suggestedLevel:  this._getLevelForAge(age),
      outOfRange:      this._isOutOfRange(age),
      guest_db_id:     guest.id,
      emergency_phone: guest.emergency_phone ?? null,
      lockedWeekNumbers: guest.enrolled ? (guest.enrolled_week_numbers ?? []) : [],
      selectedLevel: null, selectedGroupId: null, selectedGroupAlias: null,
    };

    if (this.wizardMode() === 'colaborador' || this.wizardMode() === 'colaborador_externo') {
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
  setEmergencyPhone(idx: number, phone: string): void {
    this.pendingParticipants.update(list => {
      const updated = [...list];
      updated[idx] = { ...updated[idx], emergency_phone: phone };
      return updated;
    });
  }

  setPendingLevel(idx: number, levelNum: number): void {
    this.pendingParticipants.update(list => list.map((p, i) =>
      i === idx ? { ...p, selectedLevel: levelNum, selectedGroupId: null, selectedGroupAlias: null } : p
    ));
    // Cargar grupos globales si no están cargados aún
    if (this.levelGroupsFD().length === 0) this._loadLevelGroups();
  }

  /** Establece el grupo elegido para un pending participant (inline, sin API) */
  setPendingGroup(idx: number, groupId: number | null, alias: string | null): void {
    this.pendingParticipants.update(list => list.map((p, i) =>
      i === idx ? { ...p, selectedGroupId: groupId, selectedGroupAlias: alias } : p
    ));
    this.pendingExpandIdx.set(-1); // cerrar panel al elegir grupo
  }

  private _loadLevelGroups(): void {
    this.enrollSvc.getFormData().subscribe({
      next: res => this.levelGroupsFD.set(res.data?.level_groups ?? []),
      error: () => {},
    });
  }

  groupsForLevel(levelId: number | null): LevelGroupFD[] {
    if (!levelId) return [];
    return this.levelGroupsFD().filter(g => g.level_id === levelId || g.level_id === 99);
  }

  openLevelModal(p: ScRegisteredParticipant, titularId: string | null): void {
    this.lvlModalTarget.set({ enrollment_id: p.enrollment_id, titular_id: titularId, current_level: p.assigned_level ?? null });
    const suggestedByAge = this._getLevelForAge(this._ageAtCourseStart(p.birth_date ?? null))?.level_number ?? null;
    this.lvlModalSuggestedLevel.set(suggestedByAge);
    this.lvlModalValue.set(p.assigned_level ?? suggestedByAge ?? 1);
    this.lvlModalNotes.set('');
    if (this.levelGroupsFD().length === 0) this._loadLevelGroups();
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
    // Si no tiene grupo asignado, sugerir el equitativo automáticamente
    if (!p.group_id) {
      this.enrollSvc.suggestGroup(p.assigned_level).subscribe({
        next: res => {
          if (res.data?.group_id && !this.grpModalValue()) {
            this.grpModalValue.set(res.data.group_id);
          }
        },
        error: () => {}
      });
    }
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

  syncOnePayment(p: ScRegisteredParticipant, event: Event): void {
    event.stopPropagation();
    if (this.syncingEnrollmentId() === p.enrollment_id) return;
    this.syncingEnrollmentId.set(p.enrollment_id);

    this.scannerSvc.syncOnePayment(p.enrollment_id).subscribe({
      next: (res: any) => {
        this.syncingEnrollmentId.set(null);
        if (res.success) {
          const newStatus = res.data.payment_status as ScRegisteredParticipant['payment_status'];
          this.registrations.update(groups =>
            groups.map(g => ({
              ...g,
              participants: g.participants.map(part =>
                part.enrollment_id === p.enrollment_id
                  ? { ...part, payment_status: newStatus }
                  : part
              ),
            }))
          );
          const msg = res.data.changed
            ? `Estado actualizado: ${this.paymentLabel(newStatus)}`
            : 'NetSuite confirma el mismo estado. Sin cambios.';
          Swal.fire({ icon: 'success', title: 'Sincronización completada', text: msg, timer: 2000, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'warning', title: 'Sin cambios', text: res.message });
        }
      },
      error: (err: any) => {
        this.syncingEnrollmentId.set(null);
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo sincronizar con NetSuite.' });
      },
    });
  }

  typeLabel(t: string): string {
    return this.participantTypes.find(x => x.value === t)?.label ?? t;
  }

  changeWeekIntensiveActivity(enrollmentWeekId: number | undefined, enrollmentId: number, activityIdStr: string): void {
    if (!enrollmentWeekId) return;
    const newActivityId = activityIdStr ? parseInt(activityIdStr, 10) : null;
    this.svc.updateWeekIntensiveActivity(enrollmentWeekId, newActivityId).subscribe({
      next: () => {
        // Si se asignó actividad intensiva, quitar el grupo automáticamente
        if (newActivityId) {
          this.enrollSvc.assignGroup(enrollmentId, { group_id: null }).subscribe({
            next: () => {
              this.showToast('Actividad intensiva asignada · grupo removido', 'success');
              this._loadRegistrations(this.selectedCourse()!.id);
            },
            error: () => {
              this.showToast('Actividad actualizada (error al quitar grupo)', 'info');
              this._loadRegistrations(this.selectedCourse()!.id);
            }
          });
        } else {
          this.showToast('Actividad intensiva actualizada', 'success');
          this._loadRegistrations(this.selectedCourse()!.id);
        }
      },
      error: () => this.showToast('Error al actualizar la actividad', 'danger')
    });
  }

  isParticipantIntensive(p: ScRegisteredParticipant): boolean {
    return p.weeks.some(w => !!w.intensive_activity_id);
  }

  isPendingIntensive(p: PendingParticipant): boolean {
    return p.weeks.some(w => !!w.intensive_activity_id);
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

  /** Precio lista (sin descuento) del inscrito en la tabla admin */
  enrolledListPrice(p: ScRegisteredParticipant): number {
    return p.list_price ?? 0;
  }

  /** Descuento absoluto del inscrito (0 si no hay descuento) */
  enrolledDiscount(p: ScRegisteredParticipant): number {
    return p.discount_amount ?? 0;
  }

  /** Monto final pagado / a pagar del inscrito */
  enrolledCost(p: ScRegisteredParticipant): number {
    return p.amount_paid ?? 0;
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.photoCameraFacingMode() }, audio: false });
      this.photoCameraStream.set(stream);
      videoEl.srcObject = stream;
    } catch {
      this.showToast('No se pudo acceder a la cámara', 'danger');
      this.photoCameraMode.set('file');
    }
  }

  async toggleCamera(videoEl: HTMLVideoElement): Promise<void> {
    this.photoCameraFacingMode.set(this.photoCameraFacingMode() === 'user' ? 'environment' : 'user');
    this._stopCamera();
    await this.startCamera(videoEl);
  }

  capturePhoto(videoEl: HTMLVideoElement): void {
    const canvas = document.createElement('canvas');
    canvas.width  = videoEl.videoWidth  || 640;
    canvas.height = videoEl.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
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
    this.credReplacementResult.set(null);
    this.credReplacementList.set([]);

    const courseId = this.selectedCourse()!.id;
    this.credSvc.getPreview(p.participant_id, courseId).subscribe({
      next: res => {
        this.credModalData.set(res.data);
        this.credModalLoading.set(false);

        // Cargar lista de reposiciones si ya tiene credencial entregada
        if (res.data?.credential_delivered && p.enrollment_id) {
          this.credSvc.getReplacementList(p.enrollment_id).subscribe({
            next: r => this.credReplacementList.set(r.data?.replacements ?? []),
            error: () => {},
          });
        }
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

  editPhone(p: ScRegisteredParticipant, event: Event): void {
    event.stopPropagation();
    let currentPhone = p.phone && p.phone !== 'Sin teléfono' ? p.phone.replace(/[^0-9]/g, '') : '';
    
    Swal.fire({
      title: 'Editar teléfono',
      text: 'Ingresa el número a 10 dígitos. A este número se enviará la liga.',
      input: 'text',
      inputValue: currentPhone,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        const cleaned = value.replace(/[^0-9]/g, '');
        if (!cleaned) return 'Debes ingresar un número de teléfono válido';
        if (cleaned.length !== 10) return 'El número debe tener exactamente 10 dígitos';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const phoneToUse = result.value.replace(/[^0-9]/g, '');
        this.svc.updateParticipantPhone(p.participant_id, phoneToUse).subscribe({
          next: () => {
            p.phone = phoneToUse.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
            this.showToast('Teléfono guardado correctamente.', 'success');
          },
          error: () => this.showToast('Error al guardar el teléfono', 'danger')
        });
      }
    });
  }

  sendPortalLink(p: ScRegisteredParticipant, event: Event): void {
    event.stopPropagation();
    
    if (this.sendingLinkMap()[p.participant_id]) {
      return;
    }

    const phoneToUse = p.phone && p.phone !== 'Sin teléfono' ? p.phone.replace(/[^0-9]/g, '') : '';
    
    if (!phoneToUse || phoneToUse.length !== 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Número incorrecto',
        text: 'El teléfono no tiene 10 dígitos o está mal escrito. Por favor edítalo primero usando el ícono del lápiz.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const url = window.location.origin + '/tutor-portal/login';
    
    this.sendingLinkMap.update(m => ({...m, [p.participant_id]: true}));

    this.svc.sendPortalLinkWhatsapp(p.enrollment_id, phoneToUse, url).subscribe({
      next: () => {
        this.sendingLinkMap.update(m => ({...m, [p.participant_id]: false}));
        Swal.fire({
          icon: 'success',
          title: '¡Enviado!',
          text: 'Se ha enviado la liga exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: () => {
        this.sendingLinkMap.update(m => ({...m, [p.participant_id]: false}));
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar la liga por WhatsApp.',
        });
      }
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

  requestCredentialReplacement(): void {
    const data = this.credModalData();
    if (!data?.enrollment_id) return;

    Swal.fire({
      title: '¿Solicitar reposición de credencial?',
      html: 'Se generará una Orden de Venta en NetSuite por <strong>$200.00 MXN</strong> a cargo del titular.<br><br>Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar orden',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d63384',
    }).then(result => {
      if (!result.isConfirmed) return;

      this.credReplacementLoading.set(true);
      this.credReplacementResult.set(null);

      this.credSvc.requestReplacement(data.enrollment_id!).subscribe({
        next: res => {
          this.credReplacementLoading.set(false);
          this.credReplacementResult.set(res.data);
          // Agregar al inicio de la lista
          this.credReplacementList.update(list => [res.data, ...list]);
          if (res.success) {
            this.showToast(`Reposición registrada · SO NS: ${res.data.ns_so_id ?? 'Pendiente'}`, 'success');
          } else {
            this.showToast(res.message ?? 'Reposición registrada con error NS', 'info');
          }
        },
        error: err => {
          this.credReplacementLoading.set(false);
          this.showToast(err?.error?.message ?? 'Error al solicitar reposición', 'danger');
        },
      });
    });
  }

  deliverCredential(replacementId: number): void {
    this.credDeliveringId.set(replacementId);
    this.credSvc.deliverReplacement(replacementId).subscribe({
      next: res => {
        this.credDeliveringId.set(null);
        // Actualizar esa card en la lista
        this.credReplacementList.update(list =>
          list.map(r => r.id === replacementId ? res.data : r)
        );
        this.showToast('Credencial de reposición entregada', 'success');
        // Recargar credenciales para actualizar el color del botón en la lista
        this._loadCredentials(this.selectedCourse()!.id);
      },
      error: err => {
        this.credDeliveringId.set(null);
        this.showToast(err?.error?.message ?? 'Error al registrar entrega', 'danger');
      },
    });
  }

  syncCredentialReplacementStatus(): void {
    const list = this.credReplacementList();
    const p    = this.credParticipant();
    if (!p?.enrollment_id) return;

    this.credReplacementSyncing.set(true);
    this.credSvc.syncCredentialReplacements().subscribe({
      next: () => {
        this.credSvc.getReplacementList(p.enrollment_id!).subscribe({
          next: r => {
            this.credReplacementList.set(r.data?.replacements ?? []);
            this.credReplacementSyncing.set(false);
          },
          error: () => this.credReplacementSyncing.set(false),
        });
        this.showToast('Sync completado', 'success');
      },
      error: err => {
        this.credReplacementSyncing.set(false);
        this.showToast(err?.error?.message ?? 'Error al sincronizar', 'danger');
      },
    });
  }

  // ── Edit weeks ────────────────────────────────────────────────────────────

  openEditWeeks(p: ScRegisteredParticipant): void {
    const enrollmentId = p.enrollment_id;
    if (!enrollmentId) return;

    // Construir editWeeksDetail directamente desde los datos ya cargados del participante
    // (evita una llamada API extra que puede causar 401 y logout)
    const detail: ScEnrollmentWeek[] = (p.weeks ?? [])
      .filter(w => w.enrollment_week_id != null && w.week_id != null)
      .map(w => ({
        id: w.enrollment_week_id!,
        enrollment_id: enrollmentId,
        week_id: w.week_id!,
        amount: 0,
        payment_status: (w.payment_status ?? 'pending') as 'pending' | 'paid' | 'partial' | 'cancelled',
      }));

    this.editWeeksDetail.set(detail);
    this.editWeeksIds.set(detail.map(w => w.week_id));
    this.editWeeksParticipant.set(p);
  }

  cancelEditWeeks(): void {
    this.editWeeksParticipant.set(null);
    this.editWeeksIds.set([]);
  }

  isEditWeekPaid(weekId: number): boolean {
    return this.editWeeksDetail().some(w => w.week_id === weekId && w.payment_status === 'paid');
  }

  isEditWeekChecked(weekId: number): boolean {
    return this.editWeeksIds().includes(weekId);
  }

  hasAnyPaidWeekInEdit(): boolean {
    return this.editWeeksDetail().some(w => w.payment_status === 'paid');
  }

  /** True cuando la inscripción en edición tiene al menos una semana pagada (paid o partial) y está bloqueada a swaps */
  isPaidEnrollmentEdit = computed(() => {
    const p = this.editWeeksParticipant();
    if (!p) return false;

    // Los colaboradores (staff y staff_guest) nunca están bloqueados, pueden agregar/quitar libremente
    if (p.participant_type === 'staff' || p.participant_type === 'staff_guest') {
      return false;
    }

    return p.payment_status === 'paid' || this.editWeeksDetail().some(w => w.payment_status === 'paid');
  });

  toggleEditWeek(weekId: number): void {
    const current   = this.editWeeksIds();
    const isChecked = current.includes(weekId);

    if (this.isPaidEnrollmentEdit()) {
      // Modo intercambio (inscripción pagada):
      // – Quitar: siempre permitido (incluso si la semana es "paid")
      // – Agregar: solo si ya quitaste al menos una (current.length < original)
      const original = this.editWeeksDetail().length;
      if (!isChecked && current.length >= original) {
        this.showToast(
          `Inscripción pagada: debes quitar una semana antes de agregar otra (total fijo: ${original}).`,
          'danger'
        );
        return;
      }
      if (isChecked) {
        this.editWeeksIds.set(current.filter(id => id !== weekId));
      } else {
        this.editWeeksIds.set([...current, weekId]);
      }
      return;
    }

    // Modo normal: no se puede desmarcar semanas individualmente pagadas
    const isPaid = this.editWeeksDetail().some(w => w.week_id === weekId && w.payment_status === 'paid');
    if (isPaid) return;

    if (isChecked) {
      this.editWeeksIds.set(current.filter(id => id !== weekId));
    } else {
      this.editWeeksIds.set([...current, weekId]);
    }
  }

  saveEditWeeks(p: ScRegisteredParticipant): void {
    const enrollmentId = p.enrollment_id;
    if (!enrollmentId) return;

    // Inscripción pagada: el conteo de semanas no puede cambiar
    if (this.isPaidEnrollmentEdit() && this.editWeeksIds().length !== this.editWeeksDetail().length) {
      this.showToast(
        `Inscripción pagada: el total de semanas debe mantenerse en ${this.editWeeksDetail().length}.`,
        'danger'
      );
      return;
    }

    const ids = this.editWeeksIds();
    if (ids.length === 0) {
      this.showToast('Debe seleccionar al menos una semana.', 'danger');
      return;
    }

    this.editWeeksSaving.set(true);
    this.enrollSvc.updateWeeks(enrollmentId, ids).subscribe({
      next: res => {
        this.editWeeksSaving.set(false);
        this.editWeeksParticipant.set(null);
        this.editWeeksIds.set([]);
        const updated = res.data;
        if (updated) {
          const newWeeks = (updated.weeks ?? []).map(w => ({
            week_number: w.week_number ?? (this.selectedCourse()?.sc_weeks ?? [])
              .find((sw: any) => sw.id === w.week_id)?.week_number ?? 0,
            label: w.week_label ?? '',
            enrollment_week_id: w.id,
            week_id: w.week_id,
            payment_status: w.payment_status ?? 'pending',
            intensive_activity_id: null,
            intensive_activity_name: null,
          }));
          this.registrations.update(groups =>
            groups.map(g => ({
              ...g,
              participants: g.participants.map(part =>
                part.enrollment_id === enrollmentId
                  ? {
                      ...part,
                      weeks:           newWeeks,
                      amount_paid:     updated.amount_paid     ?? part.amount_paid,
                      list_price:      updated.list_price      ?? part.list_price,
                      discount_amount: updated.discount_amount ?? part.discount_amount,
                    }
                  : part
              ),
            }))
          );
        }
        this.showToast('Semanas actualizadas correctamente.', 'success');
      },
      error: err => {
        this.editWeeksSaving.set(false);
        this.showToast(err?.error?.message ?? 'Error al actualizar semanas', 'danger');
      },
    });
  }

  // ── Formato colaborador PDF ───────────────────────────────────────────────
  printFormato(p: ScRegisteredParticipant): void {
    const eid = p.enrollment_id;
    if (!eid) return;
    this.enrollSvc.printFormatColaborador(eid).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formato_${eid}_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.showToast('Error al generar el formato PDF', 'danger'),
    });
  }

  downloadCsv(): void {
    const course = this.selectedCourse();
    if (!course) return;
    const params: Record<string, string> = {
      course_id: String(course.id),
      filter:    this.exportFilter(),
    };
    if (this.exportFilter() === 'day'   && this.exportDate())   params['date']    = this.exportDate();
    if (this.exportFilter() === 'week'  && this.exportWeekId()) params['week_id'] = String(this.exportWeekId());
    if (this.exportFilter() === 'month' && this.exportMonth())  params['month']   = this.exportMonth();

    this.enrollSvc.exportXlsx(params as any).subscribe({
      next: blob => {
        const suffix = this.exportFilter() === 'day'   ? this.exportDate().replace(/-/g, '') :
                       this.exportFilter() === 'week'  ? `S${this.exportWeekId()}` :
                       this.exportFilter() === 'month' ? this.exportMonth() :
                       new Date().getFullYear().toString();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `INSCRITOS_CVERANO_${suffix}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.showToast('Error al exportar Excel', 'danger'),
    });
  }

  updateGender(p: ScRegisteredParticipant, genderId: number): void {
    if (!genderId || genderId < 1 || genderId > 2) return;
    this.updatingGenderId.set(p.participant_id);
    this.svc.updateParticipantGender(p.participant_id, genderId as 1 | 2).subscribe({
      next: () => {
        this.registrations.update(groups =>
          groups.map(g => ({
            ...g,
            participants: g.participants.map(part =>
              part.participant_id === p.participant_id
                ? { ...part, gender_id: genderId }
                : part
            ),
          }))
        );
        this.showToast('Género actualizado ✓', 'success');
        this.updatingGenderId.set(null);
      },
      error: () => {
        this.showToast('Error al actualizar género', 'danger');
        this.updatingGenderId.set(null);
      },
    });
  }
}
