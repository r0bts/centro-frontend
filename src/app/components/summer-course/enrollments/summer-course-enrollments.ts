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
import { ScEnrollmentsService } from '../../../services/summer-course/sc-enrollments.service';
import {
  ScEnrollment,
  ScCourse,
  ScParticipant,
  CreateScEnrollmentRequest,
  SC_PAYMENT_STATUSES,
  SC_PARTICIPANT_TYPES,
  SC_LEVEL_LABELS,
} from '../../../models/summer-course/summer-course.model';

@Component({
  selector: 'app-summer-course-enrollments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './summer-course-enrollments.html',
  styleUrl: './summer-course-enrollments.scss',
})
export class SummerCourseEnrollmentsComponent implements OnInit {
  private svc = inject(ScEnrollmentsService);

  // ── State ──────────────────────────────────────────────────────────────────
  enrollments   = signal<ScEnrollment[]>([]);
  courses       = signal<ScCourse[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);
  toastType     = signal<'success' | 'danger'>('success');

  // Filters
  filterCourse  = signal<number>(0);
  filterStatus  = signal<string>('');

  // Modals
  formOpen      = signal(false);
  deleteTarget  = signal<ScEnrollment | null>(null);
  deleting      = signal(false);
  levelTarget   = signal<ScEnrollment | null>(null);

  // Form
  formParticipantFirstName = signal('');
  formParticipantLastName  = signal('');
  formParticipantBirth     = signal('');
  formCourseId    = signal<number>(0);
  formType        = signal<'member' | 'guest' | 'staff' | 'staff_guest'>('member');
  formSuggestedLvl = signal<number | null>(null);
  formEnrollDate  = signal(new Date().toISOString().slice(0, 10));
  formSaving      = signal(false);

  // Level assignment form
  assignedLevel  = signal<number>(1);
  levelNotes     = signal('');
  levelSaving    = signal(false);

  readonly paymentStatuses = SC_PAYMENT_STATUSES;
  readonly participantTypes = SC_PARTICIPANT_TYPES;
  readonly levelLabels = SC_LEVEL_LABELS;
  readonly levelList = Array.from({ length: 8 }, (_, i) => i + 1);

  // ── Computed ──────────────────────────────────────────────────────────────
  filteredEnrollments = computed(() => {
    let list = this.enrollments();
    if (this.filterCourse()) list = list.filter(e => e.course_id === this.filterCourse());
    if (this.filterStatus()) list = list.filter(e => e.payment_status === this.filterStatus());
    return list;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.svc.getFormData().subscribe({
      next: res => {
        this.courses.set((res.data.courses ?? []) as any[]);
        if (res.data.courses?.length) this.formCourseId.set(res.data.courses[0].id);
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

  // ── Form ──────────────────────────────────────────────────────────────────
  openForm(): void {
    this.formOpen.set(true);
    this.formParticipantFirstName.set('');
    this.formParticipantLastName.set('');
    this.formParticipantBirth.set('');
    this.formSuggestedLvl.set(null);
    this.formSaving.set(false);
  }

  cancelForm(): void {
    this.formOpen.set(false);
  }

  saveEnrollment(): void {
    if (!this.formParticipantFirstName().trim() || !this.formParticipantLastName().trim()) {
      this.error.set('El nombre y apellido del participante son requeridos.');
      return;
    }
    this.formSaving.set(true);
    // Note: backend creates participant inline or expects participant_id
    // We send participant data embedded — backend handles creation
    const payload: CreateScEnrollmentRequest & Record<string, unknown> = {
      participant_id:  0,     // 0 = create new participant
      course_id:       this.formCourseId(),
      participant_type: this.formType(),
      suggested_level: this.formSuggestedLvl(),
      enrollment_date: this.formEnrollDate(),
      // Pass participant data for inline creation
      first_name:  this.formParticipantFirstName().trim(),
      last_name:   this.formParticipantLastName().trim(),
      birth_date:  this.formParticipantBirth(),
    };

    this.svc.create(payload as any).subscribe({
      next: () => {
        this.formSaving.set(false);
        this.formOpen.set(false);
        this.showToast('Inscripción creada correctamente.', 'success');
        this.loadEnrollments();
      },
      error: () => {
        this.formSaving.set(false);
        this.error.set('Error al crear la inscripción.');
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(e: ScEnrollment): void { this.deleteTarget.set(e); }
  cancelDelete(): void               { this.deleteTarget.set(null); }

  executeDelete(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.svc.delete(t.id).subscribe({
      next: () => {
        this.enrollments.update(list => list.filter(e => e.id !== t.id));
        this.deleteTarget.set(null);
        this.deleting.set(false);
        this.showToast('Inscripción eliminada.', 'success');
      },
      error: () => {
        this.deleting.set(false);
        this.showToast('Error al eliminar.', 'danger');
      },
    });
  }

  // ── Assign level ──────────────────────────────────────────────────────────
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

  courseName(e: ScEnrollment): string {
    const c = this.courses().find(c => c.id === e.course_id);
    return c?.name ?? `Curso #${e.course_id}`;
  }

  paymentBadge(status: string): string {
    return this.paymentStatuses.find(s => s.value === status)?.color ?? 'secondary';
  }

  paymentLabel(status: string): string {
    return this.paymentStatuses.find(s => s.value === status)?.label ?? status;
  }

  levelRoman(n: number | null | undefined): string {
    if (!n) return '—';
    return SC_LEVEL_LABELS[n]?.roman ?? String(n);
  }

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 3500);
  }

  clearError(): void { this.error.set(null); }
}
