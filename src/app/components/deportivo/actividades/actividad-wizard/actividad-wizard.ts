import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit, DoCheck,
  signal,
  inject,
  computed,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import Swal from 'sweetalert2';
import { ActividadService } from '../../../../services/deportivo/actividad.service';
import { AuthService } from '../../../../services/auth.service';
import {
  Actividad,
  ActividadFormData,
  AreaMapeada,
  WizardGrupo,
  WizardCriterio,
} from '../../../../models/deportivo/actividad.model';

// ── Constantes ──────────────────────────────────────────────────────────────────
const DIAS: { num: number; label: string }[] = [
  { num: 1, label: 'Lu' },
  { num: 2, label: 'Ma' },
  { num: 3, label: 'Mi' },
  { num: 4, label: 'Ju' },
  { num: 5, label: 'Vi' },
  { num: 6, label: 'Sá' },
  { num: 7, label: 'Do' },
];

const EMOJIS = [
  '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸',
  '🥊','🏊','🤸','🧘','🏋️','🚴','⛷️','🏄','🎯','🎭',
  '🎨','🎵','🎸','🎹','🎺','💃','🥋','🏹','🎿','🥅',
];

const COLORES = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4',
  '#64748b','#1f2937',
];

const TIPOS = ['deporte_equipo','deporte_individual','arte','otro'];

// ── Interfaces locales ──────────────────────────────────────────────────────────
interface Step { id: number; label: string; icon: string; }

const STEPS: Step[] = [
  { id: 1, label: 'General',     icon: 'bi-info-circle' },
  { id: 2, label: 'Operación',   icon: 'bi-gear' },
  { id: 3, label: 'Clases',      icon: 'bi-people' },
  { id: 4, label: 'Horarios',    icon: 'bi-clock' },
  { id: 5, label: 'Evaluación',  icon: 'bi-star' },
  { id: 6, label: 'Resumen',     icon: 'bi-check-circle' },
];

@Component({
  selector: 'app-actividad-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './actividad-wizard.html',
  styleUrl: './actividad-wizard.scss',
})
export class ActividadWizardComponent implements OnInit, DoCheck {
  @Input() editActividad: Actividad | null = null;
  @Input() allActividades: Actividad[] = [];
  @Output() saved     = new EventEmitter<string>();
  @Output() silentlySaved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private svc  = inject(ActividadService);
  private auth = inject(AuthService);

  // ── Constantes expuestas a template ─────────────────────────────────────────
  readonly steps   = STEPS;
  readonly emojis  = EMOJIS;
  readonly colores = COLORES;
  readonly tipos   = TIPOS;
  readonly dias    = DIAS;

  // ── Estado del wizard ───────────────────────────────────────────────────────
  currentStep  = signal(1);
  saving       = signal(false);
  error        = signal<string | null>(null);
  formData     = signal<ActividadFormData | null>(null);
  /** Datos completos cargados desde la API al abrir en modo edición */
  originalActividad = signal<Actividad | null>(null);
  loadingDetail     = signal(false);

  // ── Paso 1: Identidad ───────────────────────────────────────────────────────
  club_id: number | null = null;
  nombre          = '';
  descripcion     = '';
  icono           = '⚽';
  color           = '#6366f1';
  tipo            = 'deporte_equipo';
  modo_mensajeria: 'bidireccional' | 'solo_respuesta' | 'solo_lectura' = 'bidireccional';
  tiene_costo     = false;
  elegible_para_socios = true;
  fecha_inicio    = '';
  fecha_fin       = '';
  monto: number | null = null;
  costo_interno: number | null = null;
  profesor_id: number | null = null;

  // ── Paso 2: Grupos ──────────────────────────────────────────────────────────
  grupos = signal<WizardGrupo[]>([]);
  nuevoGrupoNombre   = '';
  activeGrupoIndex   = signal(0);

  // ── Paso 3: Horarios — se editan por grupo ──────────────────────────────────
  // horarios están dentro de cada grupo.horarios

  // Estado del panel de réplica de horarios
  replicandoDia    = signal<{ grupoIdx: number; dia: number } | null>(null);
  diasParaReplicar = signal<number[]>([]);

  // ── Paso 4: Criterios ───────────────────────────────────────────────────────
  criterios        = signal<WizardCriterio[]>([]);
  nuevoCriterioNombre = '';

  // ── Computed ────────────────────────────────────────────────────────────────
  progressPct = computed(() => ((this.currentStep() - 1) / (STEPS.length - 1)) * 100);
  isEditing   = computed(() => this.editActividad !== null);


  // ── Detección de cambios sin guardar ────────────────────────────────────────
  savedStateHash = '';
  hasUnsavedChanges = signal(false);

  getHash(): string {
    return JSON.stringify({
      club_id: this.club_id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      icono: this.icono,
      color: this.color,
      tipo: this.tipo,
      modo_mensajeria: this.modo_mensajeria,
      tiene_costo: this.tiene_costo,
      elegible_para_socios: this.elegible_para_socios,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      monto: this.monto,
      grupos: this.grupos(),
      criterios: this.criterios()
    });
  }

  ngDoCheck(): void {
    if (this.isEditing() && this.savedStateHash) {
      const currentHash = this.getHash();
      this.hasUnsavedChanges.set(currentHash !== this.savedStateHash);
    }
  }


  revertChanges(): void {
    if (this.originalActividad()) {
      this.patchFromEdit(this.originalActividad()!);
      this.hasUnsavedChanges.set(false);
      this.savedStateHash = this.getHash();
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────


  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadingDetail.set(true);

    const formData$ = this.svc.getFormData();
    const detail$   = this.editActividad
      ? this.svc.getById(this.editActividad.id)
      : of(null);

    forkJoin([formData$, detail$]).subscribe({
      next: ([fdRes, detailRes]) => {
        this.formData.set(fdRes.data);
        if (detailRes) {
          this.originalActividad.set(detailRes.data);
          this.patchFromEdit(detailRes.data);
          // Wait a tick for signals to propagate before hashing
          setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        } else {
          setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        }
        this.loadingDetail.set(false);
      },
      error: () => {
        // Fallback parcial: al menos intentar parchear con datos básicos
        if (this.editActividad) this.patchFromEdit(this.editActividad);
        this.loadingDetail.set(false);
      },
    });
  }

  private patchFromEdit(act: Actividad): void {
    this.club_id         = act.club_id;
    this.nombre          = act.nombre;
    this.descripcion     = act.descripcion ?? '';
    this.icono           = act.icono ?? '⚽';
    this.color           = act.color ?? '#6366f1';
    this.tipo            = act.tipo ?? 'deporte_equipo';
    this.modo_mensajeria = act.modo_mensajeria ?? 'bidireccional';
    this.tiene_costo     = act.tiene_costo ?? false;
    this.fecha_inicio    = act.fecha_inicio ?? '';
    this.fecha_fin       = act.fecha_fin    ?? '';
    this.monto           = act.monto        ?? null;

    const grupos: WizardGrupo[] = (act.grupos_categorias ?? []).map(g => ({
      nombre:        g.nombre,
      descripcion:   g.descripcion ?? '',
      edad_min:      g.edad_min ?? null,
      edad_max:      g.edad_max ?? null,
      tiene_cupo:    g.tiene_cupo ?? false,
      cupo_maximo:   g.cupo_maximo ?? null,
      instructor_id: g.equipos?.[0]?.coach_id ?? null,
      costo_interno: act.costo_interno ?? g.equipos?.[0]?.horarios?.[0]?.costo_interno ?? null,
      equipos: [],  // no se muestran en el wizard; se reconstruyen al guardar
      // Los horarios se toman del primer equipo
      horarios: (g.equipos?.[0]?.horarios ?? []).map(h => ({
        dia_semana:  h.dia_semana,
        hora_inicio: (h.hora_inicio ?? '08:00:00').substring(0, 5),
        hora_fin:    (h.hora_fin ?? '09:00:00').substring(0, 5),
        lugar:       h.lugar ?? null,
        area_id:     h.area_id ?? null,
        profesor_id: h.profesor_id ?? g.equipos?.[0]?.coach_id ?? null,
        costo_interno: h.costo_interno ?? null,
        is_active:   h.is_active !== false,
        motivo_cancelacion: h.motivo_cancelacion ?? null,
      })),
    }));
    this.grupos.set(grupos);

    const criterios: WizardCriterio[] = (act.criterios_evaluacion ?? []).map(c => ({
      nombre:      c.nombre,
      descripcion: c.descripcion ?? '',
      escala_min:  c.escala_min ?? 1,
      escala_max:  c.escala_max ?? 5,
    }));
    this.criterios.set(criterios);
  }

  // ── Navegación ───────────────────────────────────────────────────────────────
  goTo(step: number): void {
    if (step < 1 || step > STEPS.length) return;
    if (step > this.currentStep() && !this.validateCurrentStep()) return;
    if (step > 4) {
      const conflict = this.findAnyHorarioConflict();
      if (conflict) {
        this.error.set(conflict);
        Swal.fire({
          icon: 'warning',
          title: 'Conflicto de horario',
          text: conflict,
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }
    this.currentStep.set(step);
    this.error.set(null);
  }

  next(): void  { this.goTo(this.currentStep() + 1); }
  prev(): void  { this.goTo(this.currentStep() - 1); }

  timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }

  formatHora(hora: string | number): string {
    if (hora === null || hora === undefined || hora === '') return '';
    let h = 0;
    let m = '00';
    if (typeof hora === 'number') {
      h = hora;
    } else {
      const parts = String(hora).split(':');
      h = parseInt(parts[0], 10);
      m = (parts[1] || '00').substring(0, 2);
    }
    if (isNaN(h)) return String(hora);
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    const hPad = h12 < 10 ? `0${h12}` : `${h12}`;
    return `${hPad}:${m} ${period}`;
  }

  getHorarioConflict(grupoIdx: number, horarioIdx: number): string | null {
    const g = this.grupos()[grupoIdx];
    if (!g) return null;
    const h = g.horarios[horarioIdx];
    if (!h || h.is_active === false || !h.hora_inicio || !h.hora_fin) return null;

    const sA = this.timeToMinutes(h.hora_inicio);
    const eA = this.timeToMinutes(h.hora_fin);
    if (eA <= sA) {
      return 'La hora de fin debe ser posterior a la de inicio.';
    }

    const profId = h.profesor_id || g.instructor_id || this.profesor_id || null;
    if (!profId) return null;

    const profName = this.getInstructorName(Number(profId));
    const diaNombre = this.getDiaNombre(Number(h.dia_semana));

    // 1. Validar contra otros horarios dentro del mismo wizard
    for (let gi = 0; gi < this.grupos().length; gi++) {
      const otherG = this.grupos()[gi];
      for (let hi = 0; hi < otherG.horarios.length; hi++) {
        if (gi === grupoIdx && hi === horarioIdx) continue;
        const otherH = otherG.horarios[hi];
        if (otherH.is_active === false || Number(otherH.dia_semana) !== Number(h.dia_semana)) continue;

        const otherProfId = otherH.profesor_id || otherG.instructor_id || this.profesor_id || null;
        if (!otherProfId || Number(otherProfId) !== Number(profId)) continue;

        const sB = this.timeToMinutes(otherH.hora_inicio);
        const eB = this.timeToMinutes(otherH.hora_fin);

        if (sA < eB && sB < eA) {
          const targetGrp = otherG.nombre ? `la clase "${otherG.nombre}"` : 'otro horario';
          return `Empalme: ${profName} ya tiene horario en ${targetGrp} (${diaNombre} ${this.formatHora(otherH.hora_inicio)} - ${this.formatHora(otherH.hora_fin)}).`;
        }
      }
    }

    // 2. Validar contra otras actividades existentes
    if (this.allActividades && this.allActividades.length > 0) {
      for (const act of this.allActividades) {
        if (this.isEditing() && Number(act.id) === Number(this.editActividad?.id)) continue;
        if (act.is_active === false || !act.grupos_categorias) continue;

        for (const gc of act.grupos_categorias) {
          if (gc.is_active === false || !gc.equipos) continue;
          for (const eq of gc.equipos) {
            if (eq.is_active === false || !eq.horarios) continue;
            for (const extH of eq.horarios) {
              if (extH.is_active === false || Number(extH.dia_semana) !== Number(h.dia_semana)) continue;

              const extProfId = extH.profesor_id || eq.coach_id || null;
              if (!extProfId || Number(extProfId) !== Number(profId)) continue;

              const sB = this.timeToMinutes(extH.hora_inicio);
              const eB = this.timeToMinutes(extH.hora_fin);

              if (sA < eB && sB < eA) {
                const hIni = this.formatHora(extH.hora_inicio);
                const hFin = this.formatHora(extH.hora_fin);
                const grp = gc.nombre && gc.nombre !== 'General' ? ` (${gc.nombre})` : '';
                return `Empalme: ${profName} ya tiene la clase "${act.nombre}"${grp} los ${diaNombre} de ${hIni} a ${hFin}.`;
              }
            }
          }
        }
      }
    }

    return null;
  }

  findAnyHorarioConflict(): string | null {
    for (let gi = 0; gi < this.grupos().length; gi++) {
      const g = this.grupos()[gi];
      for (let hi = 0; hi < g.horarios.length; hi++) {
        const conflict = this.getHorarioConflict(gi, hi);
        if (conflict) return conflict;
      }
    }
    return null;
  }

  private validateCurrentStep(): boolean {
    if (this.currentStep() === 1) {
      if (!this.club_id) {
        this.error.set('Debes seleccionar un club o sede.');
        return false;
      }
      if (!this.nombre.trim()) {
        this.error.set('El nombre de la actividad es obligatorio.');
        return false;
      }
      if (!this.fecha_inicio) {
        this.error.set('La fecha de inicio de la actividad es obligatoria.');
        return false;
      }
      if (this.fecha_fin && this.fecha_fin < this.fecha_inicio) {
        this.error.set('La fecha fin no puede ser anterior a la fecha inicio.');
        return false;
      }
      if (this.tiene_costo && !this.monto) {
        this.error.set('Debes ingresar el monto a cobrar.');
        return false;
      }
    }

    if (this.currentStep() === 3) {
      if (this.grupos().some(g => !g.nombre || !g.nombre.trim())) {
        this.error.set('Todas las clases deben tener un nombre.');
        return false;
      }
    }

    if (this.currentStep() === 4) {
      const conflict = this.findAnyHorarioConflict();
      if (conflict) {
        this.error.set(conflict);
        Swal.fire({
          icon: 'warning',
          title: 'Conflicto de horario',
          text: conflict,
          confirmButtonText: 'Entendido'
        });
        return false;
      }
    }

    return true;
  }

  // ── Paso 2: Grupos ───────────────────────────────────────────────────────────
  addGrupo(): void {
    const nombre = this.nuevoGrupoNombre.trim();
    if (!nombre) return;
    this.grupos.update(list => [
      ...list,
      { nombre, descripcion: '', edad_min: null, edad_max: null, tiene_cupo: false, cupo_maximo: null, instructor_id: null, costo_interno: null, equipos: [], horarios: [] },
    ]);
    this.nuevoGrupoNombre = '';
    this.activeGrupoIndex.set(this.grupos().length - 1);
  }

  removeGrupo(idx: number): void {
    this.grupos.update(list => list.filter((_, i) => i !== idx));
    if (this.activeGrupoIndex() >= this.grupos().length) {
      this.activeGrupoIndex.set(Math.max(0, this.grupos().length - 1));
    }
  }

  toggleGrupoCupo(grupoIdx: number, value: boolean): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g }));
      copy[grupoIdx].tiene_cupo  = value;
      if (!value) copy[grupoIdx].cupo_maximo = null;
      return copy;
    });
  }

  setGrupoCupoMaximo(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g }));
      copy[grupoIdx].cupo_maximo = value;
      return copy;
    });
  }

  setGrupoCosto(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: g.horarios.map(h => ({ ...h })) }));
      const profId = Number(copy[grupoIdx].instructor_id || 0);
      copy[grupoIdx].costo_interno = value;
      copy[grupoIdx].horarios = copy[grupoIdx].horarios.map(h => ({ ...h, costo_interno: value }));
      if (profId > 0) {
        for (const grp of copy) {
          if (Number(grp.instructor_id || 0) === profId) {
            grp.costo_interno = value;
          }
          for (const item of grp.horarios) {
            if (Number(item.profesor_id || grp.instructor_id || 0) === profId) {
              item.costo_interno = value;
            }
          }
        }
      }
      return copy;
    });
  }

  setGrupoInstructor(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      copy[grupoIdx].instructor_id = value;
      copy[grupoIdx].horarios = copy[grupoIdx].horarios.map(h => ({ ...h, profesor_id: value }));
      return copy;
    });
  }

  // ── Paso 3: Horarios ─────────────────────────────────────────────────────────
  toggleDia(grupoIdx: number, dia: number): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      const horarios = copy[grupoIdx].horarios;
      const existing = horarios.some(h => h.dia_semana === dia);
      if (existing) {
        copy[grupoIdx].horarios = horarios.filter(h => h.dia_semana !== dia);
      } else {
        horarios.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null, profesor_id: copy[grupoIdx].instructor_id, costo_interno: copy[grupoIdx].costo_interno });
        copy[grupoIdx].horarios.sort((a,b) => a.dia_semana - b.dia_semana);
      }
      return copy;
    });
  }

  addHorarioOnly(grupoIdx: number, dia: number): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      copy[grupoIdx].horarios.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null, profesor_id: copy[grupoIdx].instructor_id, costo_interno: copy[grupoIdx].costo_interno });
      copy[grupoIdx].horarios.sort((a,b) => a.dia_semana - b.dia_semana);
      return copy;
    });
  }

  




  removeHorario(grupoIdx: number, index: number): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      copy[grupoIdx].horarios.splice(index, 1);
      return copy;
    });
  }

  isDiaSelected(grupoIdx: number, dia: number): boolean {
    return this.grupos()[grupoIdx]?.horarios.some(h => h.dia_semana === dia) ?? false;
  }

  getHorario(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios.find(h => h.dia_semana === dia);
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
    let selectedModType: 'ubicacion' | 'instructor' | 'horario' | null = null;

    const areasClub = this.getAreasByClub();
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

    const diasNombres = [
      { num: 1, label: 'Lunes' }, { num: 2, label: 'Martes' }, { num: 3, label: 'Miércoles' },
      { num: 4, label: 'Jueves' }, { num: 5, label: 'Viernes' }, { num: 6, label: 'Sábado' }, { num: 7, label: 'Domingo' }
    ];
    const diasOptionsHtml = diasNombres
      .map(d => `<option value="${d.num}" ${d.num === curDia ? 'selected' : ''}>${d.label}</option>`)
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
            const modType = this.getModificationType(item, g.categoria) || '';
            return `
              <div class="motivo-option-card" data-value="${escaped}" data-modtype="${modType}" style="
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
            ? areasClub.find(a => Number(a.area_id) === newAreaId)?.area_name
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
          const diaLabel = this.getDiaNombre(newDia);
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

  updateHorarioField(grupoIdx: number, index: number, field: 'hora_inicio' | 'hora_fin' | 'lugar' | 'area_id' | 'profesor_id' | 'costo_interno' | 'is_active' | 'motivo_cancelacion', value: string | number | boolean | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: g.horarios.map(h => ({ ...h })) }));
      const h = copy[grupoIdx].horarios[index];
      if (!h) return copy;
      (h as any)[field] = value;

      if (field === 'costo_interno') {
        const profId = Number(h.profesor_id || copy[grupoIdx].instructor_id || 0);
        if (profId > 0) {
          for (const grp of copy) {
            if (Number(grp.instructor_id || 0) === profId) {
              grp.costo_interno = value as number | null;
            }
            for (const item of grp.horarios) {
              if (Number(item.profesor_id || grp.instructor_id || 0) === profId) {
                item.costo_interno = value as number | null;
              }
            }
          }
        }
      } else if (field === 'profesor_id' && value) {
        const profId = Number(value);
        let existingCosto: number | null = null;
        for (const grp of copy) {
          for (const item of grp.horarios) {
            if (Number(item.profesor_id || grp.instructor_id || 0) === profId && item.costo_interno !== null && item.costo_interno !== undefined && Number(item.costo_interno) > 0) {
              existingCosto = Number(item.costo_interno);
              break;
            }
          }
          if (existingCosto !== null) break;
        }
        if (existingCosto !== null) {
          h.costo_interno = existingCosto;
        }
      }

      return copy;
    });
  }

  async toggleWizardHorarioActive(grupoIdx: number, index: number, event: Event): Promise<void> {
    const g = this.grupos()[grupoIdx];
    const h = g?.horarios[index];
    if (!h) return;
    const checkbox = event?.target as HTMLInputElement | null;
    const newVal = h.is_active === false ? true : false;

    if (!newVal) {
      const promptResult = await this.promptMotivoCancelacion({
        dia_semana: Number(h.dia_semana),
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        area_id: h.area_id ?? null,
        lugar: h.lugar ?? null,
        profesor_id: h.profesor_id || g.instructor_id || null,
      });
      if (!promptResult) {
        if (checkbox) checkbox.checked = true;
        return;
      }

      this.grupos.update(list => {
        const copy = list.map(grp => ({ ...grp, horarios: grp.horarios.map(item => ({ ...item })) }));
        const target = copy[grupoIdx].horarios[index];
        if (target) {
          target.is_active = false;
          target.motivo_cancelacion = promptResult.motivo;
        }
        if (promptResult.newSchedule) {
          copy[grupoIdx].horarios.push({
            dia_semana: promptResult.newSchedule.dia_semana,
            hora_inicio: promptResult.newSchedule.hora_inicio,
            hora_fin: promptResult.newSchedule.hora_fin,
            area_id: promptResult.newSchedule.area_id,
            lugar: promptResult.newSchedule.lugar,
            profesor_id: promptResult.newSchedule.profesor_id,
            costo_interno: target?.costo_interno ?? copy[grupoIdx].costo_interno ?? null,
            is_active: true,
            motivo_cancelacion: null,
          });
          copy[grupoIdx].horarios.sort((a, b) => a.dia_semana - b.dia_semana);
        }
        return copy;
      });
    } else {
      this.grupos.update(list => {
        const copy = list.map(grp => ({ ...grp, horarios: grp.horarios.map(item => ({ ...item })) }));
        const target = copy[grupoIdx].horarios[index];
        if (target) {
          target.is_active = true;
          target.motivo_cancelacion = null;
        }
        return copy;
      });
    }
  }

  // ── Réplica de horarios ──────────────────────────────────────────────────────────────────
  toggleReplicar(grupoIdx: number, dia: number): void {
    const current = this.replicandoDia();
    if (current?.grupoIdx === grupoIdx && current?.dia === dia) {
      this.cerrarReplicar();
    } else {
      this.replicandoDia.set({ grupoIdx, dia });
      this.diasParaReplicar.set([]);
    }
  }

  
  getHorariosByDia(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(x => x.item.dia_semana === dia) ?? [];
  }



  cerrarReplicar(): void {
    this.replicandoDia.set(null);
    this.diasParaReplicar.set([]);
  }

  isDiaParaReplicar(dia: number): boolean {
    return this.diasParaReplicar().includes(dia);
  }

  tieneDestinosConConflicto(grupoIdx: number): boolean {
    return this.diasParaReplicar().some(n => this.isDiaSelected(grupoIdx, n));
  }

  toggleDiaReplica(dia: number, checked: boolean): void {
    this.diasParaReplicar.update((list: number[]) =>
      checked ? [...list, dia] : list.filter((d: number) => d !== dia)
    );
  }

  aplicarReplica(grupoIdx: number, diaFuente: number): void {
    const destinos = this.diasParaReplicar();
    if (!destinos.length) return;

    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: g.horarios.map(h => ({ ...h })) }));
      const fuente = copy[grupoIdx].horarios.filter(h => h.dia_semana === diaFuente);

      for (const dest of destinos) {
        // Quitar horarios del día destino
        copy[grupoIdx].horarios = copy[grupoIdx].horarios.filter(h => h.dia_semana !== dest);
        // Copiar los del fuente con el día destino
        for (const h of fuente) {
          copy[grupoIdx].horarios.push({ ...h, dia_semana: dest });
        }
      }
      copy[grupoIdx].horarios.sort((a, b) => a.dia_semana - b.dia_semana);
      return copy;
    });

    this.cerrarReplicar();
  }

  /** Filtra las áreas mapeadas por el club seleccionado en Paso 1 */
  getAreasByClub(): AreaMapeada[] {
    if (!this.club_id || !this.formData()) return [];
    return (this.formData()!.areas_mapeadas ?? []).filter(
      a => Number(a.acceso_club_id) === Number(this.club_id)
    );
  }

  /** Nombre del área dado su id */
  getAreaName(areaId: number | null): string {
    if (!areaId) return '—';
    return this.formData()?.areas_mapeadas?.find(a => Number(a.area_id) === Number(areaId))?.area_name ?? `Área ${areaId}`;
  }

  // ── Paso 4: Criterios ────────────────────────────────────────────────────────
  addCriterio(): void {
    const nombre = this.nuevoCriterioNombre.trim();
    if (!nombre) return;
    this.criterios.update(list => [
      ...list,
      { nombre, descripcion: '', escala_min: 1, escala_max: 5 },
    ]);
    this.nuevoCriterioNombre = '';
  }

  removeCriterio(idx: number): void {
    this.criterios.update(list => list.filter((_, i) => i !== idx));
  }

  // ── Publicar ─────────────────────────────────────────────────────────────────
  async publish(closeModal = true): Promise<void> {
    if (!this.validateCurrentStep()) return;

    const conflict = this.findAnyHorarioConflict();
    if (conflict) {
      this.error.set(conflict);
      Swal.fire({
        icon: 'warning',
        title: 'Conflicto de horario',
        text: conflict,
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const user = this.auth.getCurrentUser();
    const userId = user?.id ?? 0;

    try {
      let actividadId: number;
      
      let oldState: any = null;
      if (this.isEditing() && this.savedStateHash) {
         try { oldState = JSON.parse(this.savedStateHash); } catch(e){}
      }
      const gruposCriteriosChanged = !oldState || 
          JSON.stringify(this.grupos()) !== JSON.stringify(oldState.grupos) ||
          JSON.stringify(this.criterios()) !== JSON.stringify(oldState.criterios);

      if (this.isEditing()) {
        const res = await firstValueFrom(this.svc.update(this.editActividad!.id, {
          nombre:          this.nombre.trim(),
          descripcion:     this.descripcion.trim() || undefined,
          icono:           this.icono,
          color:           this.color,
          tipo:            this.tipo,
          modo_mensajeria: this.modo_mensajeria,
          tiene_costo:     this.tiene_costo,
          fecha_inicio:    this.fecha_inicio || null,
          fecha_fin:       this.fecha_fin    || null,
          monto:           this.tiene_costo ? (this.monto ?? null) : null,
        }));
        actividadId = res.data.id;

        if (gruposCriteriosChanged) {
          const current = this.originalActividad();
          if (current) {
            const delHorarios = [];
            for (const g of current.grupos_categorias ?? [])
              for (const e of g.equipos ?? [])
                for (const h of e.horarios ?? [])
                  delHorarios.push(firstValueFrom(this.svc.deleteHorario(e.id, h.id)));
            await Promise.all(delHorarios);

            const delEquipos = [];
            for (const g of current.grupos_categorias ?? [])
              for (const e of g.equipos ?? [])
                delEquipos.push(firstValueFrom(this.svc.deleteEquipo(e.id)));
            await Promise.all(delEquipos);

            const delGrupos = [];
            for (const g of current.grupos_categorias ?? [])
              delGrupos.push(firstValueFrom(this.svc.deleteGrupo(g.id)));
            await Promise.all(delGrupos);

            const delCriterios = [];
            for (const c of current.criterios_evaluacion ?? [])
              delCriterios.push(firstValueFrom(this.svc.deleteCriterio(c.id)));
            await Promise.all(delCriterios);
          }
        }
      } else {
        const res = await firstValueFrom(this.svc.create({
          club_id:         this.club_id!,
          nombre:          this.nombre.trim(),
          descripcion:     this.descripcion.trim() || undefined,
          icono:           this.icono,
          color:           this.color,
          tipo:            this.tipo,
          modo_mensajeria: this.modo_mensajeria,
          tiene_costo:     this.tiene_costo,
          fecha_inicio:    this.fecha_inicio || undefined,
          fecha_fin:       this.fecha_fin    || undefined,
          monto:           this.tiene_costo ? (this.monto ?? undefined) : undefined,
          is_active:       true,
          created_by:      userId,
        }));
        actividadId = res.data.id;
      }

      if (gruposCriteriosChanged) {
        for (let gi = 0; gi < this.grupos().length; gi++) {
          const g = this.grupos()[gi];
          const gRes = await firstValueFrom(this.svc.createGrupo({
            actividad_id: actividadId!,
            nombre:       g.nombre,
            descripcion:  g.descripcion || undefined,
            edad_min:     g.edad_min ?? undefined,
            edad_max:     g.edad_max ?? undefined,
            tiene_cupo:   g.tiene_cupo,
            cupo_maximo:  g.tiene_cupo ? (g.cupo_maximo ?? undefined) : undefined,
            orden:        gi,
            is_active:    true,
          }));
          const grupoId = gRes.data.id;

          const equiposACrear = g.horarios.length > 0
            ? [{ nombre: 'General', color: this.color, coach_id: g.instructor_id }]
            : [];

          for (const eq of equiposACrear) {
            const eRes = await firstValueFrom(this.svc.createEquipo({
              grupo_id:  grupoId,
              nombre:    eq.nombre,
              color:     eq.color || undefined,
              coach_id:  eq.coach_id ?? undefined,
              is_active: true,
              elegible_para_socios: this.elegible_para_socios,
            }));
            const equipoId = eRes.data.id;

            for (const h of g.horarios) {
              await firstValueFrom(this.svc.createHorario(equipoId, {
                dia_semana:  h.dia_semana,
                hora_inicio: h.hora_inicio,
                hora_fin:    h.hora_fin,
                lugar:       h.lugar ?? undefined,
                area_id:     h.area_id ?? undefined,
                profesor_id: (h.profesor_id || g.instructor_id) ?? undefined,
                costo_interno: h.costo_interno ?? undefined,
                is_active:   h.is_active !== false,
                motivo_cancelacion: h.is_active === false ? (h.motivo_cancelacion ?? null) : null,
              }));
            }
          }
        }

        const postCriterios = this.criterios().map((c, ci) => firstValueFrom(this.svc.createCriterio({
            actividad_id: actividadId!,
            nombre:       c.nombre,
            descripcion:  c.descripcion || undefined,
            escala_min:   c.escala_min,
            escala_max:   c.escala_max,
            orden:        ci,
            is_active:    true,
          })));
        await Promise.all(postCriterios);
      }

      this.saving.set(false);
      if (closeModal) {
        document.body.style.overflow = '';
        this.saved.emit(this.isEditing() ? 'Actividad actualizada' : 'Actividad creada correctamente');
      } else {
        const detailRes = await firstValueFrom(this.svc.getById(actividadId!));
        this.originalActividad.set(detailRes.data);
        if (gruposCriteriosChanged) {
           this.patchFromEdit(detailRes.data);
        }
        setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        this.silentlySaved.emit();
      }

    } catch (err: any) {
      this.saving.set(false);
      const msg = err?.error?.message || 'Error al guardar la actividad. Verifica los datos e intenta de nuevo.';
      this.error.set(msg);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: msg,
        confirmButtonText: 'Entendido'
      });
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: Event) {
    this.cancel();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('wizard-overlay')) {
      this.cancel();
    }
  }

  cancel(): void {
    document.body.style.overflow = '';
    this.cancelled.emit();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  labelTipo(t: string): string {
    const map: Record<string, string> = {
      deporte_equipo:      'Deporte de equipo',
      deporte_individual:  'Deporte individual',
      arte:                'Arte',
      otro:                'Otro',
    };
    return map[t] ?? t;
  }

  labelMensajeria(m: string): string {
    const map: Record<string, string> = {
      bidireccional:  'Bidireccional',
      solo_respuesta: 'Solo respuesta',
      solo_lectura:   'Solo lectura',
    };
    return map[m] ?? m;
  }

  labelDia(n: number): string {
    return DIAS.find(d => d.num === n)?.label ?? `${n}`;
  }

  getDiaNombre(n: number): string {
    const nombres = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    return nombres[n - 1] ?? '';
  }

  totalHorarios(): number {
    return this.grupos().reduce((acc, g) => acc + g.horarios.length, 0);
  }

  getInstructorName(id: number | null): string {
    if (!id) return 'Sin instructor';
    const inst = this.formData()?.instructores?.find(i => i.id === id);
    return inst ? inst.full_name : `Profesor #${id}`;
  }

  trackByIdx(_i: number, _v: any): number { return _i; }

  
}
