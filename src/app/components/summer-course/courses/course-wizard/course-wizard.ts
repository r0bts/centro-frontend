import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
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

/** Una fila de la tabla de tarifas: precio para 1..N semanas */
interface CostDraft {
  participant_type: ScCost['participant_type'];
  label: string;
  /** costs[i] = precio total cuando el participante compra (i+1) semanas */
  costs: number[];
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
  location_id = signal<number | null>(null);
  description = signal('');

  // ── Step 2: Semanas ───────────────────────────────────────────────────────
  weeks_count   = signal(4);
  previewWeeks  = signal<{ label: string; start: string; end: string }[]>([]);
  editWeeks     = signal<ScWeek[]>([]);
  loadingWeeks  = signal(false);

  locationsList = signal<{id: number, name: string}[]>([]);

  /** Máximo de semanas permitidas según el rango de fechas (solo modo nuevo) */
  maxWeeks = computed(() => {
    const s = this.start_date();
    const e = this.end_date();
    if (!s || !e) return 8;
    const diff = (new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24 * 7);
    return Math.max(1, Math.min(8, Math.floor(diff) + 1));
  });
  /** Número efectivo de semanas: en edición usa las semanas cargadas, en nuevo usa el slider */
  effectiveWeeksCount = computed(() =>
    this.isEdit ? this.editWeeks().length || 1 : this.weeks_count()
  );
  // ── Step 3: Tarifas (matriz: filas = tipos, columnas = semanas compradas) ─
  costs = signal<CostDraft[]>([
    { participant_type: 'member',      label: 'Socio',          costs: [0, 0, 0, 0] },
    { participant_type: 'guest',       label: 'Invitado',       costs: [0, 0, 0, 0] },
    { participant_type: 'staff',       label: 'Staff',          costs: [0, 0, 0, 0] },
    { participant_type: 'staff_guest', label: 'Familiar staff', costs: [0, 0, 0, 0] },
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

    // BUG 1 FIX: cargar lista de sedes primero, LUEGO aplicar el valor del curso
    this.svc.getFormData().subscribe({
      next: res => {
        if (res.data?.locations) {
          this.locationsList.set(res.data.locations);
        }
        // Aplicar location_id DESPUÉS de que la lista esté lista
        if (this.editCourse) {
          this.location_id.set(this.editCourse.location_id ?? null);
        }
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    if (this.editCourse) {
      const c = this.editCourse;
      this.name.set(c.name);
      this.start_date.set(c.start_date);
      this.end_date.set(c.end_date);
      this.status.set(c.status);
      this.description.set(c.description ?? '');
      // Cargar costos como matriz desde sc_costs
      this._applyCostsFromApi(c.sc_costs ?? []);
      // Semanas: usar las embebidas o cargar por API
      if (c.sc_weeks?.length) {
        this.editWeeks.set(c.sc_weeks);
      } else {
        this.loadingWeeks.set(true);
        this.svc.getById(c.id).subscribe({
          next: res => {
            this.editWeeks.set(res.data.sc_weeks ?? []);
            this._applyCostsFromApi(res.data.sc_costs ?? []);
            // Sync cost matrix columns to match actual weeks count
            this._resizeCostMatrix(res.data.sc_weeks?.length ?? 1);
            this.loadingWeeks.set(false);
            this.cdr.markForCheck();
          },
          error: () => this.loadingWeeks.set(false),
        });
      }
    } else {
      this.buildWeeksPreview();
    }
  }

  /** Convierte el array plano de ScCost[] en la matriz CostDraft[] */
  private _applyCostsFromApi(apiCosts: ScCost[]): void {
    if (!apiCosts.length) return;
    // Determinar cuántas semanas hay en los costos guardados
    const maxW = Math.max(...apiCosts.map(c => c.weeks_count ?? 1), 1);
    this.costs.update(drafts =>
      drafts.map(d => {
        const row = Array.from({ length: maxW }, (_, i) => {
          const found = apiCosts.find(
            c => c.participant_type === d.participant_type && (c.weeks_count ?? 1) === i + 1
          );
          return found ? found.cost_per_week : 0;
        });
        return { ...d, costs: row };
      })
    );
  }

  // ── Date helpers ─────────────────────────────────────────────────────────
  onStartDateChange(val: string): void {
    this.start_date.set(val);
    // Auto-set end_date to last day of the same month if not set yet or is before start
    if (val) {
      const d = new Date(val + 'T00:00:00');
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const lastDayStr = lastDay.toISOString().slice(0, 10);
      const current = this.end_date();
      if (!current || current < val) {
        this.end_date.set(lastDayStr);
      }
    }
    this.buildWeeksPreview();
  }

  /** Min end_date = start_date + 1 day */
  get minEndDate(): string {
    const s = this.start_date();
    if (!s) return '';
    const d = new Date(s + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  /** Hint: e.g. 'julio 2026: 06 jul – 31 jul' */
  get dateRangeHint(): string {
    const s = this.start_date();
    const e = this.end_date();
    if (!s || !e) return '';
    const fmt = (str: string) => {
      const d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    };
    const months = new Date(s + 'T00:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return `${months.charAt(0).toUpperCase() + months.slice(1)}: ${fmt(s)} → ${fmt(e)}`;
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  nextStep(): void {
    if (this.step() === 1) {
      if (!this.validateStep1()) return;
      if (this.isEdit) {
        // En edición: saltar directamente a Tarifas (step 3)
        this._resizeCostMatrix(this.editWeeks().length || 1);
        this.step.set(3);
      } else {
        // Las semanas se determinan 100% por el rango de fechas — no hay slider
        const auto = this.maxWeeks();
        this.weeks_count.set(auto);
        this._resizeCostMatrix(auto);
        this.buildWeeksPreview();
        this.step.set(2);
      }
    } else if (this.step() === 2) {
      if (!this.isEdit) this._resizeCostMatrix(this.weeks_count());
      this.step.set(3);
    }
  }

  prevStep(): void {
    if (this.step() === 3 && this.isEdit) {
      this.step.set(1);
    } else if (this.step() > 1) {
      this.step.set((this.step() - 1) as WizardStep);
    }
  }

  // ── Validation ───────────────────────────────────────────────────────────
  validateStep1(): boolean {
    if (!this.location_id()) {
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
    const clamped = Math.min(n, this.maxWeeks());
    this.weeks_count.set(clamped);
    this._resizeCostMatrix(clamped);
    this.buildWeeksPreview();
  }

  /** Redimensiona el array costs[] de cada fila al nuevo tamaño */
  private _resizeCostMatrix(n: number): void {
    this.costs.update(drafts =>
      drafts.map(d => {
        const current = d.costs;
        if (current.length === n) return d;
        const resized = Array.from({ length: n }, (_, i) => current[i] ?? 0);
        return { ...d, costs: resized };
      })
    );
  }

  // ── Cost editing ─────────────────────────────────────────────────────
  updateCostCell(type: ScCost['participant_type'], weekIdx: number, value: number): void {
    this.costs.update(list =>
      list.map(c => {
        if (c.participant_type !== type) return c;
        const costs = [...c.costs];
        costs[weekIdx] = value;
        return { ...c, costs };
      })
    );
  }

  /** Array de índices [0..n-1] para iterar semanas en el template */
  get weeksArray(): number[] {
    return Array.from({ length: this.effectiveWeeksCount() }, (_, i) => i);
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
      location_id: this.location_id(),
      description: this.description().trim() || null,
      weeks_count: this.isEdit ? undefined : this.weeks_count(),
      costs: this.costs().flatMap(c =>
        c.costs.map((cost, i) => ({
          participant_type: c.participant_type,
          weeks_count: i + 1,
          cost,
        }))
      ),
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
