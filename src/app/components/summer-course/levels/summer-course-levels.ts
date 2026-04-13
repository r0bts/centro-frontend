import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScEnrollmentsService } from '../../../services/summer-course/sc-enrollments.service';
import {
  ScEnrollment,
  ScCourse,
  SC_LEVEL_LABELS,
  SC_PARTICIPANT_TYPES,
} from '../../../models/summer-course/summer-course.model';

@Component({
  selector: 'app-summer-course-levels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './summer-course-levels.html',
  styleUrl: './summer-course-levels.scss',
})
export class SummerCourseLevelsComponent implements OnInit {
  private svc = inject(ScEnrollmentsService);

  // ── State ──────────────────────────────────────────────────────────────────
  enrollments   = signal<ScEnrollment[]>([]);
  courses       = signal<ScCourse[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);
  toastType     = signal<'success' | 'danger'>('success');

  activeTab     = signal<'pending' | 'assigned'>('pending');
  filterCourse  = signal<number>(0);

  // Level modal
  levelTarget   = signal<ScEnrollment | null>(null);
  assignedLevel  = signal<number>(1);
  levelNotes     = signal('');
  levelSaving    = signal(false);

  readonly levelLabels = SC_LEVEL_LABELS;
  readonly levelList   = Array.from({ length: 8 }, (_, i) => i + 1);
  readonly participantTypes = SC_PARTICIPANT_TYPES;

  // ── Computed ──────────────────────────────────────────────────────────────
  pendingList = computed(() => {
    let list = this.enrollments().filter(e => !e.assigned_level);
    if (this.filterCourse()) list = list.filter(e => e.course_id === this.filterCourse());
    return list;
  });

  assignedList = computed(() => {
    let list = this.enrollments().filter(e => !!e.assigned_level);
    if (this.filterCourse()) list = list.filter(e => e.course_id === this.filterCourse());
    return list;
  });

  currentList = computed(() =>
    this.activeTab() === 'pending' ? this.pendingList() : this.assignedList()
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.svc.getFormData().subscribe({
      next: res => {
        this.courses.set((res.data.courses ?? []) as any[]);
        this.loadEnrollments();
      },
      error: () => {
        this.error.set('Error al cargar datos.');
        this.loading.set(false);
      },
    });
  }

  loadEnrollments(): void {
    this.svc.getAll().subscribe({
      next: res => {
        this.enrollments.set(res.data.enrollments ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // ── Level modal ──────────────────────────────────────────────────────────
  openAssignLevel(e: ScEnrollment): void {
    this.levelTarget.set(e);
    this.assignedLevel.set(e.assigned_level ?? e.suggested_level ?? 1);
    this.levelNotes.set(e.level_notes ?? '');
  }

  cancelAssignLevel(): void { this.levelTarget.set(null); }

  saveLevel(): void {
    const t = this.levelTarget();
    if (!t) return;
    this.levelSaving.set(true);
    this.svc.assignLevel(t.id, {
      assigned_level: this.assignedLevel(),
      level_notes:    this.levelNotes(),
    }).subscribe({
      next: res => {
        this.enrollments.update(list =>
          list.map(e => e.id === t.id ? res.data : e)
        );
        this.levelTarget.set(null);
        this.levelSaving.set(false);
        this.showToast('Nivel asignado correctamente.', 'success');
      },
      error: () => {
        this.levelSaving.set(false);
        this.showToast('Error al asignar nivel.', 'danger');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  participantName(e: ScEnrollment): string {
    const p = e.sc_participant;
    return p ? `${p.first_name} ${p.last_name}` : `#${e.participant_id}`;
  }

  initials(e: ScEnrollment): string {
    const p = e.sc_participant;
    if (!p) return '?';
    return `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase();
  }

  courseName(e: ScEnrollment): string {
    const c = this.courses().find(c => c.id === e.course_id);
    return c?.name ?? `Curso #${e.course_id}`;
  }

  levelRoman(n: number | null | undefined): string {
    if (!n) return '—';
    return SC_LEVEL_LABELS[n]?.roman ?? String(n);
  }

  levelAge(n: number | null | undefined): string {
    if (!n) return '';
    return SC_LEVEL_LABELS[n]?.age ?? '';
  }

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 3500);
  }

  clearError(): void { this.error.set(null); }
}
