import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScCoursesService } from '../../../services/summer-course/sc-courses.service';
import { ScCourse, SC_COURSE_STATUSES } from '../../../models/summer-course/summer-course.model';
import { CourseWizardComponent } from './course-wizard/course-wizard';

@Component({
  selector: 'app-summer-course-courses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CourseWizardComponent],
  templateUrl: './summer-course-courses.html',
  styleUrl: './summer-course-courses.scss',
})
export class SummerCourseCoursesComponent implements OnInit {
  private svc    = inject(ScCoursesService);
  private router  = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  courses       = signal<ScCourse[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);
  toastType     = signal<'success' | 'danger'>('success');

  // delete
  deleteTarget  = signal<ScCourse | null>(null);
  deleting      = signal(false);

  // wizard
  wizardOpen        = signal(false);
  wizardEditTarget  = signal<ScCourse | null>(null);

  readonly statusLabels = SC_COURSE_STATUSES;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCourses();
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  loadCourses(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().subscribe({
      next: res => {
        this.courses.set(res.data.courses ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los cursos. Verifica tu conexión.');
        this.loading.set(false);
      },
    });
  }

  refreshCourses(): void {
    this.svc.getAll().subscribe({
      next: res => this.courses.set(res.data.courses ?? []),
    });
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  openWizard(): void {
    this.wizardEditTarget.set(null);
    this.wizardOpen.set(true);
  }

  editCourse(course: ScCourse): void {
    this.wizardEditTarget.set(course);
    this.wizardOpen.set(true);
  }

  openActivities(courseId: number): void {
    this.router.navigate(['/summer-course/activities'], { queryParams: { course_id: courseId } });
  }

  onWizardSaved(msg: string): void {
    this.wizardOpen.set(false);
    this.wizardEditTarget.set(null);
    this.showToast(msg, 'success');
    this.refreshCourses();
  }

  onWizardCancelled(): void {
    this.wizardOpen.set(false);
    this.wizardEditTarget.set(null);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  confirmDelete(course: ScCourse): void {
    this.deleteTarget.set(course);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.svc.delete(target.id).subscribe({
      next: () => {
        this.courses.update(list => list.filter(c => c.id !== target.id));
        this.deleteTarget.set(null);
        this.deleting.set(false);
        this.showToast('Curso eliminado correctamente.', 'success');
      },
      error: () => {
        this.deleting.set(false);
        this.showToast('Error al eliminar el curso.', 'danger');
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getStatusLabel(status: string): string {
    return this.statusLabels.find(s => s.value === status)?.label ?? status;
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      setup:  'bg-warning-subtle text-warning',
      active: 'bg-success-subtle text-success',
      closed: 'bg-secondary-subtle text-secondary',
    };
    return map[status] ?? 'bg-secondary-subtle text-secondary';
  }

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 4000);
  }

  clearError(): void  { this.error.set(null); }
  clearToast(): void  { this.toast.set(null); }
}
