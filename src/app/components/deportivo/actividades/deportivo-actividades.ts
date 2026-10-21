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
import Swal from 'sweetalert2';

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

  // ── Permisos del usuario para Actividades y Profesores (actividades.lista) ──
  get canCreate(): boolean {
    return this.auth.hasPermission('actividades.lista', 'create');
  }
  get canUpdate(): boolean {
    return this.auth.hasPermission('actividades.lista', 'update');
  }
  get canDelete(): boolean {
    return this.auth.hasPermission('actividades.lista', 'delete');
  }
  get canDuplicate(): boolean {
    return this.auth.hasPermission('actividades.lista', 'copy');
  }
  get canExportExcel(): boolean {
    return this.auth.hasPermission('actividades.lista', 'exportar_excel_actividades');
  }
  get canImportExcel(): boolean {
    return this.auth.hasPermission('actividades.lista', 'importar_excel_actividades');
  }
  get canBulkEdit(): boolean {
    return this.auth.hasPermission('actividades.lista', 'edicion_masiva_actividades');
  }
  get canManageHorarios(): boolean {
    return (
      this.auth.hasPermission('actividades.lista', 'gestionar_horarios_actividades') ||
      this.auth.hasPermission('actividades.lista', 'update') ||
      this.auth.hasPermission('actividades.equipos', 'update')
    );
  }
  get canManageCostos(): boolean {
    return this.auth.hasPermission('actividades.lista', 'gestionar_costos_actividades');
  }

  get availableViewModes(): Array<'grid' | 'list' | 'spreadsheet' | 'calendar' | 'classic' | 'heatmap'> {
    return this.canBulkEdit
      ? ['grid', 'list', 'spreadsheet', 'calendar', 'classic', 'heatmap']
      : ['grid', 'list', 'calendar', 'classic', 'heatmap'];
  }

  get activeViewModeTranslateX(): string {
    const idx = Math.max(0, this.availableViewModes.indexOf(this.viewMode()));
    return `translateX(${idx * 40}px)`;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  formData      = signal<ActividadFormData | null>(null);
  filterClubId  = signal<number | null>(null);
  filterAcceso  = signal<boolean | null>(null);
  filterNombre  = signal<string>('');
  filterHorario = signal<string>('');
  filterProfesorId = signal<number | null>(null);
  filterArea = signal<string | null>(null);
  viewMode = signal<'grid' | 'list' | 'calendar' | 'classic' | 'heatmap' | 'spreadsheet'>(
    (localStorage.getItem('centro_actividades_view_mode') as any) || 'grid'
  );

  constructor() {
    effect(() => {
      const current = this.viewMode();
      if (current === 'spreadsheet' && !this.canBulkEdit) {
        this.viewMode.set('grid');
        return;
      }
      localStorage.setItem('centro_actividades_view_mode', current);
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
    if (!found) return full ? `Profesor #${id}` : 'Desconocido';
    return full ? found.full_name : found.full_name.split(' ').slice(0, 2).join(' '); // Show first 2 words for compactness
  }

  getInstructoresDeActividad(act: Actividad): number[] {
    const ids = new Set<number>();
    if (act.profesor_id) ids.add(act.profesor_id);
    if (act.grupos_categorias) {
      for (const g of act.grupos_categorias) {
        if ((g as any).instructor_id) ids.add((g as any).instructor_id);
        if (g.equipos) {
          for (const e of g.equipos) {
            if (e.coach_id) ids.add(e.coach_id);
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

  hoveredConflictActId = signal<number | null>(null);
  conflictTooltipPos = signal<{ top: number; left: number; showAbove: boolean; maxHeight: number }>({
    top: 0,
    left: 0,
    showAbove: false,
    maxHeight: 260,
  });
  private hideConflictTimer: ReturnType<typeof setTimeout> | null = null;

  showConflictTooltip(event: MouseEvent, actId: number): void {
    this.cancelHideConflictTooltip();
    const el = event.currentTarget as HTMLElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const showAbove = spaceBelow < 340 && spaceAbove > spaceBelow;

    const availableSpace = showAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(140, Math.min(280, availableSpace - 64));

    let left = rect.left;
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - tooltipWidth - 16);
    }

    this.conflictTooltipPos.set({
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      showAbove,
      maxHeight,
    });
    this.hoveredConflictActId.set(actId);
  }

  cancelHideConflictTooltip(): void {
    if (this.hideConflictTimer) {
      clearTimeout(this.hideConflictTimer);
      this.hideConflictTimer = null;
    }
  }

  hideConflictTooltip(): void {
    this.cancelHideConflictTooltip();
    this.hideConflictTimer = setTimeout(() => {
      this.hoveredConflictActId.set(null);
    }, 180);
  }

  actividadesConflictsGroupsMap = computed<Map<number, Array<{
    profesor: string;
    actividad: string;
    grupo: string;
    esInterno: boolean;
    horarios: Array<{ dia: string; rango: string }>;
  }>>>(() => {
    const list = this.actividades();
    const instructores = this.formData()?.instructores || [];

    interface SchedItem {
      actId: number;
      actNombre: string;
      grupoNombre: string;
      horarioId: number;
      diaSemana: number;
      horaInicio: string;
      horaFin: string;
      startMin: number;
      endMin: number;
      profesorId: number;
      profesorNombre: string;
    }

    const allSchedules: SchedItem[] = [];

    for (const act of list) {
      if (act.is_active === false || !act.grupos_categorias) continue;
      for (const gc of act.grupos_categorias) {
        if (gc.is_active === false || !gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (eq.is_active === false || !eq.horarios) continue;
          for (const h of eq.horarios) {
            if (h.is_active === false || !h.hora_inicio || !h.hora_fin) continue;

            const profId = h.profesor_id || eq.coach_id || (gc as any).instructor_id || act.profesor_id || null;
            if (!profId) continue;

            const dia = Number(h.dia_semana);
            if (!dia || dia < 1 || dia > 7) continue;

            const startMin = this.timeToMinutes(h.hora_inicio);
            const endMin = this.timeToMinutes(h.hora_fin);
            if (endMin <= startMin) continue;

            const prof = instructores.find(i => Number(i.id) === Number(profId));
            const profNombre = prof ? prof.full_name : `Profesor #${profId}`;

            allSchedules.push({
              actId: act.id,
              actNombre: act.nombre,
              grupoNombre: gc.nombre || '',
              horarioId: h.id,
              diaSemana: dia,
              horaInicio: h.hora_inicio.substring(0, 5),
              horaFin: h.hora_fin.substring(0, 5),
              startMin,
              endMin,
              profesorId: Number(profId),
              profesorNombre: profNombre,
            });
          }
        }
      }
    }

    const groupsByAct = new Map<number, Map<string, {
      profesor: string;
      actividad: string;
      grupo: string;
      esInterno: boolean;
      horariosMap: Map<string, { dia: string; rango: string }>;
    }>>();

    const addConflict = (
      actId: number,
      profesor: string,
      actividad: string,
      grupo: string,
      esInterno: boolean,
      dia: string,
      rango: string
    ) => {
      if (!groupsByAct.has(actId)) {
        groupsByAct.set(actId, new Map());
      }
      const actGroups = groupsByAct.get(actId)!;
      const key = `${profesor}|${actividad}|${grupo}|${esInterno}`;
      if (!actGroups.has(key)) {
        actGroups.set(key, {
          profesor,
          actividad,
          grupo: grupo && grupo !== 'General' ? grupo : '',
          esInterno,
          horariosMap: new Map(),
        });
      }
      const hKey = `${dia}|${rango}`;
      actGroups.get(key)!.horariosMap.set(hKey, { dia, rango });
    };

    for (let i = 0; i < allSchedules.length; i++) {
      const a = allSchedules[i];
      for (let j = i + 1; j < allSchedules.length; j++) {
        const b = allSchedules[j];

        if (a.profesorId !== b.profesorId) continue;
        if (a.diaSemana !== b.diaSemana) continue;

        if (a.startMin < b.endMin && b.startMin < a.endMin) {
          const diaNombre = this.daysMapping[a.diaSemana] || `Día ${a.diaSemana}`;
          const aIni12 = this.formatHora(a.horaInicio);
          const aFin12 = this.formatHora(a.horaFin);
          const bIni12 = this.formatHora(b.horaInicio);
          const bFin12 = this.formatHora(b.horaFin);

          if (a.actId !== b.actId) {
            addConflict(a.actId, a.profesorNombre, b.actNombre, b.grupoNombre, false, diaNombre, `${bIni12} - ${bFin12}`);
            addConflict(b.actId, b.profesorNombre, a.actNombre, a.grupoNombre, false, diaNombre, `${aIni12} - ${aFin12}`);
          } else {
            const rangoInterno = (a.horaInicio === b.horaInicio && a.horaFin === b.horaFin)
              ? `${aIni12} - ${aFin12}`
              : `${aIni12}-${aFin12} / ${bIni12}-${bFin12}`;
            addConflict(a.actId, a.profesorNombre, a.actNombre, b.grupoNombre, true, diaNombre, rangoInterno);
          }
        }
      }
    }

    const finalMap = new Map<number, Array<{
      profesor: string;
      actividad: string;
      grupo: string;
      esInterno: boolean;
      horarios: Array<{ dia: string; rango: string }>;
    }>>();

    groupsByAct.forEach((actGroups, actId) => {
      const arr = Array.from(actGroups.values()).map(g => ({
        profesor: g.profesor,
        actividad: g.actividad,
        grupo: g.grupo,
        esInterno: g.esInterno,
        horarios: Array.from(g.horariosMap.values()),
      }));
      if (arr.length > 0) {
        finalMap.set(actId, arr);
      }
    });

    return finalMap;
  });

  actividadesConflictsMap = computed<Map<number, string>>(() => {
    const groupsMap = this.actividadesConflictsGroupsMap();
    const resultMap = new Map<number, string>();
    groupsMap.forEach((groups, actId) => {
      const lines = groups.map(g => {
        const hrs = g.horarios.map(h => `${h.dia} (${h.rango})`).join(', ');
        return `Empalme: ${g.profesor} en "${g.actividad}" — ${hrs}`;
      });
      resultMap.set(actId, lines.join('\n'));
    });
    return resultMap;
  });

  formatHora(hora: string | number): string {
    if (hora === null || hora === undefined || hora === '') return '';
    let h = 0;
    let m = '00';
    if (typeof hora === 'number') {
      h = hora % 24;
    } else {
      const parts = hora.split(':');
      h = parseInt(parts[0], 10);
      m = (parts[1] || '00').substring(0, 2).padStart(2, '0');
    }
    if (isNaN(h)) return String(hora);
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = (h % 12 || 12).toString().padStart(2, '0');
    return `${h12}:${m} ${period}`;
  }


  ganttBounds = computed(() => {
    let minH = 24;
    let maxH = 0;
    let hasClasses = false;
    
    const days = this.calendarDays();
    for (const day of days) {
      for (const session of day.sessions) {
        if (session.start && session.end) {
          const sh = parseInt(session.start.split(':')[0], 10);
          const eh = parseInt(session.end.split(':')[0], 10);
          if (!isNaN(sh)) {
            if (sh < minH) minH = sh;
          }
          if (!isNaN(eh)) {
            const em = parseInt(session.end.split(':')[1], 10) || 0;
            const effectiveEh = (em === 0 && eh > 0) ? eh - 1 : eh;
            if (effectiveEh > maxH) maxH = effectiveEh;
          }
          hasClasses = true;
        }
      }
    }
    
    if (!hasClasses) {
      minH = 6; maxH = 21;
    } else {
      minH = Math.max(0, minH - 1);
      maxH = Math.min(23, maxH + 1);
    }
    
    const hours = [];
    for (let i = minH; i <= maxH; i++) {
      hours.push(i);
    }
    
    return {
      minHour: minH,
      maxHour: maxH,
      hours: hours
    };
  });

  getGridColumn(start: string, end: string): string {
    if (!start || !end) return '1 / span 2';
    
    const minH = this.ganttBounds().minHour;
    
    const parseTime = (time: string) => {
      const parts = time.split(':');
      return parseInt(parts[0], 10) * 2 + (parseInt(parts[1], 10) >= 30 ? 1 : 0);
    };

    let startIdx = parseTime(start) - (minH * 2);
    let endIdx = parseTime(end) - (minH * 2);

    if (startIdx < 0) startIdx = 0;
    if (endIdx <= startIdx) {
      if (endIdx === -(minH * 2)) endIdx = (24 - minH) * 2; // Midnight fallback
      else endIdx = startIdx + 2; // Default 1 hour fallback
    }

    const span = Math.max(1, endIdx - startIdx);
    return `${startIdx + 1} / span ${span}`;
  }

  calendarDays = computed(() => {
    const list = this.filteredActividades();
    const instructores = this.formData()?.instructores || [];
    const areas = this.formData()?.areas_mapeadas || [];
    const clubes = this.formData()?.acceso_clubes || [];

    const days = [
      { dia: 1, nombre: 'Lunes', sessions: [] as any[], total: 0 },
      { dia: 2, nombre: 'Martes', sessions: [] as any[], total: 0 },
      { dia: 3, nombre: 'Miércoles', sessions: [] as any[], total: 0 },
      { dia: 4, nombre: 'Jueves', sessions: [] as any[], total: 0 },
      { dia: 5, nombre: 'Viernes', sessions: [] as any[], total: 0 },
      { dia: 6, nombre: 'Sábado', sessions: [] as any[], total: 0 },
      { dia: 7, nombre: 'Domingo', sessions: [] as any[], total: 0 },
    ];

    for (const act of list) {
      if (!act.grupos_categorias) continue;
      
      const clubName = clubes.find(c => c.id === act.club_id)?.name || null;

      for (const gc of act.grupos_categorias) {
        if (!gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (!eq.horarios) continue;
          for (const h of eq.horarios) {
            if (h.is_active === false) continue;
            const day = days.find(d => d.dia === h.dia_semana);
            if (!day) continue;

            const profId = h.profesor_id || eq.coach_id || act.profesor_id;
            const profName = instructores.find(i => i.id === profId)?.full_name || 'Sin asignar';

            let locName = 'Sin ubicación';
            if (h.area_id) {
              locName = areas.find(a => a.area_id === h.area_id)?.area_name || locName;
            } else if (h.lugar) {
              locName = h.lugar;
            } else if (clubName) {
              locName = clubName;
            }

            const areaF = this.filterArea();
            if (areaF && locName !== areaF) continue;

            const pId = this.filterProfesorId();
            if (pId && profId !== pId) continue;

            day.sessions.push({
              id: `${act.id}-${gc.id}-${eq.id}-${h.id}`,
              actId: act.id,
              actNombre: act.nombre,
              actIcono: act.icono || '🏆',
              actColor: eq.color || act.color || '#6366f1',
              grupoNombre: gc.nombre + (eq.nombre !== 'General' ? ` - ${eq.nombre}` : ''),
              start: h.hora_inicio,
              end: h.hora_fin,
              profesor: profName,
              ubicacion: locName,
              actRef: act // para poder abrir offcanvas/editar
            });
            day.total++;
          }
        }
      }
    }

    days.forEach(d => {
      d.sessions.sort((a, b) => {
        const timeDiff = (a.start || '').localeCompare(b.start || '');
        if (timeDiff !== 0) return timeDiff;
        return a.actNombre.localeCompare(b.actNombre);
      });
    });

    return days;
  });

  heatmapMax = computed(() => {
    const hours = this.timeTableHours();
    let max = 0;
    hours.forEach(row => {
      Object.values(row.days).forEach((sessions: any) => {
        if (sessions.length > max) max = sessions.length;
      });
    });
    return max || 1;
  });

  timeTableHours = computed(() => {
    const days = this.calendarDays();
    const bounds = this.ganttBounds();
    const hoursMap = new Map<number, any>();

    // Initialize hours dynamically based on bounds
    for (const i of bounds.hours) {
      hoursMap.set(i, {
        hour: i,
        label: this.formatHora(i),
        days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] } as Record<number, any[]>
      });
    }

    // Assign sessions to the correct hour based on start time
    days.forEach(day => {
      day.sessions.forEach(session => {
        if (!session.start) return;
        const hour = parseInt(session.start.split(':')[0], 10);
        if (hoursMap.has(hour)) {
          hoursMap.get(hour)!.days[day.dia].push(session);
        } else {
          // If a class starts before 6 or after 22, add the row dynamically!
          hoursMap.set(hour, {
            hour,
            label: this.formatHora(hour),
            days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
          });
          hoursMap.get(hour)!.days[day.dia].push(session);
        }
      });
    });

    const sortedHours = Array.from(hoursMap.values()).sort((a, b) => a.hour - b.hour);
    
    // Sort sessions inside each cell by exact minute
    sortedHours.forEach(hRow => {
      for (let i = 1; i <= 7; i++) {
        hRow.days[i].sort((a: any, b: any) => (a.start || '').localeCompare(b.start || ''));
      }
    });

    return sortedHours;
  });

  uniqueAreas = computed(() => {
    const list = this.actividades();
    const areasSet = new Set<string>();
    list.forEach(a => {
      a.grupos_categorias?.forEach(g => {
        g.equipos?.forEach(eq => {
          eq.horarios?.forEach(h => {
            if (h.area_id) {
              const aName = this.formData()?.areas_mapeadas?.find(ma => ma.area_id === h.area_id)?.area_name;
              if (aName) areasSet.add(aName);
            } else if (h.lugar) {
              areasSet.add(h.lugar);
            }
          });
        });
      });
    });
    return Array.from(areasSet).sort();
  });

  filteredActividades = computed(() => {
    let list = this.actividades();
    const qName = this.filterNombre()?.toLowerCase().trim();
    const cId = this.filterClubId();
    const pId = this.filterProfesorId();
    const searchH = this.filterHorario()?.toLowerCase().trim();
    const filterAcceso = this.filterAcceso();
    const areaF = this.filterArea();

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
    
    if (areaF) {
      list = list.filter(a => {
        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            const horarios = eq.horarios || [];
            for (const h of horarios) {
              let locName = h.lugar || '';
              if (h.area_id) {
                const mapA = this.formData()?.areas_mapeadas?.find(ma => ma.area_id === h.area_id);
                if (mapA) locName = mapA.area_name;
              }
              if (locName === areaF) return true;
            }
          }
        }
        return false;
      });
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
    if (!this.canCreate) return;
    this.wizardEditTarget.set(null);
    this.wizardOpen.set(true);
  }

  editActividad(act: Actividad): void {
    if (!this.canUpdate) return;
    this.wizardEditTarget.set(act);
    this.wizardOpen.set(true);
  }

  duplicateActividad(act: Actividad): void {
    if (!this.canDuplicate) return;
    Swal.fire({
      title: '¿Duplicar actividad?',
      text: `¿Estás seguro de duplicar "${act.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, duplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b71ca',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Duplicando...',
          text: 'Por favor espera un momento',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.svc.duplicate(act.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Duplicada!',
              text: 'La actividad ha sido duplicada exitosamente.',
              timer: 2000,
              showConfirmButton: false
            });
            this.showToast('Actividad duplicada exitosamente');
            this.refreshActividades();
          },
          error: (err) => {
            const msg = err?.error?.message || 'Error al duplicar la actividad.';
            this.error.set(msg);
            Swal.fire({
              icon: 'error',
              title: 'Error al duplicar',
              text: msg,
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
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
    if (!this.canUpdate) return;
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
    if (!this.canUpdate) return;
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
    if (!this.canDelete) return;
    this.deleteTarget.set(act);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.hoveredConflictActId()) {
      this.cancelHideConflictTooltip();
      this.hoveredConflictActId.set(null);
      return;
    }
    if (this.isOffcanvasOpen()) {
      this.closeHorariosOffcanvas();
    }
  }

  expandedEquiposSet = signal<Set<number>>(new Set());
  expandedProfGroupsSet = signal<Set<string>>(new Set());

  toggleEquipoAccordion(equipoId: number): void {
    this.expandedEquiposSet.update(prev => {
      const next = new Set(prev);
      if (next.has(equipoId)) {
        next.delete(equipoId);
      } else {
        next.add(equipoId);
      }
      return next;
    });
  }

  isEquipoExpanded(equipoId: number): boolean {
    return this.expandedEquiposSet().has(equipoId);
  }

  getProfGroupKey(equipoId: number, dia: number, profesorId: number): string {
    return `${equipoId}-${dia}-${profesorId}`;
  }

  toggleProfGroupAccordion(equipoId: number, dia: number, profesorId: number): void {
    const key = this.getProfGroupKey(equipoId, dia, profesorId);
    this.expandedProfGroupsSet.update(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  isProfGroupExpanded(equipoId: number, dia: number, profesorId: number): boolean {
    return this.expandedProfGroupsSet().has(this.getProfGroupKey(equipoId, dia, profesorId));
  }

  getEquipoConflictsCount(equipo: any, grupo?: any, act?: Actividad): number {
    if (!equipo?.horarios || equipo.horarios.length === 0) return 0;
    let count = 0;
    for (const h of equipo.horarios) {
      if (h.is_active === false) continue;
      const pId = h.profesor_id || equipo.coach_id || grupo?.instructor_id || act?.profesor_id || 0;
      if (pId > 0) {
        const c = this.checkProfesorScheduleConflict(pId, Number(h.dia_semana), h.hora_inicio, h.hora_fin, h.id);
        if (c) count++;
      }
    }
    return count;
  }

  getProfGroupConflictsCount(profGroup: any, dia: number): number {
    if (!profGroup?.horarios || profGroup.horarios.length === 0 || !profGroup.profesor_id) return 0;
    let count = 0;
    for (const h of profGroup.horarios) {
      if (h.is_active === false) continue;
      const c = this.checkProfesorScheduleConflict(profGroup.profesor_id, dia, h.hora_inicio, h.hora_fin, h.id);
      if (c) count++;
    }
    return count;
  }

  openHorariosOffcanvas(act: Actividad) {
    this.selectedActividadForHorarios.set(act);
    this.isOffcanvasOpen.set(true);

    // Por defecto abrir el primer grupo si solo hay uno, y dejar colapsados cuando hay varios para vista limpia
    const initialExpanded = new Set<number>();
    const initialProfExpanded = new Set<string>();
    const allEquipos: { eq: any; g: any }[] = [];
    for (const g of act.grupos_categorias ?? []) {
      for (const e of g.equipos ?? []) {
        allEquipos.push({ eq: e, g });
      }
    }
    if (allEquipos.length === 1) {
      initialExpanded.add(allEquipos[0].eq.id);
    }
    this.expandedEquiposSet.set(initialExpanded);
    this.expandedProfGroupsSet.set(initialProfExpanded);

    // Reset form
    this.horarioForm = { dia_semana: 1, hora_inicio: '08:00', hora_fin: '09:00', profesor_id: null };
  }

  timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }

  checkProfesorScheduleConflict(
    profesorId: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    excludeHorarioId?: number
  ): string | null {
    if (!profesorId || !diaSemana || !horaInicio || !horaFin) return null;

    const sA = this.timeToMinutes(horaInicio);
    const eA = this.timeToMinutes(horaFin);
    if (eA <= sA) {
      return 'La hora de fin debe ser posterior a la hora de inicio.';
    }

    const profName = this.getInstructorName(profesorId, true);

    for (const act of this.actividades()) {
      if (act.is_active === false || !act.grupos_categorias) continue;
      for (const gc of act.grupos_categorias) {
        if (gc.is_active === false || !gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (eq.is_active === false || !eq.horarios) continue;
          for (const h of eq.horarios) {
            if (h.is_active === false || Number(h.dia_semana) !== Number(diaSemana)) continue;
            if (excludeHorarioId && Number(h.id) === Number(excludeHorarioId)) continue;

            const existingProfId = h.profesor_id || eq.coach_id || (gc as any).instructor_id || act.profesor_id;
            if (!existingProfId || Number(existingProfId) !== Number(profesorId)) continue;

            const sB = this.timeToMinutes(h.hora_inicio);
            const eB = this.timeToMinutes(h.hora_fin);

            if (sA < eB && sB < eA) {
              const hIni = this.formatHora(h.hora_inicio);
              const hFin = this.formatHora(h.hora_fin);
              const diaNombre = this.daysMapping[diaSemana] || 'el día seleccionado';
              const grupo = gc.nombre && gc.nombre !== 'General' ? ` (${gc.nombre})` : '';
              return `El profesor ${profName} ya tiene la actividad "${act.nombre}"${grupo} asignada los ${diaNombre} de ${hIni} a ${hFin}`;
            }
          }
        }
      }
    }

    return null;
  }

  getProfesorScheduleConflictDetail(
    profesorId: number,
    diaSemana: number,
    horaInicio: string,
    horaFin: string,
    excludeHorarioId?: number
  ): { actividad: string; clase: string; rango: string } | null {
    if (!profesorId || !diaSemana || !horaInicio || !horaFin) return null;

    const sA = this.timeToMinutes(horaInicio);
    const eA = this.timeToMinutes(horaFin);
    if (eA <= sA) return null;

    for (const act of this.actividades()) {
      if (act.is_active === false || !act.grupos_categorias) continue;
      for (const gc of act.grupos_categorias) {
        if (gc.is_active === false || !gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (eq.is_active === false || !eq.horarios) continue;
          for (const h of eq.horarios) {
            if (h.is_active === false || Number(h.dia_semana) !== Number(diaSemana)) continue;
            if (excludeHorarioId && Number(h.id) === Number(excludeHorarioId)) continue;

            const existingProfId = h.profesor_id || eq.coach_id || (gc as any).instructor_id || act.profesor_id;
            if (!existingProfId || Number(existingProfId) !== Number(profesorId)) continue;

            const sB = this.timeToMinutes(h.hora_inicio);
            const eB = this.timeToMinutes(h.hora_fin);

            if (sA < eB && sB < eA) {
              const hIni = this.formatHora(h.hora_inicio);
              const hFin = this.formatHora(h.hora_fin);
              const clase = gc.nombre && gc.nombre !== 'General' ? gc.nombre : '';
              return {
                actividad: act.nombre,
                clase,
                rango: `${hIni} – ${hFin}`,
              };
            }
          }
        }
      }
    }

    return null;
  }

  openInlineForm(equipoId: number, dia: number, profesorId: number) {
    if (!this.canManageHorarios) return;
    const key = this.getProfGroupKey(equipoId, dia, profesorId);
    this.expandedProfGroupsSet.update(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    this.inlineFormEquipoId.set(equipoId);
    this.inlineFormDia.set(dia);
    this.inlineFormProfesorId.set(profesorId);
    this.horarioForm.dia_semana = dia;
    this.horarioForm.hora_inicio = '09:00';
    this.horarioForm.hora_fin = '10:00';
  }

  async saveInlineForm() {
    if (!this.canManageHorarios) return;
    const equipoId = this.inlineFormEquipoId();
    const profId = this.inlineFormProfesorId();
    if (!equipoId) return;

    const act = this.selectedActividadForHorarios();
    if (!act) return;

    // Validar hora fin > inicio
    const sA = this.timeToMinutes(this.horarioForm.hora_inicio);
    const eA = this.timeToMinutes(this.horarioForm.hora_fin);
    if (eA <= sA) {
      Swal.fire({
        icon: 'warning',
        title: 'Horario inválido',
        text: 'La hora de fin debe ser posterior a la hora de inicio.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar empalmes del profesor (informativo, no restrictivo)
    let conflictWarning: string | null = null;
    if (profId && profId > 0) {
      conflictWarning = this.checkProfesorScheduleConflict(
        profId,
        Number(this.horarioForm.dia_semana),
        this.horarioForm.hora_inicio,
        this.horarioForm.hora_fin
      );
    }
    
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
      if (conflictWarning) {
        Swal.fire({
          icon: 'info',
          title: 'Aviso de empalme',
          text: `${conflictWarning}. El horario se guardó de todas formas.`,
          confirmButtonText: 'Entendido'
        });
      }
      this.inlineFormEquipoId.set(null);
      this.loadActividades();
    } catch (error: any) {
      const msg = error?.error?.message || error?.message || 'Error al agregar el horario';
      this.error.set(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Horario no disponible',
        text: msg,
        confirmButtonText: 'Entendido'
      });
      setTimeout(() => this.error.set(null), 4000);
    }
  }

  closeHorariosOffcanvas() {
    this.isOffcanvasOpen.set(false);
    setTimeout(() => this.selectedActividadForHorarios.set(null), 300);
  }

  async deleteHorarioRapido(actId: number, equipoId: number, horarioId: number) {
    if (!this.canManageHorarios) return;
    const result = await Swal.fire({
      title: '¿Eliminar horario?',
      text: '¿Estás seguro de que deseas eliminar este horario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });
    if (!result.isConfirmed) return;
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

  getMotivosCancelacionGrouped(): { categoria: string; items: string[] }[] {
    const catalogo = this.formData()?.motivos_cancelacion;
    if (catalogo && catalogo.length > 0) {
      const map = new Map<string, string[]>();
      for (const item of catalogo) {
        const cat = item.categoria || 'General';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(item.nombre);
      }
      return Array.from(map.entries()).map(([categoria, items]) => ({ categoria, items }));
    }
    return [
      {
        categoria: 'Cancelación',
        items: ['Motivos de lluvia', 'Mantenimiento de instalaciones', 'Cancelación'],
      },
      {
        categoria: 'Modificación',
        items: ['Cambio de Ubicación', 'Cambio de Instructor', 'Cambio de Horario'],
      },
    ];
  }

  private getMotivoIcon(nombre: string, categoria: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('lluvia') || n.includes('clima')) return 'bi-cloud-rain-fill';
    if (n.includes('mantenimiento') || n.includes('instalacion')) return 'bi-tools';
    if (n.includes('ubicaci') || n.includes('área') || n.includes('area')) return 'bi-geo-alt-fill';
    if (n.includes('instructor') || n.includes('profesor')) return 'bi-person-badge-fill';
    if (n.includes('horario') || n.includes('hora')) return 'bi-clock-history';
    if (categoria.toLowerCase().includes('modific')) return 'bi-arrow-repeat';
    return 'bi-x-octagon-fill';
  }

  private getModificationType(nombre: string, categoria: string): 'ubicacion' | 'instructor' | 'horario' | null {
    const n = nombre.toLowerCase();
    if (n.includes('ubicaci') || n.includes('área') || n.includes('area') || n.includes('lugar') || n.includes('salón') || n.includes('salon')) {
      return 'ubicacion';
    }
    if (n.includes('instructor') || n.includes('profesor') || n.includes('coach')) {
      return 'instructor';
    }
    if (n.includes('horario') || n.includes('hora') || n.includes('día') || n.includes('dia')) {
      return 'horario';
    }
    return null;
  }

  async promptMotivoCancelacion(currentHorario?: {
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    area_id?: number | null;
    lugar?: string | null;
    profesor_id?: number | null;
    club_id?: number | null;
  }): Promise<{
    motivo: string;
    modType: 'ubicacion' | 'instructor' | 'horario' | null;
    newSchedule?: {
      dia_semana: number;
      hora_inicio: string;
      hora_fin: string;
      area_id: number | null;
      lugar: string | null;
      profesor_id: number | null;
    };
  } | null> {
    const groups = this.getMotivosCancelacionGrouped();
    let selectedValue = '';
    let selectedCategory = '';
    let selectedModType: 'ubicacion' | 'instructor' | 'horario' | null = null;

    const clubId = currentHorario?.club_id ?? this.selectedActividadForHorarios()?.club_id ?? null;
    const allAreas = this.formData()?.areas_mapeadas ?? [];
    const areasClub = clubId ? allAreas.filter(a => Number(a.acceso_club_id) === Number(clubId)) : allAreas;
    const instructores = this.formData()?.instructores ?? [];

    const curDia = Number(currentHorario?.dia_semana || 1);
    const curIni = (currentHorario?.hora_inicio || '08:00').substring(0, 5);
    const curFin = (currentHorario?.hora_fin || '09:00').substring(0, 5);
    const curAreaId = currentHorario?.area_id ? Number(currentHorario.area_id) : 0;
    const curProfId = currentHorario?.profesor_id ? Number(currentHorario.profesor_id) : 0;

    const areasOptionsHtml = areasClub
      .map(a => `<option value="${a.area_id}" ${Number(a.area_id) === curAreaId ? 'selected' : ''}>${a.area_name}</option>`)
      .join('');

    const instructoresOptionsHtml = instructores
      .map(i => `<option value="${i.id}" ${Number(i.id) === curProfId ? 'selected' : ''}>${i.full_name}</option>`)
      .join('');

    const diasOptionsHtml = Object.entries(this.daysMapping)
      .map(([num, label]) => `<option value="${num}" ${Number(num) === curDia ? 'selected' : ''}>${label}</option>`)
      .join('');

    const groupsHtml = groups
      .map(g => {
        const isMod = g.categoria.toLowerCase().includes('modific');
        const badgeColor = isMod ? '#4f46e5' : '#dc2626';
        const badgeBg = isMod ? '#eef2ff' : '#fef2f2';
        const catIcon = isMod ? 'bi-arrow-left-right' : 'bi-slash-circle';

        const optionsHtml = g.items
          .map(item => {
            const icon = this.getMotivoIcon(item, g.categoria);
            const escaped = item.replace(/"/g, '&quot;');
            const escapedCat = g.categoria.replace(/"/g, '&quot;');
            const modType = this.getModificationType(item, g.categoria) || '';
            return `
              <div class="motivo-option-card" data-value="${escaped}" data-category="${escapedCat}" data-modtype="${modType}" style="
                display: flex; align-items: center; gap: 8px;
                padding: 7px 10px; border-radius: 9px;
                border: 1.5px solid #e2e8f0; background: #ffffff;
                cursor: pointer; transition: all 0.14s ease;
                text-align: left; user-select: none;
              ">
                <div class="motivo-option-icon" style="
                  width: 26px; height: 26px; border-radius: 6px;
                  background: #f8fafc; color: #64748b;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 0.85rem; flex-shrink: 0; transition: all 0.14s ease;
                ">
                  <i class="bi ${icon}"></i>
                </div>
                <span class="motivo-option-label" style="
                  font-size: 0.82rem; font-weight: 500; color: #1e293b; flex-grow: 1; line-height: 1.2;
                ">${item}</span>
                <div class="motivo-option-check" style="
                  width: 16px; height: 16px; border-radius: 50%;
                  border: 1.5px solid #cbd5e1; display: flex;
                  align-items: center; justify-content: center;
                  font-size: 0.6rem; color: transparent; flex-shrink: 0; transition: all 0.14s ease;
                ">
                  <i class="bi bi-check-lg"></i>
                </div>
              </div>
            `;
          })
          .join('');

        return `
          <div style="margin-bottom: 8px;">
            <div style="
              display: flex; align-items: center; gap: 5px;
              margin-bottom: 5px;
            ">
              <span style="
                display: inline-flex; align-items: center; gap: 4px;
                font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.5px; padding: 2px 8px; border-radius: 99px;
                color: ${badgeColor}; background: ${badgeBg};
              ">
                <i class="bi ${catIcon}"></i> ${g.categoria}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
              ${optionsHtml}
            </div>
          </div>
        `;
      })
      .join('');

    const { value, isConfirmed } = await Swal.fire({
      width: 540,
      padding: '0.85rem 1rem 0.75rem',
      html: `
        <div style="text-align: left;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="
              width: 36px; height: 36px; border-radius: 9px;
              background: linear-gradient(135deg, #eff6ff, #dbeafe);
              color: #2563eb; display: flex; align-items: center;
              justify-content: center; font-size: 1.1rem; flex-shrink: 0;
            ">
              <i class="bi bi-calendar2-x-fill"></i>
            </div>
            <div>
              <h5 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 1rem;">Inhabilitar horario</h5>
              <p style="margin: 1px 0 0; font-size: 0.76rem; color: #64748b;">Selecciona el motivo de cancelación o modificación</p>
            </div>
          </div>
          <div id="motivos-cards-container" style="max-height: 300px; overflow-y: auto;">
            ${groupsHtml}
          </div>

          <!-- Panel dinámico para Modificación -->
          <div id="mod-fields-wrapper" style="display: none; margin-top: 8px; padding: 10px 12px; border-radius: 10px; background: #f8fafc; border: 1.5px solid #cbd5e1;">
            <!-- Sub-panel: Cambio de Ubicación -->
            <div id="mod-panel-ubicacion" style="display: none;">
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
                <i class="bi bi-geo-alt-fill text-primary me-1"></i>Nueva ubicación para el horario
              </label>
              ${areasClub.length > 0 ? `
                <select id="swal-new-area" class="form-select form-select-sm" style="border-radius: 8px; font-size: 0.82rem; margin-bottom: 6px;">
                  <option value="">Selecciona un área mapeada...</option>
                  ${areasOptionsHtml}
                </select>
              ` : ''}
              <input id="swal-new-lugar" type="text" class="form-control form-control-sm" placeholder="${areasClub.length > 0 ? 'O escribe otra ubicación libre (opcional)...' : 'Escribe la nueva ubicación o salón...'}" value="${(currentHorario?.lugar || '').replace(/"/g, '&quot;')}" style="border-radius: 8px; font-size: 0.82rem;">
            </div>

            <!-- Sub-panel: Cambio de Instructor -->
            <div id="mod-panel-instructor" style="display: none;">
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
                <i class="bi bi-person-badge-fill text-primary me-1"></i>Nuevo instructor asignado
              </label>
              <select id="swal-new-profesor" class="form-select form-select-sm" style="border-radius: 8px; font-size: 0.82rem;">
                <option value="">Selecciona un instructor...</option>
                ${instructoresOptionsHtml}
              </select>
            </div>

            <!-- Sub-panel: Cambio de Horario -->
            <div id="mod-panel-horario" style="display: none;">
              <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
                <i class="bi bi-clock-fill text-primary me-1"></i>Nuevo día y horario
              </label>
              <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; align-items: end;">
                <div>
                  <span style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 2px;">Día</span>
                  <select id="swal-new-dia" class="form-select form-select-sm" style="border-radius: 8px; font-size: 0.8rem;">
                    ${diasOptionsHtml}
                  </select>
                </div>
                <div>
                  <span style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 2px;">Inicio</span>
                  <input id="swal-new-inicio" type="time" class="form-control form-control-sm" value="${curIni}" style="border-radius: 8px; font-size: 0.8rem;">
                </div>
                <div>
                  <span style="font-size: 0.7rem; color: #64748b; display: block; margin-bottom: 2px;">Fin</span>
                  <input id="swal-new-fin" type="time" class="form-control form-control-sm" value="${curFin}" style="border-radius: 8px; font-size: 0.8rem;">
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-slash-circle me-1"></i>Inhabilitar horario',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusConfirm: false,
      didOpen: (popup) => {
        const htmlContainer = popup.querySelector<HTMLElement>('.swal2-html-container');
        if (htmlContainer) {
          htmlContainer.style.margin = '0';
          htmlContainer.style.padding = '0';
        }
        const actionsEl = popup.querySelector<HTMLElement>('.swal2-actions');
        if (actionsEl) {
          actionsEl.style.width = '100%';
          actionsEl.style.display = 'flex';
          actionsEl.style.justifyContent = 'space-between';
          actionsEl.style.margin = '0.35rem 0 0 0';
          actionsEl.style.padding = '0';
        }
        const confirmBtn = popup.querySelector<HTMLElement>('.swal2-confirm');
        const cancelBtn = popup.querySelector<HTMLElement>('.swal2-cancel');
        [confirmBtn, cancelBtn].forEach(btn => {
          if (btn) {
            btn.style.fontSize = '0.75rem';
            btn.style.padding = '0.25rem 0.65rem';
            btn.style.borderRadius = '6px';
            btn.style.margin = '0';
            btn.style.fontWeight = '600';
            btn.style.lineHeight = '1.2';
          }
        });

        const wrapperEl = popup.querySelector<HTMLElement>('#mod-fields-wrapper');
        const pUbicacion = popup.querySelector<HTMLElement>('#mod-panel-ubicacion');
        const pInstructor = popup.querySelector<HTMLElement>('#mod-panel-instructor');
        const pHorario = popup.querySelector<HTMLElement>('#mod-panel-horario');

        const cards = popup.querySelectorAll<HTMLElement>('.motivo-option-card');
        cards.forEach(card => {
          card.addEventListener('mouseenter', () => {
            if (card.getAttribute('data-selected') !== 'true') {
              card.style.borderColor = '#93c5fd';
              card.style.background = '#f8fafc';
            }
          });
          card.addEventListener('mouseleave', () => {
            if (card.getAttribute('data-selected') !== 'true') {
              card.style.borderColor = '#e2e8f0';
              card.style.background = '#ffffff';
            }
          });
          card.addEventListener('click', () => {
            selectedValue = card.getAttribute('data-value') || '';
            selectedCategory = card.getAttribute('data-category') || '';
            const rawMod = card.getAttribute('data-modtype') || '';
            selectedModType = (rawMod === 'ubicacion' || rawMod === 'instructor' || rawMod === 'horario') ? rawMod : null;

            Swal.resetValidationMessage();
            cards.forEach(c => {
              c.setAttribute('data-selected', 'false');
              c.style.borderColor = '#e2e8f0';
              c.style.background = '#ffffff';
              c.style.boxShadow = 'none';
              const iconEl = c.querySelector<HTMLElement>('.motivo-option-icon');
              const checkEl = c.querySelector<HTMLElement>('.motivo-option-check');
              const labelEl = c.querySelector<HTMLElement>('.motivo-option-label');
              if (iconEl) { iconEl.style.background = '#f8fafc'; iconEl.style.color = '#64748b'; }
              if (checkEl) { checkEl.style.background = 'transparent'; checkEl.style.borderColor = '#cbd5e1'; checkEl.style.color = 'transparent'; }
              if (labelEl) { labelEl.style.color = '#1e293b'; labelEl.style.fontWeight = '500'; }
            });

            card.setAttribute('data-selected', 'true');
            card.style.borderColor = '#2563eb';
            card.style.background = '#eff6ff';
            card.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.12)';
            const iconEl = card.querySelector<HTMLElement>('.motivo-option-icon');
            const checkEl = card.querySelector<HTMLElement>('.motivo-option-check');
            const labelEl = card.querySelector<HTMLElement>('.motivo-option-label');
            if (iconEl) { iconEl.style.background = '#2563eb'; iconEl.style.color = '#ffffff'; }
            if (checkEl) { checkEl.style.background = '#2563eb'; checkEl.style.borderColor = '#2563eb'; checkEl.style.color = '#ffffff'; }
            if (labelEl) { labelEl.style.color = '#1e40af'; labelEl.style.fontWeight = '600'; }

            // Mostrar u ocultar campos dinámicos según el tipo de modificación
            if (wrapperEl && pUbicacion && pInstructor && pHorario) {
              pUbicacion.style.display = selectedModType === 'ubicacion' ? 'block' : 'none';
              pInstructor.style.display = selectedModType === 'instructor' ? 'block' : 'none';
              pHorario.style.display = selectedModType === 'horario' ? 'block' : 'none';
              wrapperEl.style.display = selectedModType ? 'block' : 'none';
            }

            if (confirmBtn) {
              confirmBtn.innerHTML = selectedModType
                ? '<i class="bi bi-arrow-repeat me-1"></i>Aplicar cambio'
                : '<i class="bi bi-slash-circle me-1"></i>Inhabilitar horario';
            }
          });
        });
      },
      preConfirm: () => {
        if (!selectedValue) {
          Swal.showValidationMessage('Por favor selecciona un motivo de la lista');
          return false;
        }

        const popup = Swal.getPopup();
        let finalMotivo = selectedValue;
        const newSchedule = {
          dia_semana: curDia,
          hora_inicio: curIni,
          hora_fin: curFin,
          area_id: currentHorario?.area_id ?? null,
          lugar: currentHorario?.lugar ?? null,
          profesor_id: currentHorario?.profesor_id ?? null,
        };

        if (selectedModType === 'ubicacion' && popup) {
          const areaSelect = popup.querySelector<HTMLSelectElement>('#swal-new-area');
          const lugarInput = popup.querySelector<HTMLInputElement>('#swal-new-lugar');
          const newAreaId = areaSelect?.value ? Number(areaSelect.value) : null;
          const newLugar = lugarInput?.value?.trim() || null;

          if (!newAreaId && !newLugar) {
            Swal.showValidationMessage('Selecciona o escribe la nueva ubicación');
            return false;
          }

          newSchedule.area_id = newAreaId;
          newSchedule.lugar = newLugar;

          const areaName = newAreaId
            ? allAreas.find(a => Number(a.area_id) === newAreaId)?.area_name
            : null;
          const descUbicacion = [areaName, newLugar].filter(Boolean).join(' - ');
          finalMotivo = `${selectedValue} (${descUbicacion})`;
        } else if (selectedModType === 'instructor' && popup) {
          const profSelect = popup.querySelector<HTMLSelectElement>('#swal-new-profesor');
          const newProfId = profSelect?.value ? Number(profSelect.value) : null;

          if (!newProfId) {
            Swal.showValidationMessage('Selecciona el nuevo instructor');
            return false;
          }
          if (curProfId && newProfId === curProfId) {
            Swal.showValidationMessage('Selecciona un instructor distinto al actual');
            return false;
          }

          newSchedule.profesor_id = newProfId;
          const profName = instructores.find(i => Number(i.id) === newProfId)?.full_name || `#${newProfId}`;
          finalMotivo = `${selectedValue} (${profName})`;
        } else if (selectedModType === 'horario' && popup) {
          const diaSelect = popup.querySelector<HTMLSelectElement>('#swal-new-dia');
          const iniInput = popup.querySelector<HTMLInputElement>('#swal-new-inicio');
          const finInput = popup.querySelector<HTMLInputElement>('#swal-new-fin');

          const newDia = diaSelect?.value ? Number(diaSelect.value) : curDia;
          const newIni = iniInput?.value || '';
          const newFin = finInput?.value || '';

          if (!newIni || !newFin) {
            Swal.showValidationMessage('Ingresa la hora de inicio y fin del nuevo horario');
            return false;
          }
          if (this.timeToMinutes(newFin) <= this.timeToMinutes(newIni)) {
            Swal.showValidationMessage('La hora de fin debe ser posterior a la de inicio');
            return false;
          }
          if (newDia === curDia && newIni === curIni && newFin === curFin) {
            Swal.showValidationMessage('El nuevo horario debe ser distinto al horario actual');
            return false;
          }

          newSchedule.dia_semana = newDia;
          newSchedule.hora_inicio = newIni;
          newSchedule.hora_fin = newFin;
          const diaLabel = this.daysMapping[newDia] || '';
          finalMotivo = `${selectedValue} (${diaLabel} ${this.formatHora(newIni)} - ${this.formatHora(newFin)})`;
        }

        return {
          motivo: finalMotivo,
          modType: selectedModType,
          newSchedule: selectedModType ? newSchedule : undefined,
        };
      }
    });

    return isConfirmed && value ? value : null;
  }

  async toggleHorarioRapido(actId: number, equipoId: number, h: any, profesorId?: number, event?: Event) {
    if (!this.canManageHorarios) {
      const cb = event?.target as HTMLInputElement | null;
      if (cb) cb.checked = h.is_active !== false;
      return;
    }
    const newVal = h.is_active === false ? true : false;
    const pId = h.profesor_id || profesorId || 0;
    const checkbox = event?.target as HTMLInputElement | null;

    // Si se va a reactivar, verificar empalme de forma informativa (sin bloquear)
    let conflictWarning: string | null = null;
    if (newVal && pId > 0) {
      conflictWarning = this.checkProfesorScheduleConflict(
        pId,
        Number(h.dia_semana),
        h.hora_inicio,
        h.hora_fin,
        h.id
      );
    }

    let motivoCancelacion: string | null = null;
    let newScheduleData: {
      dia_semana: number;
      hora_inicio: string;
      hora_fin: string;
      area_id: number | null;
      lugar: string | null;
      profesor_id: number | null;
    } | undefined;

    // Si se va a inhabilitar, pedir el motivo de cancelación o modificación
    if (!newVal) {
      const promptResult = await this.promptMotivoCancelacion({
        dia_semana: Number(h.dia_semana),
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        area_id: h.area_id ?? null,
        lugar: h.lugar ?? null,
        profesor_id: pId || null,
        club_id: this.selectedActividadForHorarios()?.club_id ?? null,
      });
      if (!promptResult) {
        if (checkbox) checkbox.checked = true;
        return;
      }
      motivoCancelacion = promptResult.motivo;
      newScheduleData = promptResult.newSchedule;
      if (newScheduleData && newScheduleData.profesor_id && Number(newScheduleData.profesor_id) > 0) {
        conflictWarning = this.checkProfesorScheduleConflict(
          Number(newScheduleData.profesor_id),
          Number(newScheduleData.dia_semana),
          newScheduleData.hora_inicio,
          newScheduleData.hora_fin
        );
      }
    }

    try {
      await firstValueFrom(this.svc.updateHorario(equipoId, h.id, {
        is_active: newVal,
        motivo_cancelacion: motivoCancelacion
      }));

      let createdHorario: any = null;
      if (!newVal && newScheduleData) {
        const resNew = await firstValueFrom(this.svc.createHorario(equipoId, {
          dia_semana: Number(newScheduleData.dia_semana),
          hora_inicio: newScheduleData.hora_inicio.length === 5 ? newScheduleData.hora_inicio + ':00' : newScheduleData.hora_inicio,
          hora_fin: newScheduleData.hora_fin.length === 5 ? newScheduleData.hora_fin + ':00' : newScheduleData.hora_fin,
          area_id: newScheduleData.area_id ?? undefined,
          lugar: newScheduleData.lugar ?? undefined,
          profesor_id: newScheduleData.profesor_id ?? undefined,
          is_active: true,
        }));
        createdHorario = resNew.data;
      }

      this.showToast(
        newVal
          ? 'Horario habilitado'
          : createdHorario
            ? 'Cambio aplicado y nuevo horario creado'
            : 'Horario inhabilitado'
      );

      if (conflictWarning) {
        Swal.fire({
          icon: 'info',
          title: 'Aviso de empalme',
          text: `${conflictWarning}. El cambio se guardó de todas formas.`,
          confirmButtonText: 'Entendido'
        });
      }

      this.selectedActividadForHorarios.update(act => {
        if (!act) return null;
        for (const g of act.grupos_categorias ?? []) {
          for (const e of g.equipos ?? []) {
            if (e.id === equipoId && e.horarios) {
              e.horarios = e.horarios.map(item =>
                item.id === h.id ? { ...item, is_active: newVal, motivo_cancelacion: motivoCancelacion } : item
              );
              if (createdHorario) {
                e.horarios = [...e.horarios, createdHorario];
              }
            }
          }
        }
        return { ...act };
      });

      this.actividades.update(list =>
        list.map(a => {
          if (a.id !== actId) return a;
          return {
            ...a,
            grupos_categorias: (a.grupos_categorias ?? []).map(g => ({
              ...g,
              equipos: (g.equipos ?? []).map(e => {
                if (e.id !== equipoId) return e;
                const updatedHorarios = (e.horarios ?? []).map(item =>
                  item.id === h.id ? { ...item, is_active: newVal, motivo_cancelacion: motivoCancelacion } : item
                );
                if (createdHorario) {
                  updatedHorarios.push(createdHorario);
                }
                return {
                  ...e,
                  horarios: updatedHorarios,
                };
              }),
            })),
          };
        })
      );
    } catch (err: any) {
      if (checkbox) checkbox.checked = !newVal;
      const msg = err?.error?.message || 'Error al cambiar estado del horario.';
      Swal.fire({
        icon: 'warning',
        title: 'No se pudo actualizar',
        text: msg,
        confirmButtonText: 'Entendido'
      });
    }
  }

  async addHorarioRapido(equipoId: number) {
    if (!this.canManageHorarios) return;
    const act = this.selectedActividadForHorarios();
    if (!act) return;

    // Validar hora fin > inicio
    const sA = this.timeToMinutes(this.horarioForm.hora_inicio);
    const eA = this.timeToMinutes(this.horarioForm.hora_fin);
    if (eA <= sA) {
      Swal.fire({
        icon: 'warning',
        title: 'Horario inválido',
        text: 'La hora de fin debe ser posterior a la hora de inicio.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar empalmes del profesor (informativo, no restrictivo)
    const profId = this.horarioForm.profesor_id || act.profesor_id;
    let conflictWarning: string | null = null;
    if (profId && profId > 0) {
      conflictWarning = this.checkProfesorScheduleConflict(
        profId,
        Number(this.horarioForm.dia_semana),
        this.horarioForm.hora_inicio,
        this.horarioForm.hora_fin
      );
    }
    
    try {
      const res = await firstValueFrom(this.svc.createHorario(equipoId, {
        dia_semana: Number(this.horarioForm.dia_semana),
        hora_inicio: this.horarioForm.hora_inicio + ':00',
        hora_fin: this.horarioForm.hora_fin + ':00',
        profesor_id: this.horarioForm.profesor_id || undefined,
        is_active: true
      }));
      
      this.showToast('Horario agregado.');
      if (conflictWarning) {
        Swal.fire({
          icon: 'info',
          title: 'Aviso de empalme',
          text: `${conflictWarning}. El horario se guardó de todas formas.`,
          confirmButtonText: 'Entendido'
        });
      }
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
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Error al agregar horario';
      Swal.fire({
        icon: 'warning',
        title: 'Horario no disponible',
        text: msg,
        confirmButtonText: 'Entendido'
      });
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
        
        const minHora = p_hrs[0].hora_inicio ? this.formatHora(p_hrs[0].hora_inicio) : '';
        const maxHora = p_hrs[p_hrs.length - 1].hora_fin ? this.formatHora(p_hrs[p_hrs.length - 1].hora_fin) : '';
        const rango_horas = `${minHora} - ${maxHora}`;
        const firstPositiveCosto = p_hrs.find(x => x.costo_interno !== null && x.costo_interno !== undefined && Number(x.costo_interno) > 0);
        const firstWithCosto = firstPositiveCosto ?? p_hrs.find(x => x.costo_interno !== null && x.costo_interno !== undefined);
        const costo_interno = firstWithCosto ? Number(firstWithCosto.costo_interno) : null;
        
        return {
          profesor_id: pId,
          profesor_nombre: pId ? this.getInstructorName(pId, true) : 'Sin asignar',
          rango_horas: rango_horas,
          costo_interno: costo_interno,
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

  getEquipoProfesoresCosto(equipo: any): Array<{
    profesor_id: number;
    profesor_nombre: string;
    costo_interno: number | null;
  }> {
    const horarios = equipo?.horarios || [];
    if (!horarios.length) return [];

    const map = new Map<number, {
      profesor_id: number;
      profesor_nombre: string;
      costo_interno: number | null;
    }>();

    for (const h of horarios) {
      const pId = Number(h.profesor_id || equipo?.coach_id || 0);
      const hCosto = h.costo_interno !== null && h.costo_interno !== undefined ? Number(h.costo_interno) : null;
      if (!map.has(pId)) {
        map.set(pId, {
          profesor_id: pId,
          profesor_nombre: pId ? this.getInstructorName(pId, true) : 'Sin asignar',
          costo_interno: hCosto,
        });
      } else {
        const current = map.get(pId)!.costo_interno;
        if ((current === null || current === 0) && hCosto !== null && hCosto > 0) {
          map.get(pId)!.costo_interno = hCosto;
        } else if (current === null && hCosto !== null) {
          map.get(pId)!.costo_interno = hCosto;
        }
      }
    }

    // Si en esta clase el profesor tiene costo 0 o null, pero en otra clase de la misma actividad ya tiene un costo > 0 asignado, mostrarlo homologado
    const act = this.selectedActividadForHorarios();
    if (act?.grupos_categorias) {
      for (const entry of map.values()) {
        if (entry.profesor_id > 0 && (entry.costo_interno === null || entry.costo_interno === 0)) {
          for (const g of act.grupos_categorias) {
            for (const e of g.equipos ?? []) {
              for (const h of e.horarios ?? []) {
                const hProfId = Number(h.profesor_id || e?.coach_id || 0);
                const hCosto = h.costo_interno !== null && h.costo_interno !== undefined ? Number(h.costo_interno) : null;
                if (hProfId === entry.profesor_id && hCosto !== null && hCosto > 0) {
                  entry.costo_interno = hCosto;
                  break;
                }
              }
              if (entry.costo_interno && entry.costo_interno > 0) break;
            }
            if (entry.costo_interno && entry.costo_interno > 0) break;
          }
        }
      }
    }

    return Array.from(map.values());
  }

  async promptCostoProfesor(actId: number, equipo: any, profGroup: any): Promise<void> {
    if (!this.canManageCostos) return;
    const profId = Number(profGroup.profesor_id || 0);
    const profName = profGroup.profesor_nombre || 'Sin asignar';
    const currentCosto = profGroup.costo_interno !== null && profGroup.costo_interno !== undefined
      ? Number(profGroup.costo_interno)
      : null;

    // Recolectar todos los horarios de este profesor en todas las clases de la actividad
    const act = this.selectedActividadForHorarios();
    const horariosTarget: Array<{ equipoId: number; horarioId: number }> = [];

    if (act?.grupos_categorias && profId > 0) {
      for (const g of act.grupos_categorias) {
        for (const e of g.equipos ?? []) {
          for (const h of e.horarios ?? []) {
            const hProfId = Number(h.profesor_id || e?.coach_id || 0);
            if (hProfId === profId) {
              horariosTarget.push({ equipoId: e.id, horarioId: h.id });
            }
          }
        }
      }
    } else {
      for (const h of equipo?.horarios || []) {
        if (Number(h.profesor_id || equipo?.coach_id || 0) === profId) {
          horariosTarget.push({ equipoId: equipo.id, horarioId: h.id });
        }
      }
    }

    const { isConfirmed, value } = await Swal.fire({
      title: '',
      width: 440,
      padding: '0.85rem 1rem 0.7rem',
      html: `
        <div style="text-align: left;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
              <i class="bi bi-cash-coin"></i>
            </div>
            <div style="overflow: hidden;">
              <h5 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 1rem;">Costo por clase del profesor</h5>
              <p style="margin: 1px 0 0; font-size: 0.76rem; color: #64748b; text-transform: capitalize; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${profName.toLowerCase()}
              </p>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;">
            <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
              Monto a pagar por clase (nómina)
            </label>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white text-muted border-end-0 fw-semibold"
                    style="border-top-left-radius: 20px !important; border-bottom-left-radius: 20px !important; border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important; padding-left: 0.75rem; padding-right: 0.35rem;">$</span>
              <input id="swal-costo-prof" type="number" min="0" step="0.01"
                     class="form-control form-control-sm bg-white border-start-0 ps-1 fw-semibold"
                     style="border-top-left-radius: 0 !important; border-bottom-left-radius: 0 !important; border-top-right-radius: 20px !important; border-bottom-right-radius: 20px !important; font-size: 0.85rem; box-shadow: none;"
                     placeholder="0.00"
                     value="${currentCosto !== null ? currentCosto : ''}">
            </div>
            <small style="display: block; margin-top: 6px; font-size: 0.7rem; color: #64748b;">
              Se aplicará a los <strong>${horariosTarget.length}</strong> horario(s) de este profesor en esta actividad.
            </small>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check2 me-1"></i>Guardar costo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusConfirm: false,
      didOpen: (popup) => {
        const htmlContainer = popup.querySelector<HTMLElement>('.swal2-html-container');
        if (htmlContainer) {
          htmlContainer.style.margin = '0';
          htmlContainer.style.padding = '0';
        }
        const actionsEl = popup.querySelector<HTMLElement>('.swal2-actions');
        if (actionsEl) {
          actionsEl.style.width = '100%';
          actionsEl.style.display = 'flex';
          actionsEl.style.justifyContent = 'space-between';
          actionsEl.style.margin = '0.5rem 0 0 0';
          actionsEl.style.padding = '0';
        }
        const confirmBtn = popup.querySelector<HTMLElement>('.swal2-confirm');
        const cancelBtn = popup.querySelector<HTMLElement>('.swal2-cancel');
        [confirmBtn, cancelBtn].forEach(btn => {
          if (btn) {
            btn.style.fontSize = '0.75rem';
            btn.style.padding = '0.25rem 0.65rem';
            btn.style.borderRadius = '6px';
            btn.style.margin = '0';
            btn.style.fontWeight = '600';
            btn.style.lineHeight = '1.2';
          }
        });
        const inputEl = popup.querySelector<HTMLInputElement>('#swal-costo-prof');
        if (inputEl) {
          setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
        }
      },
      preConfirm: () => {
        const inputEl = Swal.getPopup()?.querySelector<HTMLInputElement>('#swal-costo-prof');
        const raw = inputEl?.value?.trim() ?? '';
        if (raw === '') return null;
        const num = Number(raw);
        if (isNaN(num) || num < 0) {
          Swal.showValidationMessage('Ingresa un monto válido mayor o igual a 0');
          return false;
        }
        return num;
      }
    });

    if (!isConfirmed) return;
    const newCosto: number | null = value === null || value === undefined ? null : Number(value);

    try {
      await Promise.all(
        horariosTarget.map(t =>
          firstValueFrom(this.svc.updateHorario(t.equipoId, t.horarioId, { costo_interno: newCosto }))
        )
      );

      this.showToast('Costo por clase actualizado');

      const targetHorarioIds = new Set(horariosTarget.map(t => t.horarioId));

      this.selectedActividadForHorarios.update(curAct => {
        if (!curAct) return null;
        for (const g of curAct.grupos_categorias ?? []) {
          for (const e of g.equipos ?? []) {
            if (e.horarios) {
              e.horarios = e.horarios.map(item =>
                targetHorarioIds.has(item.id) ? { ...item, costo_interno: newCosto } : item
              );
            }
          }
        }
        return { ...curAct };
      });

      this.actividades.update(list =>
        list.map(a => {
          if (a.id !== actId) return a;
          return {
            ...a,
            grupos_categorias: (a.grupos_categorias ?? []).map(g => ({
              ...g,
              equipos: (g.equipos ?? []).map(e => ({
                ...e,
                horarios: (e.horarios ?? []).map(item =>
                  targetHorarioIds.has(item.id) ? { ...item, costo_interno: newCosto } : item
                ),
              })),
            })),
          };
        })
      );
    } catch (err: any) {
      const msg = err?.error?.message || 'No se pudo actualizar el costo por clase.';
      Swal.fire({
        icon: 'warning',
        title: 'Error al guardar',
        text: msg,
        confirmButtonText: 'Entendido'
      });
    }
  }

  daysMapping: Record<number, string> = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
  };

  // ── Semanas Tipo Inline en Offcanvas (Sin modales extra) ────────────────────
  semanaTipoPanelEquipoId = signal<number | null>(null);
  guardandoSemanaEquipoId = signal<number | null>(null);
  nuevaSemanaOffcanvasNombre = '';
  nuevaSemanaOffcanvasTemporada: 'otono' | 'verano' | 'invierno' | 'primavera' | 'general' = 'otono';

  toggleSemanaTipoPanelOffcanvas(equipoId: number): void {
    this.semanaTipoPanelEquipoId.update(cur => (cur === equipoId ? null : equipoId));
    this.guardandoSemanaEquipoId.set(null);
  }

  getSemanasTipoCatalog() {
    return this.svc.getSemanasTipoList(this.formData()?.semanas_tipo);
  }

  getShortSemanaLabel(nombre: string): string {
    return nombre
      .replace(/^Semana\s+/i, '')
      .replace(/\s*\/.*?\(/, ' (')
      .replace(/\s+Vespertino\)/i, ')')
      .replace(/\s+Matutino\)/i, ')')
      .replace(/\s+Compacto\)/i, ')')
      .replace(/\s+Tarde Extendida\)/i, ')');
  }

  getTemporadaEmoji(temporada: string): string {
    switch ((temporada || '').toLowerCase()) {
      case 'otono': return '🍂';
      case 'verano': return '☀️';
      case 'invierno': return '❄️';
      case 'primavera': return '🌸';
      default: return '📅';
    }
  }

  async aplicarSemanaTipoInlineOffcanvas(act: Actividad, equipo: any, st: any): Promise<void> {
    const existingHorarios: any[] = equipo.horarios || [];
    const defaultProfId =
      existingHorarios.find(h => h.profesor_id)?.profesor_id ||
      equipo.coach_id ||
      act.profesor_id ||
      null;
    const defaultCosto =
      existingHorarios.find(h => h.costo_interno !== null && h.costo_interno !== undefined && Number(h.costo_interno) > 0)?.costo_interno ??
      existingHorarios.find(h => h.costo_interno !== null && h.costo_interno !== undefined)?.costo_interno ??
      null;

    try {
      const creados: any[] = [];
      for (const dia of (st.dias || [])) {
        for (const f of (st.franjas || [])) {
          const hIni = (f.hora_inicio || '16:00').substring(0, 5);
          const hFin = (f.hora_fin || '17:00').substring(0, 5);
          const yaExiste = existingHorarios.some(
            h =>
              Number(h.dia_semana) === Number(dia) &&
              (h.hora_inicio || '').substring(0, 5) === hIni &&
              (h.hora_fin || '').substring(0, 5) === hFin
          );
          if (yaExiste) continue;

          const res = await firstValueFrom(
            this.svc.createHorario(equipo.id, {
              dia_semana: Number(dia),
              hora_inicio: hIni + ':00',
              hora_fin: hFin + ':00',
              profesor_id: defaultProfId ? Number(defaultProfId) : undefined,
              costo_interno: defaultCosto !== null ? Number(defaultCosto) : undefined,
              is_active: true,
            })
          );
          if (res?.data) {
            creados.push(res.data);
          }
        }
      }

      const nuevosHorarios = [...existingHorarios, ...creados];
      this.selectedActividadForHorarios.update(curAct => {
        if (!curAct) return null;
        for (const g of curAct.grupos_categorias ?? []) {
          for (const eq of g.equipos ?? []) {
            if (eq.id === equipo.id) {
              eq.horarios = nuevosHorarios;
            }
          }
        }
        return { ...curAct };
      });

      this.actividades.update(list =>
        list.map(a => {
          if (a.id !== act.id) return a;
          return {
            ...a,
            grupos_categorias: (a.grupos_categorias ?? []).map(g => ({
              ...g,
              equipos: (g.equipos ?? []).map(eq =>
                eq.id === equipo.id ? { ...eq, horarios: nuevosHorarios } : eq
              ),
            })),
          };
        })
      );

      this.semanaTipoPanelEquipoId.set(null);
      this.showToast(`Semana Tipo aplicada (${creados.length} horario(s) agregado(s))`);
    } catch (err: any) {
      this.showToast(err?.error?.message || 'Algunos horarios ya existían o tienen empalme');
      this.loadActividades();
    }
  }

  abrirGuardarSemanaOffcanvasInline(grupo: any, equipo: any): void {
    this.nuevaSemanaOffcanvasNombre = grupo?.nombre || '';
    this.nuevaSemanaOffcanvasTemporada = 'general';
    this.guardandoSemanaEquipoId.set(equipo.id);
  }

  async confirmarGuardarSemanaOffcanvasInline(equipo: any): Promise<void> {
    const horarios = (equipo?.horarios || []).filter((h: any) => h.is_active !== false);
    const nom = this.nuevaSemanaOffcanvasNombre.trim();
    if (!horarios.length || !nom) return;

    const dias = Array.from(new Set<number>(horarios.map((h: any) => Number(h.dia_semana)))).sort((a, b) => a - b);
    const fMap = new Map<string, { hora_inicio: string; hora_fin: string }>();
    for (const h of horarios) {
      const hi = (h.hora_inicio || '16:00').substring(0, 5);
      const hf = (h.hora_fin || '17:00').substring(0, 5);
      fMap.set(`${hi}-${hf}`, { hora_inicio: hi, hora_fin: hf });
    }
    const franjas = Array.from(fMap.values()).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const updated = await this.svc.persistSemanaTipo(
      {
        nombre: nom,
        temporada: this.nuevaSemanaOffcanvasTemporada,
        dias,
        franjas,
      },
      null,
      this.formData()?.semanas_tipo
    );
    this.formData.update(fd => fd ? { ...fd, semanas_tipo: updated } : fd);
    this.guardandoSemanaEquipoId.set(null);
    this.nuevaSemanaOffcanvasNombre = '';
    this.showToast('Semana Tipo guardada en el catálogo');
  }

  async eliminarSemanaTipoOffcanvasInline(stOrId: number | { id: number }, event: Event): Promise<void> {
    event.stopPropagation();
    const id = typeof stOrId === 'number' ? stOrId : stOrId.id;
    const updated = await this.svc.removeSemanaTipo(id, this.formData()?.semanas_tipo);
    this.formData.update(fd => fd ? { ...fd, semanas_tipo: updated } : fd);
  }

  // ── VISTA DE HOJA DE CÁLCULO (MANTENIMIENTO RÁPIDO) Y EXCEL ─────────────────

  spreadsheetEdits = signal<Record<number, {
    dia_semana?: number;
    hora_inicio?: string;
    hora_fin?: string;
    profesor_id?: number | null;
    costo_interno?: number | null;
    area_id?: number | null;
    lugar?: string | null;
    is_active?: boolean;
    motivo_cancelacion?: string | null;
    grupo_activo?: boolean;
    actividad_activa?: boolean;
    actividad_nombre?: string;
  }>>({});

  spreadsheetSelectedIds       = signal<Set<number>>(new Set());
  savingBulk                   = signal(false);
  exportingExcel               = signal(false);
  importingExcel               = signal(false);
  filterEstadoClase            = signal<'todos' | 'activos' | 'inactivos' | 'modificados' | 'empalmes'>('todos');
  spreadsheetFilterActividadId = signal<number | null>(null);
  spreadsheetPage              = signal<number>(1);
  spreadsheetPageSize          = signal<number>(40);
  hoveredSpreadsheetRowId      = signal<number | null>(null);
  spreadsheetSortColumn        = signal<'actividad' | 'clase' | 'grupo_activo' | 'dia' | 'inicio' | 'fin' | 'profesor' | 'costo' | 'area' | 'horario_activo' | null>(null);
  spreadsheetSortDirection     = signal<'asc' | 'desc'>('asc');

  // Acciones en lote sobre filas seleccionadas
  batchActividadNombre: string = '';
  batchProfesorId: number | null = null;
  batchCostoInterno: number | null = null;
  batchAreaId: number | null = null;
  batchEstadoHorario: boolean | null = null;

  uniqueAreasMapeadas = computed(() => {
    const areas = this.formData()?.areas_mapeadas || [];
    const seen = new Set<number>();
    const list: Array<{ area_id: number; area_name: string }> = [];
    for (const a of areas) {
      const id = Number(a.area_id);
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({ area_id: id, area_name: a.area_name });
      }
    }
    return list;
  });

  allSpreadsheetRows = computed(() => {
    const allActs = this.actividades();
    const edits = this.spreadsheetEdits();
    const instructores = this.formData()?.instructores || [];
    const areas = this.formData()?.areas_mapeadas || [];
    const clubes = this.formData()?.acceso_clubes || [];

    const normStr = (s: string) =>
      (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Pre-indexar catálogos en O(1) para evitar miles de .find() y .filter()
    const clubMap = new Map<number, string>();
    for (const c of clubes) clubMap.set(Number(c.id), c.name);

    const instMap = new Map<number, string>();
    for (const i of instructores) instMap.set(Number(i.id), i.full_name);

    const areaMap = new Map<number, string>();
    const areasByClubMap = new Map<number, Array<{ area_id: number; area_name: string }>>();
    const areaIdByClubAndName = new Map<string, number>();
    const areaIdByNameGlobal = new Map<string, number>();
    const allUniqueAreas: Array<{ area_id: number; area_name: string }> = [];

    for (const a of areas) {
      const aId = Number(a.area_id);
      const aName = a.area_name || '';
      const normName = normStr(aName);

      if (!areaMap.has(aId)) {
        areaMap.set(aId, aName);
        allUniqueAreas.push({ area_id: aId, area_name: aName });
        if (normName) areaIdByNameGlobal.set(normName, aId);
      }

      const cId = Number(a.acceso_club_id || 0);
      if (!areasByClubMap.has(cId)) areasByClubMap.set(cId, []);
      const clubArr = areasByClubMap.get(cId)!;
      if (!clubArr.some(x => x.area_id === aId)) {
        clubArr.push({ area_id: aId, area_name: aName });
      }
      if (cId && normName) {
        areaIdByClubAndName.set(`${cId}_${normName}`, aId);
      }
    }

    type SpreadsheetRow = {
      horario_id: number;
      equipo_id: number;
      grupo_id: number;
      actividad_id: number;
      club_id: number;
      sede_nombre: string;
      actividad_nombre: string;
      actividad_icono: string;
      actividad_color: string;
      actividad_activa: boolean;
      grupo_nombre: string;
      equipo_nombre: string;
      clase_label: string;
      grupo_activo: boolean;
      dia_semana: number;
      hora_inicio: string;
      hora_fin: string;
      profesor_id: number | null;
      profesor_nombre: string;
      costo_interno: number | null;
      area_id: number | null;
      area_nombre: string;
      lugar: string;
      is_active: boolean;
      motivo_cancelacion: string;
      is_dirty: boolean;
      schedule_or_prof_changed: boolean;
      conflict_msg: string | null;
      areas_disponibles: Array<{ area_id: number; area_name: string }>;
    };

    const rows: SpreadsheetRow[] = [];
    // Buckets por (profesor_id + dia_semana) para detectar empalmes en O(N) en vez de O(N^2)
    const profDayBuckets = new Map<string, SpreadsheetRow[]>();

    for (const act of allActs) {
      const clubIdNum = Number(act.club_id || 0);
      const sedeNombre = clubMap.get(clubIdNum) || 'General';
      const areasClub = (clubIdNum && areasByClubMap.get(clubIdNum)?.length)
        ? areasByClubMap.get(clubIdNum)!
        : allUniqueAreas;

      for (const gc of act.grupos_categorias ?? []) {
        for (const eq of gc.equipos ?? []) {
          const claseLabel = gc.nombre + (eq.nombre && eq.nombre !== 'General' ? ` · ${eq.nombre}` : '');

          for (const h of eq.horarios ?? []) {
            const edit = edits[h.id] || {};

            const origDia = Number(h.dia_semana || 1);
            const origIni = (h.hora_inicio || '08:00').substring(0, 5);
            const origFin = (h.hora_fin || '09:00').substring(0, 5);
            const origProf = h.profesor_id ?? eq.coach_id ?? act.profesor_id ?? null;
            const origCosto = h.costo_interno !== null && h.costo_interno !== undefined ? Number(h.costo_interno) : null;
            const origLugar = h.lugar || '';
            const normLug = origLugar ? normStr(origLugar) : '';
            const origArea = h.area_id
              ? Number(h.area_id)
              : (normLug ? (areaIdByClubAndName.get(`${clubIdNum}_${normLug}`) ?? areaIdByNameGlobal.get(normLug) ?? null) : null);
            const origActive = h.is_active !== false;
            const origMotivo = h.motivo_cancelacion || '';
            const origGrpActivo = gc.is_active !== false;
            const origActActiva = act.is_active !== false;
            const origActNombre = (act.nombre || '').trim();

            const curDia = edit.dia_semana !== undefined ? Number(edit.dia_semana) : origDia;
            const curIni = edit.hora_inicio !== undefined ? edit.hora_inicio : origIni;
            const curFin = edit.hora_fin !== undefined ? edit.hora_fin : origFin;
            const curProf = edit.profesor_id !== undefined ? edit.profesor_id : origProf;
            const curCosto = edit.costo_interno !== undefined ? edit.costo_interno : origCosto;
            const curArea = edit.area_id !== undefined ? edit.area_id : origArea;
            const curLugar = edit.lugar !== undefined ? (edit.lugar || '') : origLugar;
            const curActive = edit.is_active !== undefined ? edit.is_active : origActive;
            const curMotivo = edit.motivo_cancelacion !== undefined ? (edit.motivo_cancelacion || '') : origMotivo;
            const curGrpActivo = edit.grupo_activo !== undefined ? edit.grupo_activo : origGrpActivo;
            const curActActiva = edit.actividad_activa !== undefined ? edit.actividad_activa : origActActiva;
            const curActNombre = edit.actividad_nombre !== undefined && edit.actividad_nombre.trim() !== ''
              ? edit.actividad_nombre.trim()
              : origActNombre;

            const scheduleOrProfChanged =
              curDia !== origDia ||
              curIni !== origIni ||
              curFin !== origFin ||
              Number(curProf || 0) !== Number(origProf || 0) ||
              (!origActive && curActive);

            const isDirty =
              scheduleOrProfChanged ||
              (curCosto ?? null) !== (origCosto ?? null) ||
              Number(curArea || 0) !== Number(origArea || 0) ||
              curLugar !== origLugar ||
              curActive !== origActive ||
              curMotivo !== origMotivo ||
              curGrpActivo !== origGrpActivo ||
              curActActiva !== origActActiva ||
              curActNombre !== origActNombre;

            const profNum = curProf ? Number(curProf) : null;
            const areaNum = curArea ? Number(curArea) : null;

            const sMin = this.timeToMinutes(curIni);
            const eMin = this.timeToMinutes(curFin);
            const invalidTimeMsg = eMin <= sMin
              ? `Horario inválido: La hora de fin (${this.formatHora(curFin)}) debe ser posterior a la hora de inicio (${this.formatHora(curIni)}).`
              : null;

            const rowObj: SpreadsheetRow = {
              horario_id: h.id,
              equipo_id: eq.id,
              grupo_id: gc.id,
              actividad_id: act.id,
              club_id: act.club_id,
              sede_nombre: sedeNombre,
              actividad_nombre: curActNombre,
              actividad_icono: act.icono || '🏆',
              actividad_color: eq.color || act.color || '#6366f1',
              actividad_activa: curActActiva,
              grupo_nombre: gc.nombre,
              equipo_nombre: eq.nombre,
              clase_label: claseLabel,
              grupo_activo: curGrpActivo,
              dia_semana: curDia,
              hora_inicio: curIni,
              hora_fin: curFin,
              profesor_id: profNum,
              profesor_nombre: profNum ? (instMap.get(profNum) || 'Sin asignar') : 'Sin asignar',
              costo_interno: curCosto,
              area_id: areaNum,
              area_nombre: areaNum ? (areaMap.get(areaNum) || '') : '',
              lugar: curLugar,
              is_active: curActive,
              motivo_cancelacion: curMotivo,
              is_dirty: isDirty,
              schedule_or_prof_changed: scheduleOrProfChanged,
              conflict_msg: invalidTimeMsg,
              areas_disponibles: areasClub,
            };

            rows.push(rowObj);

            if (!invalidTimeMsg && curActive && curGrpActivo && curActActiva && profNum) {
              const bucketKey = `${profNum}_${curDia}`;
              let bucket = profDayBuckets.get(bucketKey);
              if (!bucket) {
                bucket = [];
                profDayBuckets.set(bucketKey, bucket);
              }
              bucket.push(rowObj);
            }
          }
        }
      }
    }

    // Evaluar empalmes únicamente entre horarios activos del mismo profesor en el mismo día (O(N))
    for (const bucket of profDayBuckets.values()) {
      if (bucket.length < 2) continue;
      for (let i = 0; i < bucket.length; i++) {
        const a = bucket[i];
        const sA = this.timeToMinutes(a.hora_inicio);
        const eA = this.timeToMinutes(a.hora_fin);
        for (let j = i + 1; j < bucket.length; j++) {
          const b = bucket[j];
          const sB = this.timeToMinutes(b.hora_inicio);
          const eB = this.timeToMinutes(b.hora_fin);
          if (sA < eB && sB < eA) {
            const diaLabel = this.daysMapping[a.dia_semana] || 'ese día';
            if (!a.conflict_msg) {
              a.conflict_msg = `El profesor ${a.profesor_nombre} ya tiene "${b.actividad_nombre} (${b.grupo_nombre})" el ${diaLabel} de ${this.formatHora(b.hora_inicio)} a ${this.formatHora(b.hora_fin)}`;
            }
            if (!b.conflict_msg) {
              b.conflict_msg = `El profesor ${b.profesor_nombre} ya tiene "${a.actividad_nombre} (${a.grupo_nombre})" el ${diaLabel} de ${this.formatHora(a.hora_inicio)} a ${this.formatHora(a.hora_fin)}`;
            }
          }
        }
      }
    }

    return rows;
  });

  spreadsheetRows = computed(() => {
    const allowedActIds = new Set(this.filteredActividades().map(a => a.id));
    const specificActId = this.spreadsheetFilterActividadId();
    const filterEst = this.filterEstadoClase();
    const filterProf = this.filterProfesorId();
    const filterAreaName = this.filterArea();
    const searchH = this.filterHorario()?.toLowerCase().trim();
    const sortCol = this.spreadsheetSortColumn();
    const sortDir = this.spreadsheetSortDirection();

    const filtered = this.allSpreadsheetRows().filter(row => {
      if (!allowedActIds.has(row.actividad_id)) return false;
      if (specificActId && row.actividad_id !== Number(specificActId)) return false;
      if (filterProf && Number(row.profesor_id) !== Number(filterProf)) return false;
      if (filterAreaName) {
        const resolvedArea = row.area_nombre || row.lugar;
        if (resolvedArea !== filterAreaName) return false;
      }
      if (searchH) {
        const dName = (this.daysMapping[row.dia_semana] || '').toLowerCase();
        if (!dName.includes(searchH) && !row.hora_inicio.includes(searchH) && !row.hora_fin.includes(searchH)) {
          return false;
        }
      }
      if (!row.is_dirty) {
        if (filterEst === 'activos' && (!row.is_active || !row.grupo_activo || !row.actividad_activa)) return false;
        if (filterEst === 'inactivos' && (row.is_active && row.grupo_activo && row.actividad_activa)) return false;
        if (filterEst === 'empalmes' && !row.conflict_msg) return false;
      }
      if (filterEst === 'modificados' && !row.is_dirty) return false;

      return true;
    });

    if (!sortCol) return filtered;

    const factor = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'actividad':
          cmp = (a.actividad_nombre || '').localeCompare(b.actividad_nombre || '', 'es', { sensitivity: 'base' });
          break;
        case 'clase':
          cmp = (a.clase_label || '').localeCompare(b.clase_label || '', 'es', { sensitivity: 'base' });
          break;
        case 'grupo_activo':
          cmp = Number(a.grupo_activo) - Number(b.grupo_activo);
          break;
        case 'dia':
          cmp = a.dia_semana - b.dia_semana || (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
          break;
        case 'inicio':
          cmp = (a.hora_inicio || '').localeCompare(b.hora_inicio || '') || a.dia_semana - b.dia_semana;
          break;
        case 'fin':
          cmp = (a.hora_fin || '').localeCompare(b.hora_fin || '') || a.dia_semana - b.dia_semana;
          break;
        case 'profesor':
          cmp = (a.profesor_nombre || '').localeCompare(b.profesor_nombre || '', 'es', { sensitivity: 'base' });
          break;
        case 'costo':
          cmp = Number(a.costo_interno ?? -1) - Number(b.costo_interno ?? -1);
          break;
        case 'area':
          cmp = (a.area_nombre || '').localeCompare(b.area_nombre || '', 'es', { sensitivity: 'base' });
          break;
        case 'horario_activo':
          cmp = Number(a.is_active) - Number(b.is_active);
          break;
      }
      return cmp * factor;
    });
  });

  toggleSpreadsheetSort(col: 'actividad' | 'clase' | 'grupo_activo' | 'dia' | 'inicio' | 'fin' | 'profesor' | 'costo' | 'area' | 'horario_activo'): void {
    if (this.spreadsheetSortColumn() === col) {
      if (this.spreadsheetSortDirection() === 'asc') {
        this.spreadsheetSortDirection.set('desc');
      } else {
        this.spreadsheetSortColumn.set(null);
        this.spreadsheetSortDirection.set('asc');
      }
    } else {
      this.spreadsheetSortColumn.set(col);
      this.spreadsheetSortDirection.set('asc');
    }
    this.spreadsheetPage.set(1);
  }

  spreadsheetTotalPages = computed(() => {
    const total = this.spreadsheetRows().length;
    const size = this.spreadsheetPageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  spreadsheetCurrentPage = computed(() => {
    const p = this.spreadsheetPage();
    const maxP = this.spreadsheetTotalPages();
    return Math.min(Math.max(1, p), maxP);
  });

  spreadsheetPagedRows = computed(() => {
    const rows = this.spreadsheetRows();
    const size = this.spreadsheetPageSize();
    const page = this.spreadsheetCurrentPage();
    const start = (page - 1) * size;
    return rows.slice(start, start + size);
  });

  spreadsheetDirtyCount = computed(() => {
    const edits = this.spreadsheetEdits();
    if (Object.keys(edits).length === 0) return 0;
    return this.allSpreadsheetRows().filter(r => r.is_dirty).length;
  });

  setSpreadsheetPage(page: number): void {
    const max = this.spreadsheetTotalPages();
    this.spreadsheetPage.set(Math.min(Math.max(1, page), max));
  }

  onSpreadsheetPageSizeChange(size: any): void {
    this.spreadsheetPageSize.set(Number(size) || 40);
    this.spreadsheetPage.set(1);
  }

  onSpreadsheetActividadFilterChange(actId: any): void {
    const val = actId === '' || actId === null || actId === undefined || Number(actId) === 0 ? null : Number(actId);
    this.spreadsheetFilterActividadId.set(val);
    this.spreadsheetPage.set(1);
  }

  updateSpreadsheetCell(
    row: any,
    field: 'dia_semana' | 'hora_inicio' | 'hora_fin' | 'profesor_id' | 'costo_interno' | 'area_id' | 'lugar' | 'is_active' | 'motivo_cancelacion' | 'grupo_activo' | 'actividad_activa',
    value: any
  ): void {
    this.spreadsheetEdits.update(prev => {
      const next = { ...prev };
      const curRowEdit = { ...(next[row.horario_id] || {}) };

      if (field === 'costo_interno') {
        curRowEdit.costo_interno = value === '' || value === null || value === undefined ? null : Number(value);
      } else if (field === 'profesor_id' || field === 'area_id') {
        curRowEdit[field] = value === '' || value === null || value === undefined || Number(value) === 0 ? null : Number(value);
      } else if (field === 'dia_semana') {
        curRowEdit.dia_semana = Number(value);
      } else {
        (curRowEdit as any)[field] = value;
      }

      next[row.horario_id] = curRowEdit;

      // Si cambió grupo_activo o actividad_activa, propagar visualmente a los demás horarios del mismo grupo/actividad
      if (field === 'grupo_activo') {
        for (const r of this.allSpreadsheetRows()) {
          if (r.grupo_id === row.grupo_id) {
            next[r.horario_id] = { ...(next[r.horario_id] || {}), grupo_activo: Boolean(value) };
          }
        }
      } else if (field === 'actividad_activa') {
        for (const r of this.allSpreadsheetRows()) {
          if (r.actividad_id === row.actividad_id) {
            next[r.horario_id] = { ...(next[r.horario_id] || {}), actividad_activa: Boolean(value) };
          }
        }
      }

      return next;
    });

    // Validar inmediatamente empalmes o rango de horas inválido al modificar horario, profesor o reactivar
    if (['dia_semana', 'hora_inicio', 'hora_fin', 'profesor_id', 'is_active', 'grupo_activo', 'actividad_activa'].includes(field)) {
      const updatedRow = this.allSpreadsheetRows().find(r => r.horario_id === row.horario_id);
      if (updatedRow?.conflict_msg) {
        const isInvalidTime = updatedRow.conflict_msg.startsWith('Horario inválido');
        Swal.fire({
          icon: 'warning',
          title: isInvalidTime ? 'Horario inválido' : 'Horario con empalme detectado',
          text: updatedRow.conflict_msg,
          confirmButtonText: 'Entendido',
        });
      }
    }
  }

  homologarCostoProfesorEnActividad(row: any): void {
    if (!row.profesor_id) return;
    const targetProfId = Number(row.profesor_id);
    const targetActId = Number(row.actividad_id);
    const targetCosto = row.costo_interno;

    let count = 0;
    this.spreadsheetEdits.update(prev => {
      const next = { ...prev };
      for (const r of this.allSpreadsheetRows()) {
        if (r.actividad_id === targetActId && Number(r.profesor_id) === targetProfId) {
          next[r.horario_id] = { ...(next[r.horario_id] || {}), costo_interno: targetCosto };
          count++;
        }
      }
      return next;
    });
    this.showToast(`Costo aplicado a los ${count} horarios del profesor en "${row.actividad_nombre}"`);
  }

  toggleSelectRow(horarioId: number): void {
    this.spreadsheetSelectedIds.update(prev => {
      const next = new Set(prev);
      if (next.has(horarioId)) next.delete(horarioId);
      else next.add(horarioId);
      return next;
    });
  }

  toggleSelectAllRows(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!checked) {
      this.spreadsheetSelectedIds.set(new Set());
      return;
    }
    const allIds = new Set(this.spreadsheetRows().map(r => r.horario_id));
    this.spreadsheetSelectedIds.set(allIds);
  }

  isAllRowsSelected = computed(() => {
    const rows = this.spreadsheetRows();
    const sel = this.spreadsheetSelectedIds();
    return rows.length > 0 && rows.every(r => sel.has(r.horario_id));
  });

  clearSpreadsheetSelection(): void {
    this.spreadsheetSelectedIds.set(new Set());
  }

  private applyPendingBatchInputsToSelection(): boolean {
    const sel = this.spreadsheetSelectedIds();
    if (sel.size === 0) return false;

    const newActNombre = (this.batchActividadNombre || '').trim();
    const hasAnyBatchVal =
      newActNombre !== '' ||
      this.batchProfesorId !== null ||
      (this.batchCostoInterno !== null && (this.batchCostoInterno as any) !== '') ||
      this.batchAreaId !== null ||
      this.batchEstadoHorario !== null;

    if (!hasAnyBatchVal) return false;

    const affectedActIds = new Set<number>();
    if (newActNombre !== '') {
      for (const r of this.allSpreadsheetRows()) {
        if (sel.has(r.horario_id)) {
          affectedActIds.add(r.actividad_id);
        }
      }
    }

    this.spreadsheetEdits.update(prev => {
      const next = { ...prev };
      sel.forEach(hId => {
        const cur = { ...(next[hId] || {}) };
        if (newActNombre !== '') {
          cur.actividad_nombre = newActNombre;
        }
        if (this.batchProfesorId !== null) {
          cur.profesor_id = this.batchProfesorId === 0 ? null : Number(this.batchProfesorId);
        }
        if (this.batchCostoInterno !== null && (this.batchCostoInterno as any) !== '') {
          cur.costo_interno = Number(this.batchCostoInterno);
        }
        if (this.batchAreaId !== null) {
          cur.area_id = this.batchAreaId === 0 ? null : Number(this.batchAreaId);
        }
        if (this.batchEstadoHorario !== null) {
          cur.is_active = Boolean(this.batchEstadoHorario);
        }
        next[hId] = cur;
      });

      // Si se cambió el nombre de la actividad, reflejarlo en todos los horarios de esa(s) actividad(es)
      if (newActNombre !== '' && affectedActIds.size > 0) {
        for (const r of this.allSpreadsheetRows()) {
          if (affectedActIds.has(r.actividad_id)) {
            next[r.horario_id] = { ...(next[r.horario_id] || {}), actividad_nombre: newActNombre };
          }
        }
      }

      return next;
    });

    this.batchActividadNombre = '';
    this.batchProfesorId = null;
    this.batchCostoInterno = null;
    this.batchAreaId = null;
    this.batchEstadoHorario = null;
    return true;
  }

  async applyBatchChangesToSelected(): Promise<void> {
    const sel = this.spreadsheetSelectedIds();
    if (sel.size === 0) return;

    const applied = this.applyPendingBatchInputsToSelection();
    if (!applied && this.spreadsheetDirtyCount() === 0) {
      this.showToast('Selecciona o escribe al menos un cambio en la barra de lote.');
      return;
    }

    await this.saveSpreadsheetChanges();
  }

  discardSpreadsheetChanges(): void {
    this.spreadsheetEdits.set({});
    this.spreadsheetSelectedIds.set(new Set());
    this.batchActividadNombre = '';
    this.batchProfesorId = null;
    this.batchCostoInterno = null;
    this.batchAreaId = null;
    this.batchEstadoHorario = null;
    this.showToast('Cambios descartados');
  }

  async saveSpreadsheetChanges(): Promise<void> {
    if (!this.canBulkEdit) return;
    // Si el usuario escribió algo en la barra de lote y dio clic directo en "Guardar cambios", aplicarlo también
    this.applyPendingBatchInputsToSelection();

    const dirtyRows = this.allSpreadsheetRows().filter(r => r.is_dirty);
    if (dirtyRows.length === 0) {
      this.showToast('No hay cambios pendientes por guardar.');
      return;
    }

    // Bloquear guardado únicamente si existe un rango de horas inválido (hora_fin <= hora_inicio). Los empalmes son solo informativos.
    const invalidTimeRows = dirtyRows.filter(
      r => r.schedule_or_prof_changed && Boolean(r.conflict_msg?.startsWith('Horario inválido'))
    );
    if (invalidTimeRows.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Horario inválido detectado',
        html: `
          <p class="small text-muted mb-2">No es posible guardar mientras existan rangos de hora inválidos en los horarios modificados:</p>
          <div class="text-start small bg-danger-subtle text-danger p-2 rounded-3 border border-danger-subtle" style="max-height: 220px; overflow-y: auto;">
            ${invalidTimeRows.map(c => `<div class="mb-1">• <strong>${c.actividad_nombre} (${c.grupo_nombre})</strong>: ${c.conflict_msg}</div>`).join('')}
          </div>
        `,
        confirmButtonText: 'Entendido',
      });
      return;
    }

    this.savingBulk.set(true);
    try {
      const payloadItems = dirtyRows.map(r => ({
        horario_id: r.horario_id,
        equipo_id: r.equipo_id,
        grupo_id: r.grupo_id,
        actividad_id: r.actividad_id,
        actividad_nombre: r.actividad_nombre,
        actividad_activa: r.actividad_activa,
        grupo_activo: r.grupo_activo,
        dia_semana: r.dia_semana,
        hora_inicio: r.hora_inicio,
        hora_fin: r.hora_fin,
        profesor_id: r.profesor_id,
        costo_interno: r.costo_interno,
        area_id: r.area_id,
        lugar: r.area_nombre || null,
        is_active: r.is_active,
        motivo_cancelacion: r.motivo_cancelacion,
      }));

      const res = await firstValueFrom(this.svc.bulkUpdate(payloadItems));
      this.spreadsheetEdits.set({});
      this.spreadsheetSelectedIds.set(new Set());
      this.batchActividadNombre = '';
      this.batchProfesorId = null;
      this.batchCostoInterno = null;
      this.batchAreaId = null;
      this.batchEstadoHorario = null;
      this.refreshActividades();

      if (res.data?.warnings && res.data.warnings.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Guardado con observaciones',
          html: `<div class="text-start small">${res.data.warnings.map(w => `• ${w}`).join('<br>')}</div>`,
          confirmButtonText: 'Entendido',
        });
      } else {
        this.showToast(res.message || `Se actualizaron ${dirtyRows.length} horario(s) exitosamente.`);
      }
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al guardar los cambios masivos.';
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: msg,
        confirmButtonText: 'Entendido',
      });
    } finally {
      this.savingBulk.set(false);
    }
  }

  downloadExcelTemplate(): void {
    if (!this.canExportExcel) return;
    this.exportingExcel.set(true);
    this.svc.exportExcel({
      club_id: this.filterClubId(),
      profesor_id: this.filterProfesorId(),
      q: this.filterNombre()?.trim() || undefined,
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.download = `MANTENIMIENTO_ACTIVIDADES_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.exportingExcel.set(false);
        this.showToast('Plantilla Excel descargada correctamente');
      },
      error: async (err) => {
        this.exportingExcel.set(false);
        let detail = 'No se pudo generar el archivo Excel.';
        try {
          if (err?.error instanceof Blob) {
            const txt = await err.error.text();
            const parsed = JSON.parse(txt);
            if (parsed?.message) detail = parsed.message;
          } else if (err?.error?.message) {
            detail = err.error.message;
          }
        } catch {}
        Swal.fire({
          icon: 'error',
          title: 'Error al exportar',
          text: detail,
          confirmButtonText: 'Entendido',
        });
      }
    });
  }

  async onExcelFileSelected(event: Event): Promise<void> {
    if (!this.canImportExcel) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const confirm = await Swal.fire({
      title: '¿Importar cambios desde Excel?',
      html: `Se procesará el archivo <strong>${file.name}</strong> para actualizar horarios, costos por profesor, profesores asignados, ubicaciones y estados.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cloud-upload me-1"></i>Sí, importar y actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754',
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    this.importingExcel.set(true);
    try {
      const res = await firstValueFrom(this.svc.importExcel(file));
      this.spreadsheetEdits.set({});
      this.refreshActividades();

      const updated = res.data?.updated ?? 0;
      const warnings = res.data?.warnings ?? [];

      if (warnings.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: `Importación completada (${updated} actualizados)`,
          html: `<div class="text-start small" style="max-height: 220px; overflow-y: auto;">${warnings.map(w => `• ${w}`).join('<br>')}</div>`,
          confirmButtonText: 'Entendido',
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Excel importado!',
          text: res.message || `Se actualizaron ${updated} registro(s) correctamente.`,
          timer: 2400,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al importar el archivo Excel.';
      Swal.fire({
        icon: 'error',
        title: 'Error en la importación',
        text: msg,
        confirmButtonText: 'Entendido',
      });
    } finally {
      this.importingExcel.set(false);
    }
  }
}
