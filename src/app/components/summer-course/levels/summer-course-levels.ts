import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScEnrollmentsService } from '../../../services/summer-course/sc-enrollments.service';
import { ScLevelGroupsService }  from '../../../services/summer-course/sc-level-groups.service';
import {
  ScCourse,
  ScLevelGroup,
  ScSportsUser,
  SC_LEVEL_LABELS,
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
  private enrollSvc = inject(ScEnrollmentsService);
  private groupSvc  = inject(ScLevelGroupsService);

  // ── State ──────────────────────────────────────────────────────────────────
  courses       = signal<ScCourse[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);
  toastType     = signal<'success' | 'danger'>('success');
  filterCourse  = signal<number>(0);

  // Groups state
  groups         = signal<ScLevelGroup[]>([]);
  groupsLoading  = signal(false);
  sportsUsers    = signal<ScSportsUser[]>([]);
  groupModal     = signal(false);
  groupEditTarget = signal<ScLevelGroup | null>(null);
  groupLevel     = signal<number>(1);
  groupAlias     = signal('');
  groupTeacherId = signal<number | null>(null);
  groupAuxIds    = signal<number[]>([]);
  groupCapacity  = signal<number | null>(null);
  groupSaving    = signal(false);

  readonly levelLabels = SC_LEVEL_LABELS;
  readonly levelList   = Array.from({ length: 8 }, (_, i) => i + 1);

  constructor() {
    // Recarga grupos cada vez que cambia el curso filtrado
    effect(() => {
      const course = this.filterCourse();
      if (course > 0) this.loadGroups(course);
      else this.groups.set([]);
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    // Cargar cursos y usuarios deportivos en paralelo
    this.enrollSvc.getFormData().subscribe({
      next: res => {
        this.courses.set((res.data.courses ?? []) as any[]);
      },
      error: () => this.error.set('Error al cargar cursos.'),
    });
    this.groupSvc.getFormData().subscribe({
      next: res => {
        this.sportsUsers.set(res.data.sports_users ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar usuarios deportivos.');
        this.loading.set(false);
      },
    });
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  loadGroups(courseId: number): void {
    this.groupsLoading.set(true);
    this.groupSvc.getByCourse(courseId).subscribe({
      next: res => {
        const flat: ScLevelGroup[] = [];
        for (const lvl of (res.data.groups_by_level ?? [])) flat.push(...lvl.groups);
        this.groups.set(flat);
        this.groupsLoading.set(false);
      },
      error: () => this.groupsLoading.set(false),
    });
  }

  groupsForLevel(lvl: number): ScLevelGroup[] {
    return this.groups().filter(g => g.level_id === lvl && g.is_active);
  }

  openGroupModal(lvl?: number, g?: ScLevelGroup): void {
    this.groupEditTarget.set(g ?? null);
    this.groupLevel.set(g?.level_id ?? lvl ?? 1);
    this.groupAlias.set(g?.alias ?? '');
    this.groupTeacherId.set(g?.teacher_id ?? null);
    this.groupAuxIds.set((g?.auxiliaries ?? []).map(a => a.id));
    this.groupCapacity.set(g?.capacity ?? null);
    this.groupModal.set(true);
  }

  closeGroupModal(): void {
    this.groupModal.set(false);
    this.groupEditTarget.set(null);
  }

  saveGroup(): void {
    if (!this.groupAlias().trim()) return;
    this.groupSaving.set(true);
    const target = this.groupEditTarget();
    const payload = {
      course_id:    this.filterCourse(),
      level_id:     this.groupLevel(),
      alias:        this.groupAlias().trim(),
      teacher_id:   this.groupTeacherId(),
      auxiliaries:  this.groupAuxIds(),
      capacity:     this.groupCapacity(),
    };
    const req$ = target
      ? this.groupSvc.update(target.id, payload)
      : this.groupSvc.create(payload);
    req$.subscribe({
      next: res => {
        this.groups.update(list =>
          target
            ? list.map(g => g.id === target.id ? res.data : g)
            : [...list, res.data]
        );
        this.groupSaving.set(false);
        this.closeGroupModal();
        this.showToast(target ? 'Grupo actualizado.' : 'Grupo creado.', 'success');
      },
      error: () => {
        this.groupSaving.set(false);
        this.showToast('Error al guardar grupo.', 'danger');
      },
    });
  }

  deleteGroup(g: ScLevelGroup): void {
    if (!confirm(`¿Eliminar el grupo "${g.alias}"?`)) return;
    this.groupSvc.remove(g.id).subscribe({
      next: () => {
        this.groups.update(list => list.filter(x => x.id !== g.id));
        this.showToast('Grupo eliminado.', 'success');
      },
      error: () => this.showToast('Error al eliminar grupo.', 'danger'),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isAuxSelected(id: number): boolean {
    return this.groupAuxIds().includes(id);
  }

  toggleAux(id: number): void {
    const current = this.groupAuxIds();
    if (current.includes(id)) {
      this.groupAuxIds.set(current.filter(x => x !== id));
    } else {
      this.groupAuxIds.set([...current, id]);
    }
  }

  auxName(id: number): string {
    return this.sportsUsers().find(u => u.id === id)?.full_name ?? `#${id}`;
  }

  removeAux(id: number): void {
    this.groupAuxIds.update(list => list.filter(x => x !== id));
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

