import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScCoursesService } from '../../../../services/summer-course/sc-courses.service';
import {
  ScCourse,
  ScWeek,
  ScCost,
  SC_COURSE_STATUSES,
  SC_PARTICIPANT_TYPES,
} from '../../../../models/summer-course/summer-course.model';

type WizardStep = 1 | 2 | 3;

interface CostDraft {
  participant_type: ScCost['participant_type'];
  label: string;
  cost_per_week: number;
}

@Component({
  selector: 'app-course-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-wizard.html',
  styleUrl: './course-wizard.scss',
})
export class CourseWizardComponent implements OnInit, OnDestroy {
  private svc = inject(ScCoursesService);
  private cdr = inject(ChangeDetectorRef);

  @Input() editCourse: ScCourse | null = null;
  @Output() saved     = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  // ── Wizard state ──────────────────────────────────────────────────────────
  step        = signal<WizardStep>(1);
  saving      = signal(false);
  error       = signal<string | null>(null);

  name        = signal('');
  start_date  = signal('');
  end_date    = signal('');
  status      = signal<ScCourse['status']>('setup');
  acceso_club_id = signal<number | null>(null);
  description = signal('');

  // ── Step 2: Semanas ───────────────────────────────────────────────────────
  weeks_count   = signal(4);
  previewWeeks  = signal<{ label: string; start: string; end: string }[]>([]);
  editWeeks     = signal<ScWeek[]>([]);
  loadingWeeks  = signal(false);

  accesoClubesList = signal<{id: number, name: string}[]>([]);

  // ── Step 3: Costos ────────────────────────────────────────────────────────
  costs = signal<CostDraft[]>([
    { participant_type: 'member',      label: 'Socio',           cost_per_week: 0 },
    { participant_type: 'guest',       label: 'Invitado',        cost_per_week: 0 },
    { participant_type: 'staff',       label: 'Staff',           cost_per_week: 0 },
    { participant_type: 'staff_guest', label: 'Familiar staff',  cost_per_week: 0 },
  ]);

  readonly statusLabels  = SC_COURSE_STATUSES;
  readonly participantTypes = SC_PARTICIPANT_TYPES;

  get isEdit(): boolean { return !!this.editCourse; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    this.svc.getFormData().subscribe({
      next: res => {
        if (res.data?.acceso_clubes) {
          this.accesoClubesList.set(res.data.acceso_clubes);
        }
      },
      error: () => {}
    });

    if (this.editCourse) {
      const c = this.editCourse;
      this.name.set(c.name);
      this.start_date.set(c.start_date);
      this.end_date.set(c.end_date);
      this.status.set(c.status);
      this.acceso_club_id.set(c.acceso_club_id ?? null);
      this.description.set(c.description ?? '');
      // Map costs if available
      if (c.sc_costs?.length) {
        this.costs.update(drafts =>
          drafts.map(d => {
            const found = c.sc_costs!.find(sc => sc.participant_type === d.participant_type);
            return found ? { ...d, cost_per_week: found.cost_per_week } : d;
          })
        );
      }
      // Load weeks: use embedded data if present, otherwise fetch full course
      if (c.sc_weeks?.length) {
        this.editWeeks.set(c.sc_weeks);
      } else {
        this.loadingWeeks.set(true);
        this.svc.getById(c.id).subscribe({
          next: res => {
            this.editWeeks.set(res.data.sc_weeks ?? []);
            // Also update costs from fresh data
            if (res.data.sc_costs?.length) {
              this.costs.update(drafts =>
                drafts.map(d => {
                  const found = res.data.sc_costs!.find(sc => sc.participant_type === d.participant_type);
                  return found ? { ...d, cost_per_week: found.cost_per_week } : d;
                })
              );
            }
            this.loadingWeeks.set(false);
          },
          error: () => this.loadingWeeks.set(false),
        });
      }
    } else {
      // New course: pre-build the weeks preview with default 4 weeks
      this.buildWeeksPreview();
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  nextStep(): void {
    if (this.step() === 1) {
      if (!this.validateStep1()) return;
      this.buildWeeksPreview();
      this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(3);
    }
  }

  prevStep(): void {
    if (this.step() > 1) this.step.set((this.step() - 1) as WizardStep);
  }

  // ── Validation ───────────────────────────────────────────────────────────
  validateStep1(): boolean {
    if (!this.acceso_club_id()) {
      this.error.set('Selecciona un Club o Sede.');
      return false;
    }
    if (!this.name().trim()) {
      this.error.set('El nombre del curso es requerido.');
      return false;
    }
    if (!this.start_date() || !this.end_date()) {
      this.error.set('Las fechas de inicio y fin son requeridas.');
      return false;
    }
    if (this.start_date() >= this.end_date()) {
      this.error.set('La fecha de inicio debe ser anterior a la fecha de fin.');
      return false;
    }
    this.error.set(null);
    return true;
  }

  // ── Weeks preview ────────────────────────────────────────────────────────
  buildWeeksPreview(): void {
    if (!this.start_date()) {
      this.previewWeeks.set([]);
      return;
    }
    const start = new Date(this.start_date() + 'T00:00:00');
    if (isNaN(start.getTime())) {
      this.previewWeeks.set([]);
      return;
    }
    const weeks: { label: string; start: string; end: string }[] = [];
    const n = this.weeks_count();
    for (let i = 0; i < n; i++) {
      const wStart = new Date(start);
      wStart.setDate(start.getDate() + i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 4);       // lunes a viernes
      weeks.push({
        label: `Semana ${i + 1}`,
        start: wStart.toISOString().slice(0, 10),
        end:   wEnd.toISOString().slice(0, 10),
      });
    }
    this.previewWeeks.set(weeks);
  }

  onWeeksCountChange(n: number): void {
    this.weeks_count.set(n);
    this.buildWeeksPreview();
  }

  // ── Cost editing ─────────────────────────────────────────────────────────
  updateCost(type: ScCost['participant_type'], value: number): void {
    this.costs.update(list =>
      list.map(c => c.participant_type === type ? { ...c, cost_per_week: value } : c)
    );
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  save(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload = {
      name:        this.name().trim(),
      start_date:  this.start_date(),
      end_date:    this.end_date(),
      status:      this.status() || 'setup',
      acceso_club_id: this.acceso_club_id(),
      description: this.description().trim() || null,
      weeks_count: this.isEdit ? undefined : this.weeks_count(),
      costs: this.costs().map(c => ({
        participant_type: c.participant_type,
        cost_per_week:   c.cost_per_week,
      })),
    };

    const obs$ = this.isEdit
      ? this.svc.update(this.editCourse!.id, payload)
      : this.svc.create(payload);

    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit(this.isEdit ? 'Curso actualizado correctamente.' : 'Curso creado correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        // Show detailed server error if available
        let msg = 'Error al guardar el curso. Intenta nuevamente.';
        if (err?.error?.message) {
          msg = err.error.message;
          if (err.error?.error?.validation) {
            const validationErrors = Object.values(err.error.error.validation)
              .map((v: any) => Object.values(v).join(', '))
              .join(' | ');
            msg += ': ' + validationErrors;
          }
        } else if (err?.status === 403) {
          msg = 'No tienes permisos para crear cursos.';
        } else if (err?.status === 0) {
          msg = 'No se pudo conectar al servidor. Verifica tu conexión.';
        }
        this.error.set(msg);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
