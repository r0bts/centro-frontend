import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin, of } from 'rxjs';
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
  { id: 1, label: 'Identidad',   icon: 'bi-person-badge' },
  { id: 2, label: 'Grupos',      icon: 'bi-people' },
  { id: 3, label: 'Horarios',    icon: 'bi-clock' },
  { id: 4, label: 'Evaluación',  icon: 'bi-star' },
  { id: 5, label: 'Resumen',     icon: 'bi-check-circle' },
];

@Component({
  selector: 'app-actividad-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './actividad-wizard.html',
  styleUrl: './actividad-wizard.scss',
})
export class ActividadWizardComponent implements OnInit {
  @Input() editActividad: Actividad | null = null;
  @Output() saved     = new EventEmitter<string>();
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
  fecha_inicio    = '';
  fecha_fin       = '';
  monto: number | null = null;

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
      equipos: [],  // no se muestran en el wizard; se reconstruyen al guardar
      // Los horarios se toman del primer equipo
      horarios: (g.equipos?.[0]?.horarios ?? []).map(h => ({
        dia_semana:  h.dia_semana,
        hora_inicio: (h.hora_inicio ?? '08:00:00').substring(0, 5),
        hora_fin:    (h.hora_fin ?? '09:00:00').substring(0, 5),
        lugar:       h.lugar ?? null,
        area_id:     h.area_id ?? null,
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
    this.currentStep.set(step);
    this.error.set(null);
  }

  next(): void  { this.goTo(this.currentStep() + 1); }
  prev(): void  { this.goTo(this.currentStep() - 1); }

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
    return true;
  }

  // ── Paso 2: Grupos ───────────────────────────────────────────────────────────
  addGrupo(): void {
    const nombre = this.nuevoGrupoNombre.trim();
    if (!nombre) return;
    this.grupos.update(list => [
      ...list,
      { nombre, descripcion: '', edad_min: null, edad_max: null, tiene_cupo: false, cupo_maximo: null, instructor_id: null, equipos: [], horarios: [] },
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

  setGrupoInstructor(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g }));
      copy[grupoIdx].instructor_id = value;
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
        horarios.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null });
        copy[grupoIdx].horarios.sort((a,b) => a.dia_semana - b.dia_semana);
      }
      return copy;
    });
  }

  addHorarioOnly(grupoIdx: number, dia: number): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      copy[grupoIdx].horarios.push({
        dia_semana: dia,
        hora_inicio: '08:00',
        hora_fin: '09:00',
        lugar: null,
        area_id: null
      });
      copy[grupoIdx].horarios.sort((a,b) => a.dia_semana - b.dia_semana);
      return copy;
    });
  }

  getHorariosByDia(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(x => x.item.dia_semana === dia) ?? [];
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

  updateHorarioField(grupoIdx: number, index: number, field: 'hora_inicio' | 'hora_fin' | 'lugar' | 'area_id', value: string | number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: g.horarios.map(h => ({ ...h })) }));
      const h = copy[grupoIdx].horarios[index];
      if (h) (h as any)[field] = value;
      return copy;
    });
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
  async publish(): Promise<void> {
    if (!this.validateCurrentStep()) return;
    this.saving.set(true);
    this.error.set(null);

    const user = this.auth.getCurrentUser();
    const userId = user?.id ?? 0;

    try {
      let actividadId: number;

      if (this.isEditing()) {
        // 1. PUT campos básicos
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

        // 2. Eliminar sub-recursos existentes (de abajo hacia arriba)
        const current = this.originalActividad();
        if (current) {
          for (const g of current.grupos_categorias ?? []) {
            for (const e of g.equipos ?? []) {
              for (const h of e.horarios ?? []) {
                await firstValueFrom(this.svc.deleteHorario(e.id, h.id));
              }
              await firstValueFrom(this.svc.deleteEquipo(e.id));
            }
            await firstValueFrom(this.svc.deleteGrupo(g.id));
          }
          for (const c of current.criterios_evaluacion ?? []) {
            await firstValueFrom(this.svc.deleteCriterio(c.id));
          }
        }
      } else {
        // POST actividad nueva
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

      // POST grupos → equipos → horarios  (aplica tanto en crear como en editar)
      for (let gi = 0; gi < this.grupos().length; gi++) {
        const g = this.grupos()[gi];
        const gRes = await firstValueFrom(this.svc.createGrupo({
          actividad_id: actividadId,
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

        // Si el grupo no tiene equipos pero sí tiene horarios, crear un equipo "General"
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
          }));
          const equipoId = eRes.data.id;

          // Horarios del grupo asignados a este equipo
          for (const h of g.horarios) {
            await firstValueFrom(this.svc.createHorario(equipoId, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              is_active:   true,
            }));
          }
        }
      }

      // POST criterios (aplica tanto en crear como en editar)
      for (let ci = 0; ci < this.criterios().length; ci++) {
        const c = this.criterios()[ci];
        await firstValueFrom(this.svc.createCriterio({
          actividad_id: actividadId,
          nombre:       c.nombre,
          descripcion:  c.descripcion || undefined,
          escala_min:   c.escala_min,
          escala_max:   c.escala_max,
          orden:        ci,
          is_active:    true,
        }));
      }

      this.saving.set(false);
      document.body.style.overflow = '';
      this.saved.emit(this.isEditing() ? 'Actividad actualizada' : 'Actividad creada correctamente');

    } catch (err: any) {
      this.saving.set(false);
      this.error.set('Error al guardar la actividad. Verifica los datos e intenta de nuevo.');
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
    return inst ? inst.full_name : 'Sin instructor';
  }

  trackByIdx(_i: number, _v: any): number { return _i; }
}
