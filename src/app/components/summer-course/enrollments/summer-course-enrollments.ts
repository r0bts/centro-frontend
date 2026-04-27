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

import { ScRegistrationsService } from '../../../services/summer-course/sc-registrations.service';
import { ScCoursesService } from '../../../services/summer-course/sc-courses.service';
import {
  ScCourse,
  ScLevel,
  ScRegistrationGroup,
  ScSocioSearchResult,
  ScRegistrationParticipant,
  ScCostWithTotal,
  SC_PARTICIPANT_TYPES,
} from '../../../models/summer-course/summer-course.model';

type WizardStep = 'search' | 'participants' | 'confirm' | 'done';

interface PendingParticipant {
  socio_id: string | null;
  fullName: string;
  type: 'member' | 'guest' | 'staff' | 'staff_guest';
  weeks: number[];
  birth_date: string | null;
  age: number | null;
  memberType: string;
  alreadyEnrolled: boolean;
  suggestedLevel: ScLevel | null;
  outOfRange: boolean;  // age < 3 o age > 15 o sin fecha
}

@Component({
  selector: 'app-summer-course-enrollments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './summer-course-enrollments.html',
  styleUrl: './summer-course-enrollments.scss',
})
export class SummerCourseEnrollmentsComponent implements OnInit {
  private svc        = inject(ScRegistrationsService);
  private coursesSvc = inject(ScCoursesService);

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

  // ── Wizard ────────────────────────────────────────────────────────────────
  wizardOpen         = signal(false);
  wizardStep         = signal<WizardStep>('search');

  searchQuery        = signal('');
  searchResults      = signal<ScSocioSearchResult[]>([]);
  searching          = signal(false);
  selectedTitular    = signal<ScSocioSearchResult | null>(null);
  pendingParticipants = signal<PendingParticipant[]>([]);
  costs              = signal<ScCostWithTotal[]>([]);
  levels             = signal<ScLevel[]>([]);
  saving             = signal(false);
  registrationResult = signal<any>(null);

  private search$ = new Subject<string>();

  totalAmount = computed(() =>
    this.pendingParticipants()
      .filter(p => p.weeks.length > 0)
      .reduce((sum, p) => sum + this._getCost(p.type, p.weeks.length), 0)
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
    this.coursesSvc.getAll({ status: 'active' }).subscribe({
      next: res => {
        const list = res.data?.courses ?? [];
        this.courses.set(list);
        if (list.length) {
          this.selectedCourse.set(list[0]);
          this._loadRegistrations(list[0].id);
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
  }

  // ── Course selector ───────────────────────────────────────────────────────
  onCourseChange(courseId: string): void {
    const c = this.courses().find(c => c.id === +courseId) ?? null;
    this.selectedCourse.set(c);
    if (c) this._loadRegistrations(c.id);
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
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedTitular.set(null);
    this.pendingParticipants.set([]);
    this.registrationResult.set(null);
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

  onSearchInput(val: string): void {
    this.searchQuery.set(val);
    this.search$.next(val);
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
    };
    const family: PendingParticipant[] = s.family.map(f => ({
      socio_id: f.id, fullName: f.fullName, type: 'member' as const,
      weeks: [], birth_date: f.birth_date, age: f.age,
      memberType: f.memberType, alreadyEnrolled: f.enrolled,
      suggestedLevel: this._getLevelForAge(f.age),
      outOfRange: this._isOutOfRange(f.age),
    }));
    this.pendingParticipants.set([titular, ...family]);
    this.wizardStep.set('participants');
  }

  backToSearch(): void { this.wizardStep.set('search'); this.selectedTitular.set(null); }

  // ── Step 2 ────────────────────────────────────────────────────────────────
  get courseWeeks() { return this.selectedCourse()?.sc_weeks ?? []; }

  toggleWeek(pIdx: number, weekNum: number): void {
    const p = this.pendingParticipants()[pIdx];
    if (p?.alreadyEnrolled || p?.outOfRange) return;
    this.pendingParticipants.update(list => {
      const updated = [...list];
      const p = { ...updated[pIdx] };
      const s = new Set(p.weeks);
      if (s.has(weekNum)) s.delete(weekNum); else s.add(weekNum);
      p.weeks = Array.from(s).sort((a, b) => a - b);
      updated[pIdx] = p;
      return updated;
    });
  }

  isWeekSelected(pIdx: number, weekNum: number): boolean {
    return this.pendingParticipants()[pIdx]?.weeks.includes(weekNum) ?? false;
  }

  removeParticipant(idx: number): void {
    this.pendingParticipants.update(list => list.filter((_, i) => i !== idx));
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
    if (match) return match.total;
    const weekly = costs.find(c => c.participant_type === type && c.weeks_count === 1);
    return weekly ? weekly.cost_per_week * weeksCount : 0;
  }

  participantCost(p: PendingParticipant): number {
    return this._getCost(p.type, p.weeks.length);
  }

  saveRegistration(): void {
    const titular = this.selectedTitular();
    const course  = this.selectedCourse();
    if (!titular || !course || !this.activePending.length) return;

    this.saving.set(true);
    const payload = {
      titular_id:   titular.id,
      course_id:    course.id,
      total_amount: this.totalAmount(),
      participants: this.activePending.map(p => ({
        socio_id:        p.socio_id,
        type:            p.type,
        weeks:           p.weeks,
        birth_date:      p.birth_date,
        suggested_level: p.suggestedLevel?.level_number ?? null,
      })),
    };

    this.svc.register(payload as any).subscribe({
      next: res => {
        this.saving.set(false);
        this.registrationResult.set(res.data);
        this.wizardStep.set('done');
        this.refreshTable();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Error al registrar');
      },
    });
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

  weekRange(weeks: Array<{week_number: number; label: string}>): string {
    if (!weeks.length) return '—';
    if (weeks.length === 1) return weeks[0].label;
    return `${weeks[0].label} – ${weeks[weeks.length-1].label}`;
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
}
