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
  viewMode = signal<'grid' | 'list' | 'calendar'>('grid');
  actividades   = signal<Actividad[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);


  formatHora(hora: string): string {
    if (!hora) return '';
    const parts = hora.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  calendarDays = computed(() => {
    const list = this.filteredActividades();
    const days = [
      { dia: 1, nombre: 'Lunes', acts: [] as any[], total: 0 },
      { dia: 2, nombre: 'Martes', acts: [] as any[], total: 0 },
      { dia: 3, nombre: 'Miércoles', acts: [] as any[], total: 0 },
      { dia: 4, nombre: 'Jueves', acts: [] as any[], total: 0 },
      { dia: 5, nombre: 'Viernes', acts: [] as any[], total: 0 },
      { dia: 6, nombre: 'Sábado', acts: [] as any[], total: 0 },
      { dia: 7, nombre: 'Domingo', acts: [] as any[], total: 0 },
    ];

    for (const act of list) {
      if (!act.grupos_categorias) continue;
      
      const porDia: Record<number, any[]> = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[] };

      for (const gc of act.grupos_categorias) {
        if (!gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (!eq.horarios) continue;
          for (const h of eq.horarios) {
            if (porDia[h.dia_semana]) {
              porDia[h.dia_semana].push(h);
            }
          }
        }
      }

      for (const diaStr in porDia) {
        const dia = parseInt(diaStr);
        const horarios = porDia[dia];
        if (horarios.length > 0) {
          const day = days.find(d => d.dia === dia);
          if (day) {
            day.total += horarios.length;
            
            // Group identical time slots
            const slots: Record<string, any> = {};
            for (const h of horarios) {
               const key = `${h.hora_inicio}-${h.hora_fin}`;
               if (!slots[key]) {
                  slots[key] = { start: h.hora_inicio, end: h.hora_fin, count: 0 };
               }
               slots[key].count++;
            }
            
            day.acts.push({
               act,
               totalSesiones: horarios.length,
               slots: Object.values(slots).sort((a: any, b: any) => (a.start||'').localeCompare(b.start||''))
            });
          }
        }
      }
    }

    days.forEach(d => {
      d.acts.sort((a, b) => a.act.nombre.localeCompare(b.act.nombre));
    });

    return days;
  });

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

  formatTipo(tipo?: string | null): string {
    if (!tipo) return 'Desconocido';
    const str = tipo.replace(/[_-]/g, ' ');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

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
  toggleSocios(act: Actividad) {
    const newVal = act.elegible_para_socios === false ? true : false;
    act.elegible_para_socios = newVal;
    this.svc.update(act.id, act as any).subscribe({
      next: () => this.showToast(`Actividad cambiada a ${newVal ? 'Socios' : 'Staff'}.`),
      error: err => {
        console.error(err);
        act.elegible_para_socios = !newVal; // revert
        this.showToast('Error al actualizar acceso.');
      }
    });
  }

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
