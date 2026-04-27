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
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ScActivitiesService } from '../../../services/summer-course/sc-activities.service';
import {
  ScCourse,
  ScWeek,
  ScInstructor,
  ScArea,
  ScScheduleData,
  ScScheduleApiEntry,
  ScScheduleSavePayload,
} from '../../../models/summer-course/summer-course.model';
import {
  SC_DAYS,
  SC_SLOTS,
  SC_LEVELS as SC_LEVELS_CONST,
  SC_ACTIVITIES as SC_ACTIVITIES_CONST,
  SC_CATEGORIES as SC_CATEGORIES_CONST,
  SC_SLOT_MAP,
  ScActivityType,
} from './sc-schedule.constants';
import { ScSchedulePaletteComponent } from './sc-schedule-palette/sc-schedule-palette';
import { ScScheduleGridComponent }    from './sc-schedule-grid/sc-schedule-grid';
import { ScScheduleDropModalComponent }   from './sc-schedule-drop-modal/sc-schedule-drop-modal';
import { ScScheduleDetailModalComponent } from './sc-schedule-detail-modal/sc-schedule-detail-modal';

/** Celda de estado interna (UI state) */
export interface CellEntry {
  activityId: string;       // e.g. 'natacion'
  name: string;
  instructorId: number | null;
  areaId: number | null;
  dbId?: number;
}

/** Estado del schedule: [dayIdx][slotId][levelNum] = CellEntry[] */
export type ScheduleState = Array<Record<string, Record<number, CellEntry[]>>>;

export interface DropTarget {
  dayIdx:   number;
  slotId:   string;
  levelNum: number;
}

export interface DetailTarget extends DropTarget {
  entryIdx: number;
}

@Component({
  selector: 'app-summer-course-activities',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ScSchedulePaletteComponent,
    ScScheduleGridComponent,
    ScScheduleDropModalComponent,
    ScScheduleDetailModalComponent,
  ],
  templateUrl: './summer-course-activities.html',
  styleUrl: './summer-course-activities.scss',
})
export class SummerCourseActivitiesComponent implements OnInit {
  private activitiesSvc   = inject(ScActivitiesService);
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);

  // fromCourse = true means arrived via button from courses page (hide course selector)
  fromCourse = signal(false);

  // ── Static constants (slots, days) ────────────────────────────────────────────
  readonly SC_DAYS     = SC_DAYS;
  readonly SC_SLOTS    = SC_SLOTS;
  readonly SC_SLOT_MAP = SC_SLOT_MAP;

  // ── Dynamic catalog signals (populated from DB via getCatalog(), fallback = constants) ──
  // Shape kept identical to what the child components (@Input) expect.
  SC_LEVELS     = signal<Array<{ n: number; roman: string; age: string }>>(SC_LEVELS_CONST as any);
  SC_ACTIVITIES = signal<ScActivityType[]>(SC_ACTIVITIES_CONST);
  SC_CATEGORIES = signal<Array<{ id: string; label: string; emoji: string; color: string }>>(SC_CATEGORIES_CONST as any);
  SC_ACTIVITY_MAP = computed<Record<string, ScActivityType>>(() =>
    Object.fromEntries(this.SC_ACTIVITIES().map(a => [a.id, a]))
  );

  // ── State ──────────────────────────────────────────────────────────────────
  courses        = signal<ScCourse[]>([]);
  currentCourseId = signal<number>(0);
  currentWeeks   = signal<ScWeek[]>([]);
  currentWeekIdx = signal<number>(0);
  currentDayIdx  = signal<number>(0);
  scheduleState  = signal<ScheduleState>(this.emptyState());
  instructors    = signal<ScInstructor[]>([]);
  areas          = signal<ScArea[]>([]);

  loading   = signal(true);
  saving    = signal(false);
  error     = signal<string | null>(null);
  toast     = signal<string | null>(null);
  toastType = signal<'success' | 'danger'>('success');

  // ── Modal state ───────────────────────────────────────────────────────────
  pendingDrop     = signal<{ activity: ScActivityType; target: DropTarget; pickActivity?: boolean } | null>(null);
  detailTarget    = signal<{ entry: CellEntry; target: DetailTarget } | null>(null);
  dragActivity    = signal<ScActivityType | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  currentWeek = computed(() => this.currentWeeks()[this.currentWeekIdx()] ?? null);

  currentCourseName = computed(() =>
    this.courses().find(c => c.id === this.currentCourseId())?.name ?? ''
  );

  dayStats = computed(() => {
    const day = this.scheduleState()[this.currentDayIdx()] ?? {};
    let total = 0;
    let configured = 0;
    for (const slotId of SC_SLOTS.map(s => s.id)) {
      for (const lvl of this.SC_LEVELS().map(l => l.n)) {
        const hasEntry = (day[slotId]?.[lvl]?.length ?? 0) > 0;
        total++;
        if (hasEntry) configured++;
      }
    }
    return { total, configured, activitiesCount: this.countActivitiesForDay() };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const paramCourseId = this.route.snapshot.queryParamMap.get('course_id');
    if (paramCourseId) {
      this.fromCourse.set(true);
      this.currentCourseId.set(+paramCourseId);
    }
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading.set(true);
    // Load catalog (levels + activity types) AND form-data (courses + instructors) in parallel
    forkJoin({
      catalog:  this.activitiesSvc.getCatalog(),
      formData: this.activitiesSvc.getFormData(this.currentCourseId() || undefined),
    }).subscribe({
      next: ({ catalog, formData }) => {
        // — Update dynamic catalog signals —
        if (catalog.data.levels?.length) {
          this.SC_LEVELS.set(
            catalog.data.levels.map(l => ({ n: l.level_number, roman: l.roman, age: l.age_label }))
          );
        }
        if (catalog.data.activity_types?.length) {
          this.SC_ACTIVITIES.set(
            catalog.data.activity_types.map(a => ({
              id:    a.id,
              label: a.label,
              emoji: a.emoji,
              cat:   a.cat as any,
              color: a.color,
              bg:    a.bg,
            }))
          );
        }
        if (catalog.data.categories?.length) {
          this.SC_CATEGORIES.set(catalog.data.categories);
        }

        // — Map form-data courses to ScCourse-compatible objects —
        const courses: ScCourse[] = (formData.data.courses ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          start_date: '',
          end_date: '',
          status: 'active' as const,
          max_spots: null,
          sc_weeks: (c.weeks ?? []).map((w: any) => ({
            id: w.id,
            course_id: c.id,
            week_number: 0,
            label: w.label,
            start_date: w.start_date ?? '',
            end_date: w.end_date ?? '',
            sort_order: 0,
          })),
        }));
        this.courses.set(courses);
        this.instructors.set(formData.data.instructors ?? []);
        this.areas.set(formData.data.areas ?? []);

        // Use query-param course or first course
        const preselect = this.fromCourse() ? this.currentCourseId() : 0;
        const first = (preselect ? courses.find(c => c.id === preselect) : null) ?? courses[0];
        if (first) {
          this.currentCourseId.set(first.id);
          this.currentWeeks.set(first.sc_weeks ?? []);
          if (first.sc_weeks?.length) {
            this.loadSchedule(first.sc_weeks[0].id);
          } else {
            this.loading.set(false);
          }
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Error al cargar los datos del catálogo.');
        this.loading.set(false);
      },
    });
  }

  loadSchedule(week_id: number): void {
    this.loading.set(true);
    this.activitiesSvc.getSchedule(week_id).subscribe({
      next: res => {
        this.scheduleState.set(this.apiToState(res.data.schedule));
        this.loading.set(false);
      },
      error: () => {
        this.scheduleState.set(this.emptyState());
        this.loading.set(false);
      },
    });
  }

  // ── Course / Week / Day navigation ───────────────────────────────────────
  onCourseChange(courseId: number): void {
    const course = this.courses().find(c => c.id === courseId);
    if (!course) return;
    this.currentCourseId.set(courseId);
    this.currentWeeks.set(course.sc_weeks ?? []);
    this.currentWeekIdx.set(0);
    this.currentDayIdx.set(0);
    // Recargar áreas para el nuevo curso
    this.activitiesSvc.getFormData(courseId).subscribe({
      next: fd => this.areas.set(fd.data.areas ?? []),
      error: () => {},
    });
    if (course.sc_weeks?.length) {
      this.loadSchedule(course.sc_weeks[0].id);
    }
  }

  onWeekChange(idx: number): void {
    this.currentWeekIdx.set(idx);
    const week = this.currentWeeks()[idx];
    if (week) this.loadSchedule(week.id);
  }

  prevWeek(): void {
    const next = this.currentWeekIdx() - 1;
    if (next >= 0) this.onWeekChange(next);
  }

  nextWeek(): void {
    const next = this.currentWeekIdx() + 1;
    if (next < this.currentWeeks().length) this.onWeekChange(next);
  }

  goBack(): void {
    this.router.navigate(['/summer-course/courses']);
  }

  setDay(idx: number): void {
    this.currentDayIdx.set(idx);
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  onActivityDragStart(act: ScActivityType): void {
    this.dragActivity.set(act);
  }

  onDrop(target: DropTarget): void {
    const act = this.dragActivity();
    if (!act) return;
    this.dragActivity.set(null);
    this.pendingDrop.set({ activity: act, target });
  }

  /** Triggered when user clicks the + button on a cell */
  onCellAdd(target: DropTarget): void {
    // Open drop modal in pick-activity mode (no specific activity preselected)
    const placeholder = this.SC_ACTIVITIES()[0];
    if (!placeholder) return;
    this.pendingDrop.set({ activity: placeholder, target, pickActivity: true });
  }

  onDropModalConfirm(data: { instructorId: number | null; areaId: number | null; activity?: any }): void {
    const pd = this.pendingDrop();
    if (!pd) return;
    const act = (pd.pickActivity && data.activity) ? data.activity : pd.activity;
    this.addEntryToState(act, pd.target, data.instructorId, data.areaId);
    this.pendingDrop.set(null);
  }

  onDropModalCancel(): void {
    this.pendingDrop.set(null);
  }

  // ── Detail modal ─────────────────────────────────────────────────────────
  onChipClick(data: { entry: CellEntry; target: DetailTarget }): void {
    this.detailTarget.set(data);
  }

  onDetailSave(data: { instructorId: number | null; areaId: number | null }): void {
    const dt = this.detailTarget();
    if (!dt) return;
    this.scheduleState.update(state => {
      const ns = this.cloneState(state);
      const cell = ns[dt.target.dayIdx]?.[dt.target.slotId]?.[dt.target.levelNum];
      if (cell?.[dt.target.entryIdx] !== undefined) {
        cell[dt.target.entryIdx] = { ...cell[dt.target.entryIdx], instructorId: data.instructorId, areaId: data.areaId };
      }
      return ns;
    });
    this.detailTarget.set(null);
  }

  onDetailRemove(): void {
    const dt = this.detailTarget();
    if (!dt) return;
    this.removeEntry(dt.target, dt.target.entryIdx);
    this.detailTarget.set(null);
  }

  onDetailCancel(): void {
    this.detailTarget.set(null);
  }

  // ── Day operations ────────────────────────────────────────────────────────
  copyDayToAllWeek(): void {
    const src = this.currentDayIdx();
    this.scheduleState.update(state => {
      const ns = this.cloneState(state);
      for (let d = 0; d < 5; d++) {
        if (d !== src) {
          ns[d] = JSON.parse(JSON.stringify(ns[src]));
        }
      }
      return ns;
    });
    this.showToast('Día copiado a todos los días de la semana.');
  }

  /** Saves current week schedule then copies it to all other weeks of the course */
  copyWeekToAll(): void {
    const week = this.currentWeek();
    if (!week) return;
    const allWeeks = this.currentWeeks();
    if (allWeeks.length < 2) {
      this.showToast('El curso solo tiene una semana.', 'danger');
      return;
    }
    const targetIds = allWeeks.filter(w => w.id !== week.id).map(w => w.id);
    this.saving.set(true);
    // First save the current week, then copy
    const payload = this.buildSavePayload(week.id);
    this.activitiesSvc.saveSchedule(payload).subscribe({
      next: () => {
        this.activitiesSvc.copySchedule(week.id, targetIds).subscribe({
          next: res => {
            this.saving.set(false);
            this.showToast(`Semana copiada a ${res.data.copied_to} semana(s) — ${res.data.activities_each} actividades c/u.`, 'success');
          },
          error: () => {
            this.saving.set(false);
            this.showToast('Error al copiar la semana.', 'danger');
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Error al guardar antes de copiar.', 'danger');
      },
    });
  }

  clearDay(): void {
    const d = this.currentDayIdx();
    this.scheduleState.update(state => {
      const ns = this.cloneState(state);
      ns[d] = this.emptyDayState();
      return ns;
    });
    this.showToast('Día limpiado.');
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  save(): void {
    const week = this.currentWeek();
    if (!week) return;
    this.saving.set(true);
    const payload = this.buildSavePayload(week.id);
    this.activitiesSvc.saveSchedule(payload).subscribe({
      next: res => {
        this.saving.set(false);
        this.showToast(`Horario guardado — ${res.saved} actividades.`, 'success');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Error al guardar el horario.', 'danger');
      },
    });
  }

  // ── State helpers ─────────────────────────────────────────────────────────
  private emptyState(): ScheduleState {
    return Array.from({ length: 5 }, () => this.emptyDayState());
  }

  private emptyDayState(): Record<string, Record<number, CellEntry[]>> {
    const day: Record<string, Record<number, CellEntry[]>> = {};
    for (const slot of SC_SLOTS) {
      day[slot.id] = {};
      for (const lvl of this.SC_LEVELS()) {
        day[slot.id][lvl.n] = [];
      }
    }
    return day;
  }

  private cloneState(state: ScheduleState): ScheduleState {
    return JSON.parse(JSON.stringify(state));
  }

  private addEntryToState(act: ScActivityType, target: DropTarget, instructorId: number | null, areaId: number | null = null): void {
    this.scheduleState.update(state => {
      const ns = this.cloneState(state);
      if (!ns[target.dayIdx]) ns[target.dayIdx] = this.emptyDayState();
      if (!ns[target.dayIdx][target.slotId]) ns[target.dayIdx][target.slotId] = {};
      if (!ns[target.dayIdx][target.slotId][target.levelNum]) ns[target.dayIdx][target.slotId][target.levelNum] = [];
      ns[target.dayIdx][target.slotId][target.levelNum].push({
        activityId: act.id,
        name: act.label,
        instructorId,
        areaId,
      });
      return ns;
    });
  }

  private removeEntry(target: DropTarget, idx: number): void {
    this.scheduleState.update(state => {
      const ns = this.cloneState(state);
      ns[target.dayIdx]?.[target.slotId]?.[target.levelNum]?.splice(idx, 1);
      return ns;
    });
  }

  /** Convert API schedule format to ScheduleState */
  private apiToState(api: ScScheduleData): ScheduleState {
    const state = this.emptyState();
    if (!api?.length) return state;
    api.forEach((dayData, dayIdx) => {
      if (!dayData) return;
      for (const slotId of Object.keys(dayData)) {
        const entries: ScScheduleApiEntry[] = dayData[slotId] ?? [];
        entries.forEach(entry => {
          for (const lvl of (entry.levels ?? [])) {
            if (!state[dayIdx][slotId]) state[dayIdx][slotId] = {};
            if (!state[dayIdx][slotId][lvl]) state[dayIdx][slotId][lvl] = [];
            state[dayIdx][slotId][lvl].push({
              activityId: this.nameToActivityId(entry.name),
              name: entry.name,
              instructorId: entry.instructorId,
              areaId: entry.areaId ?? null,
              dbId: entry.id,
            });
          }
        });
      }
    });
    return state;
  }

  /** Build POST payload for saveSchedule */
  private buildSavePayload(week_id: number): ScScheduleSavePayload {
    const schedule: Record<string, Record<string, Record<string, Array<{ name: string; instructorId: number | null; area_id: number | null }>>>> = {};
    const state = this.scheduleState();

    state.forEach((dayData, dayIdx) => {
      schedule[String(dayIdx)] = {};
      for (const slotId of SC_SLOTS.map(s => s.id)) {
        schedule[String(dayIdx)][slotId] = {};
        for (const lvl of this.SC_LEVELS().map(l => l.n)) {
          const entries = dayData?.[slotId]?.[lvl] ?? [];
          if (entries.length) {
            schedule[String(dayIdx)][slotId][String(lvl)] = entries.map(e => ({
              name: e.name,
              instructorId: e.instructorId,
              area_id: e.areaId,
            }));
          }
        }
      }
    });

    return {
      week_id,
      course_id: this.currentCourseId(),
      schedule,
    };
  }

  /** Try to map activity name back to catalog id */
  private nameToActivityId(name: string): string {
    const n = name.toLowerCase().replace(/\s+/g, '_');
    const found = this.SC_ACTIVITIES().find((a: ScActivityType) => a.label.toLowerCase().replace(/\s+/g, '_') === n || a.id === n);
    return found?.id ?? n;
  }

  /** Count distinct activities in current day */
  private countActivitiesForDay(): number {
    const day = this.scheduleState()[this.currentDayIdx()] ?? {};
    let count = 0;
    for (const slotId of Object.keys(day)) {
      for (const lvl of Object.keys(day[slotId])) {
        count += day[slotId][+lvl]?.length ?? 0;
      }
    }
    return count;
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 3500);
  }

  clearError(): void { this.error.set(null); }
}
