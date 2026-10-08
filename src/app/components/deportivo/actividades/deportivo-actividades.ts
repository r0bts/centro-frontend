import { FormsModule } from '@angular/forms';
import { computed, 
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadService } from '../../../services/deportivo/actividad.service';
import { AuthService } from '../../../services/auth.service';
import { Actividad, ActividadFormData } from '../../../models/deportivo/actividad.model';
import { ActividadWizardComponent } from './actividad-wizard/actividad-wizard';

@Component({
  selector: 'app-deportivo-actividades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ActividadWizardComponent, FormsModule],
  templateUrl: './deportivo-actividades.html',
  styleUrl: './deportivo-actividades.scss',
})
export class DeportivoActividadesComponent implements OnInit {
  private svc    = inject(ActividadService);
  private auth   = inject(AuthService);

  // ── State ──────────────────────────────────────────────────────────────────
  formData      = signal<ActividadFormData | null>(null);
  filterClubId  = signal<number | null>(null);
  filterAreaId  = signal<number | null>(null);
  filterHorario = signal<string>('');
  viewMode = signal<'grid' | 'list'>('grid');
  actividades   = signal<Actividad[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);


  filteredActividades = computed(() => {
    let list = this.actividades();
    const cId = this.filterClubId();
    const aId = this.filterAreaId();
    const searchH = this.filterHorario()?.toLowerCase().trim();

    if (cId) {
      list = list.filter(a => a.club_id === cId);
    }
    
    if (aId || searchH) {
      list = list.filter(a => {
        // If aId is set, does any grupo > horario match this area?
        // Wait, Actividad has `grupos_categorias`, let's search them.
        let matchArea = false;
        let matchHorario = false;

        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (aId && h.area_id === aId) matchArea = true;
              
              if (searchH) {
                const dayMap = [null, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                const dayName = dayMap[h.dia_semana]?.toLowerCase() || '';
                if (dayName.includes(searchH) || h.hora_inicio?.includes(searchH) || h.hora_fin?.includes(searchH)) {
                  matchHorario = true;
                }
              }
            }
          }
        }
        
        if (aId && !matchArea) return false;
        if (searchH && !matchHorario) return false;
        return true;
      });
    }

    return list;
  });

  // delete
  deleteTarget  = signal<Actividad | null>(null);
  deleting      = signal(false);

  // wizard
  wizardOpen        = signal(false);
  wizardEditTarget  = signal<Actividad | null>(null);

  getClubName(clubId?: number): string {
    if (!clubId) return 'Todas las sedes';
    const clubes = this.formData()?.acceso_clubes || [];
    const club = clubes.find(c => c.id === clubId);
    return club ? club.name : 'Todas las sedes';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.svc.getFormData().subscribe(res => {
      this.formData.set(res.data);
    });
    this.loadActividades();
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  loadActividades(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().subscribe({
      next: res => {
        this.actividades.set(res.data?.actividades ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las actividades. Verifica tu conexión.');
        this.loading.set(false);
      },
    });
  }

  /** Recarga silenciosa — sin skeleton, usada después de guardar */
  refreshActividades(): void {
    this.svc.getAll().subscribe({
      next: res => {
        this.actividades.set(res.data?.actividades ?? []);
      },
    });
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  openWizard(): void {
    this.wizardEditTarget.set(null);
    this.wizardOpen.set(true);
  }

  editActividad(act: Actividad): void {
    this.wizardEditTarget.set(act);
    this.wizardOpen.set(true);
  }

  duplicateActividad(act: Actividad): void {
    if (confirm(`¿Estás seguro de duplicar "${act.nombre}"?`)) {
      this.svc.duplicate(act.id).subscribe({
        next: () => {
          this.showToast('Actividad duplicada exitosamente');
          this.refreshActividades();
        },
        error: () => this.error.set('Error al duplicar')
      });
    }
  }

  onWizardSaved(msg: string): void {
    this.wizardOpen.set(false);
    this.wizardEditTarget.set(null);
    this.showToast(msg);
    this.refreshActividades();
  }

  onWizardCancelled(): void {
    this.wizardOpen.set(false);
    this.wizardEditTarget.set(null);
  }

  // ── Toggle activo ──────────────────────────────────────────────────────────
  toggleActive(act: Actividad): void {
    this.svc.toggleActive(act.id, !act.is_active).subscribe({
      next: res => {
        this.actividades.update(list =>
          list.map(a => a.id === act.id ? { ...a, is_active: res.data.is_active } : a)
        );
        this.showToast(act.is_active ? 'Actividad desactivada' : 'Actividad activada');
      },
      error: () => this.error.set('Error al cambiar estado de la actividad.'),
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  confirmDelete(act: Actividad): void {
    this.deleteTarget.set(act);
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
        this.actividades.update(list => list.filter(a => a.id !== target.id));
        this.deleteTarget.set(null);
        this.deleting.set(false);
        this.showToast('Actividad eliminada correctamente');
      },
      error: () => {
        this.error.set('Error al eliminar la actividad.');
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  labelMensajeria(modo: string | undefined): string {
    const map: Record<string, string> = {
      bidireccional: 'Bidireccional',
      solo_respuesta: 'Solo respuesta',
      solo_lectura: 'Solo lectura',
    };
    return modo ? (map[modo] ?? modo) : '—';
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3500);
  }

  clearError(): void { this.error.set(null); }
  clearToast(): void { this.toast.set(null); }
}
