import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScLevelGroupsService }  from '../../../services/summer-course/sc-level-groups.service';
import {
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
  private groupSvc = inject(ScLevelGroupsService);

  // ── State ──────────────────────────────────────────────────────────────────
  loading    = signal(true);
  error      = signal<string | null>(null);
  toast      = signal<string | null>(null);
  toastType  = signal<'success' | 'danger'>('success');

  // Groups state
  groups          = signal<ScLevelGroup[]>([]);
  groupsLoading   = signal(false);
  sportsUsers     = signal<ScSportsUser[]>([]);

  // Modal — V2: solo edición de teacher_id y capacity
  groupModal      = signal(false);
  groupEditTarget = signal<ScLevelGroup | null>(null);
  groupTeacherId  = signal<number | null>(null);
  groupCapacity   = signal<number | null>(null);
  groupSaving     = signal(false);

  readonly levelLabels = SC_LEVEL_LABELS;
  readonly levelList   = [...Array.from({ length: 8 }, (_, i) => i + 1), 99];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Cargar usuarios instructores/deportivos para el select de profesor
    this.groupSvc.getFormData().subscribe({
      next: res => {
        this.sportsUsers.set(res.data.sports_users ?? []);
      },
      error: () => this.error.set('Error al cargar instructores.'),
    });

    // Cargar los 23 grupos globales V2
    this.groupSvc.getAll().subscribe({
      next: res => {
        const flat: ScLevelGroup[] = [];
        for (const lvl of (res.data.groups_by_level ?? [])) flat.push(...lvl.groups);
        this.groups.set(flat);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar grupos.');
        this.loading.set(false);
      },
    });
  }

  groupsForLevel(lvl: number): ScLevelGroup[] {
    return this.groups().filter(g => g.level_id === lvl && g.is_active);
  }

  openGroupModal(g: ScLevelGroup): void {
    this.groupEditTarget.set(g);
    this.groupTeacherId.set(g.teacher_id ?? null);
    this.groupCapacity.set(g.capacity ?? null);
    this.groupModal.set(true);
  }

  closeGroupModal(): void {
    this.groupModal.set(false);
    this.groupEditTarget.set(null);
  }

  saveGroup(): void {
    const target = this.groupEditTarget();
    if (!target) return;
    this.groupSaving.set(true);

    const payload = {
      teacher_id: this.groupTeacherId(),
      capacity:   this.groupCapacity(),
    };

    this.groupSvc.update(target.id, payload).subscribe({
      next: res => {
        this.groups.update(list =>
          list.map(g => g.id === target.id ? { ...g, ...res.data } : g)
        );
        this.groupSaving.set(false);
        this.closeGroupModal();
        this.showToast('Grupo actualizado.', 'success');
      },
      error: () => {
        this.groupSaving.set(false);
        this.showToast('Error al guardar grupo.', 'danger');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  levelRoman(n: number | null | undefined): string {
    if (!n) return '—';
    return SC_LEVEL_LABELS[n]?.roman ?? String(n);
  }

  levelAge(n: number | null | undefined): string {
    if (!n) return '';
    return SC_LEVEL_LABELS[n]?.age ?? '';
  }

  copiedAlias = signal<string | null>(null);

  groupScanUrl(alias: string): string {
    return `${window.location.origin}/sc-scan/${encodeURIComponent(alias)}`;
  }

  copyUrl(alias: string): void {
    navigator.clipboard.writeText(this.groupScanUrl(alias)).then(() => {
      this.copiedAlias.set(alias);
      setTimeout(() => this.copiedAlias.set(null), 2000);
    }).catch(() => {
      this.showToast('No se pudo copiar al portapapeles.', 'danger');
    });
  }

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 3500);
  }

  clearError(): void { this.error.set(null); }
}

