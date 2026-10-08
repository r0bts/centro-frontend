import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { computed, 
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Directive, ElementRef, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';

@Directive({
  selector: '[bsDropdownState]',
  standalone: true
})
export class BsDropdownStateDirective implements OnInit, OnDestroy {
  @Output() bsDropdownState = new EventEmitter<boolean>();
  private isOpen = false;
  
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('show.bs.dropdown', () => { this.isOpen = true; this.bsDropdownState.emit(true); });
    this.el.nativeElement.addEventListener('hidden.bs.dropdown', () => { this.isOpen = false; this.bsDropdownState.emit(false); });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) {
      const toggle = this.el.nativeElement.querySelector('[data-bs-toggle="dropdown"]');
      if (toggle) {
        // Force click to close if Bootstrap missed it
        toggle.click();
      }
    }
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('show.bs.dropdown', () => this.bsDropdownState.emit(true));
    this.el.nativeElement.removeEventListener('hidden.bs.dropdown', () => this.bsDropdownState.emit(false));
  }
}

import { ActividadService } from '../../../services/deportivo/actividad.service';
import { AuthService } from '../../../services/auth.service';
import { Actividad, ActividadFormData } from '../../../models/deportivo/actividad.model';
import { ActividadWizardComponent } from './actividad-wizard/actividad-wizard';

@Component({
  selector: 'app-deportivo-actividades',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgSelectModule, ActividadWizardComponent, FormsModule, BsDropdownStateDirective],
  templateUrl: './deportivo-actividades.html',
  styleUrl: './deportivo-actividades.scss',
})
export class DeportivoActividadesComponent implements OnInit {
  private svc    = inject(ActividadService);
  private auth   = inject(AuthService);

  // ── State ──────────────────────────────────────────────────────────────────
  formData      = signal<ActividadFormData | null>(null);
  filterClubId  = signal<number | null>(null);
  filterAcceso  = signal<boolean | null>(null);
  filterNombre  = signal<string>('');
  filterHorario = signal<string>('');
  filterProfesorId = signal<number | null>(null);
  viewMode = signal<'grid' | 'list' | 'calendar'>(
    (localStorage.getItem('centro_actividades_view_mode') as any) || 'grid'
  );

  constructor() {
    effect(() => {
      localStorage.setItem('centro_actividades_view_mode', this.viewMode());
    });
  }
  dropdownState = signal<Record<number, boolean>>({});

  setDropdownState(id: number, state: boolean) {
    this.dropdownState.update(s => ({ ...s, [id]: state }));
  }

  isDropdownOpen(id: number): boolean {
    return this.dropdownState()[id] || false;
  }

  actividades   = signal<Actividad[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);



  getExtraInstructoresNames(profs: number[]): string {
    return profs.slice(2).map(id => this.getInstructorName(id)).join(', ');
  }

  getInstructorName(id: number, full: boolean = false): string {
    const list = this.formData()?.instructores || [];
    const found = list.find(x => x.id === id);
    if (!found) return 'Desconocido';
    return full ? found.full_name : found.full_name.split(' ').slice(0, 2).join(' '); // Show first 2 words for compactness
  }

  getInstructoresDeActividad(act: Actividad): number[] {
    const ids = new Set<number>();
    if (act.profesor_id) ids.add(act.profesor_id);
    if (act.grupos_categorias) {
      for (const g of act.grupos_categorias) {
        if (g.equipos) {
          for (const e of g.equipos) {
            if (e.horarios) {
              for (const h of e.horarios) {
                if (h.profesor_id) ids.add(h.profesor_id);
              }
            }
          }
        }
      }
    }
    return Array.from(ids);
  }

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
    const qName = this.filterNombre()?.toLowerCase().trim();
    const cId = this.filterClubId();
    const pId = this.filterProfesorId();
    const searchH = this.filterHorario()?.toLowerCase().trim();
    const filterAcceso = this.filterAcceso();

    if (qName) {
      list = list.filter(a => a.nombre.toLowerCase().includes(qName));
    }

    if (cId) {
      list = list.filter(a => a.club_id === cId);
    }

    if (filterAcceso !== null) {
      if (filterAcceso) {
        list = list.filter(a => a.elegible_para_socios !== false);
      } else {
        list = list.filter(a => a.elegible_para_socios === false);
      }
    }
    
    if (searchH || pId) {
      list = list.filter(a => {
        let matchHorario = false;
        let matchProfesor = false;

        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            if (pId && eq.coach_id === pId) matchProfesor = true;
            
            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (pId && h.profesor_id === pId) matchProfesor = true;
              
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
        
        if (pId && !matchProfesor) return false;
        if (searchH && !matchHorario) return false;
        return true;
      });
    }

    return list;
  });

  // delete
  deleteTarget  = signal<Actividad | null>(null);
  selectedActividadForHorarios = signal<Actividad | null>(null);
  isOffcanvasOpen = signal(false);
  inlineFormEquipoId = signal<number | null>(null);
  inlineFormDia = signal<number | null>(null);
  inlineFormProfesorId = signal<number | null>(null);
  horarioForm = {
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fin: '09:00',
    profesor_id: null as number | null
  };
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
    this.svc.update(act.id, { elegible_para_socios: newVal } as any).subscribe({
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

  

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOffcanvasOpen()) {
      this.closeHorariosOffcanvas();
    }
  }

  openHorariosOffcanvas(act: Actividad) {

    this.selectedActividadForHorarios.set(act);
    this.isOffcanvasOpen.set(true);
    // Reset form
    this.horarioForm = { dia_semana: 1, hora_inicio: '08:00', hora_fin: '09:00', profesor_id: null };
  }

  openInlineForm(equipoId: number, dia: number, profesorId: number) {
    this.inlineFormEquipoId.set(equipoId);
    this.inlineFormDia.set(dia);
    this.inlineFormProfesorId.set(profesorId);
    this.horarioForm.dia_semana = dia;
    this.horarioForm.hora_inicio = '09:00';
    this.horarioForm.hora_fin = '10:00';
  }

  async saveInlineForm() {
    const equipoId = this.inlineFormEquipoId();
    const profId = this.inlineFormProfesorId();
    if (!equipoId) return;

    const act = this.selectedActividadForHorarios();
    if (!act) return;
    
    try {
      const payload: any = {
        dia_semana: Number(this.horarioForm.dia_semana),
        hora_inicio: this.horarioForm.hora_inicio + ':00',
        hora_fin: this.horarioForm.hora_fin + ':00'
      };
      
      if (profId && profId > 0) {
        payload.profesor_id = profId;
      }

      const res = await firstValueFrom(this.svc.createHorario(equipoId, payload));
      
      const g = act.grupos_categorias?.find(g => g.equipos?.some(e => e.id === equipoId));
      if (g) {
        const e = g.equipos?.find(e => e.id === equipoId);
        if (e) {
          if (!e.horarios) e.horarios = [];
          e.horarios.push(res.data);
        }
      }
      this.selectedActividadForHorarios.set({...act});
      this.showToast('Horario agregado');
      this.inlineFormEquipoId.set(null);
      this.loadActividades();
    } catch (error: any) {
      this.error.set(error.message || 'Error al agregar el horario');
      setTimeout(() => this.error.set(null), 3000);
    }
  }

  closeHorariosOffcanvas() {
    this.isOffcanvasOpen.set(false);
    setTimeout(() => this.selectedActividadForHorarios.set(null), 300);
  }

  async deleteHorarioRapido(actId: number, equipoId: number, horarioId: number) {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await firstValueFrom(this.svc.deleteHorario(equipoId, horarioId));
      this.showToast('Horario eliminado.');
      this.loadActividades(); // Reload to reflect changes
      // Update local state for offcanvas directly
      this.selectedActividadForHorarios.update(act => {
        if (!act) return null;
        for (const g of act.grupos_categorias ?? []) {
          for (const e of g.equipos ?? []) {
            if (e.id === equipoId && e.horarios) {
              e.horarios = e.horarios.filter(h => h.id !== horarioId);
            }
          }
        }
        return { ...act };
      });
    } catch (e) {
      this.showToast('Error al eliminar horario');
    }
  }

  async addHorarioRapido(equipoId: number) {
    const act = this.selectedActividadForHorarios();
    if (!act) return;
    
    try {
      const res = await firstValueFrom(this.svc.createHorario(equipoId, {
        dia_semana: Number(this.horarioForm.dia_semana),
        hora_inicio: this.horarioForm.hora_inicio + ':00',
        hora_fin: this.horarioForm.hora_fin + ':00',
        profesor_id: this.horarioForm.profesor_id || undefined,
        is_active: true
      }));
      
      this.showToast('Horario agregado.');
      this.loadActividades();
      
      this.selectedActividadForHorarios.update(a => {
        if (!a) return null;
        for (const g of a.grupos_categorias ?? []) {
          for (const e of g.equipos ?? []) {
            if (e.id === equipoId) {
              if (!e.horarios) e.horarios = [];
              e.horarios.push(res.data);
            }
          }
        }
        return { ...a };
      });
    } catch (e) {
      this.showToast('Error al agregar horario');
    }
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

  agruparPorDia(horarios: any[]): any[] {
    if (!horarios) return [];
    
    // Group by Day
    const mapaDia = new Map<number, any[]>();
    for (const h of horarios) {
      if (!mapaDia.has(h.dia_semana)) mapaDia.set(h.dia_semana, []);
      mapaDia.get(h.dia_semana)!.push(h);
    }
    
    const result = Array.from(mapaDia.entries()).map(([dia, hrs]) => {
      // Group by Professor within the day
      const mapaProf = new Map<number, any[]>();
      for (const h of hrs) {
        const pId = h.profesor_id || 0;
        if (!mapaProf.has(pId)) mapaProf.set(pId, []);
        mapaProf.get(pId)!.push(h);
      }
      
      const profesores = Array.from(mapaProf.entries()).map(([pId, p_hrs]) => {
        p_hrs.sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
        
        const minHora = p_hrs[0].hora_inicio ? p_hrs[0].hora_inicio.substring(0,5) : '';
        const maxHora = p_hrs[p_hrs.length - 1].hora_fin ? p_hrs[p_hrs.length - 1].hora_fin.substring(0,5) : '';
        const rango_horas = `${minHora} - ${maxHora}`;
        
        return {
          profesor_id: pId,
          profesor_nombre: pId ? this.getInstructorName(pId, true) : 'Sin asignar',
          rango_horas: rango_horas,
          horarios: p_hrs
        };
      });
      
      profesores.sort((a, b) => a.horarios[0].hora_inicio.localeCompare(b.horarios[0].hora_inicio));

      return {
        dia,
        profesores
      };
    });
    
    result.sort((a, b) => a.dia - b.dia);
    return result;
  }

  daysMapping: Record<number, string> = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
  };
}
