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
import { firstValueFrom } from 'rxjs';
import { ActividadService } from '../../../../services/deportivo/actividad.service';
import { AuthService } from '../../../../services/auth.service';
import {
  Actividad,
  ActividadFormData,
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

  // ── Paso 4: Criterios ───────────────────────────────────────────────────────
  criterios        = signal<WizardCriterio[]>([]);
  nuevoCriterioNombre = '';

  // ── Computed ────────────────────────────────────────────────────────────────
  progressPct = computed(() => ((this.currentStep() - 1) / (STEPS.length - 1)) * 100);
  isEditing   = computed(() => this.editActividad !== null);

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    this.svc.getFormData().subscribe({
      next: res => this.formData.set(res.data),
      error: () => {/* no-critical */},
    });

    if (this.editActividad) {
      this.loadingDetail.set(true);
      this.svc.getById(this.editActividad.id).subscribe({
        next: res => {
          this.originalActividad.set(res.data);
          this.patchFromEdit(res.data);
          this.loadingDetail.set(false);
        },
        error: () => {
          // Fallback: patch con los datos básicos disponibles
          this.patchFromEdit(this.editActividad!);
          this.loadingDetail.set(false);
        },
      });
    }
  }

  private patchFromEdit(act: Actividad): void {
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
      nombre:      g.nombre,
      descripcion: g.descripcion ?? '',
      edad_min:    g.edad_min ?? null,
      edad_max:    g.edad_max ?? null,
      tiene_cupo:  g.tiene_cupo ?? false,
      cupo_maximo: g.cupo_maximo ?? null,
      equipos: (g.equipos ?? []).map(e => ({
        nombre:   e.nombre,
        color:    e.color ?? '#6366f1',
        coach_id: e.coach_id ?? null,
      })),
      // Los horarios se toman del primer equipo (todos comparten el mismo calendario)
      horarios: (g.equipos?.[0]?.horarios ?? []).map(h => ({
        dia_semana:  h.dia_semana,
        hora_inicio: (h.hora_inicio ?? '08:00:00').substring(0, 5),
        hora_fin:    (h.hora_fin ?? '09:00:00').substring(0, 5),
        lugar:       h.lugar ?? '',
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
      if (!this.nombre.trim()) {
        this.error.set('El nombre de la actividad es obligatorio.');
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
      { nombre, descripcion: '', edad_min: null, edad_max: null, tiene_cupo: false, cupo_maximo: null, equipos: [], horarios: [] },
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

  addEquipoToGrupo(grupoIdx: number, nombre: string): void {
    if (!nombre.trim()) return;
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, equipos: [...g.equipos] }));
      copy[grupoIdx].equipos.push({ nombre: nombre.trim(), color: '#6366f1', coach_id: null });
      return copy;
    });
  }

  removeEquipo(grupoIdx: number, equipoIdx: number): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, equipos: [...g.equipos] }));
      copy[grupoIdx].equipos.splice(equipoIdx, 1);
      return copy;
    });
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

  // ── Paso 3: Horarios ─────────────────────────────────────────────────────────
  toggleDia(grupoIdx: number, dia: number): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      const horarios = copy[grupoIdx].horarios;
      const existing = horarios.findIndex(h => h.dia_semana === dia);
      if (existing >= 0) {
        horarios.splice(existing, 1);
      } else {
        horarios.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: '' });
      }
      return copy;
    });
  }

  isDiaSelected(grupoIdx: number, dia: number): boolean {
    return this.grupos()[grupoIdx]?.horarios.some(h => h.dia_semana === dia) ?? false;
  }

  getHorario(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios.find(h => h.dia_semana === dia);
  }

  updateHorarioField(grupoIdx: number, dia: number, field: 'hora_inicio' | 'hora_fin' | 'lugar', value: string): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: g.horarios.map(h => ({ ...h })) }));
      const h = copy[grupoIdx].horarios.find(h => h.dia_semana === dia);
      if (h) (h as any)[field] = value;
      return copy;
    });
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
          fecha_inicio:    this.tiene_costo ? (this.fecha_inicio || null) : null,
          fecha_fin:       this.tiene_costo ? (this.fecha_fin    || null) : null,
          monto:           this.tiene_costo ? (this.monto        ?? null) : null,
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
          club_id:         1,
          nombre:          this.nombre.trim(),
          descripcion:     this.descripcion.trim() || undefined,
          icono:           this.icono,
          color:           this.color,
          tipo:            this.tipo,
          modo_mensajeria: this.modo_mensajeria,
          tiene_costo:     this.tiene_costo,
          fecha_inicio:    this.tiene_costo ? (this.fecha_inicio || undefined) : undefined,
          fecha_fin:       this.tiene_costo ? (this.fecha_fin    || undefined) : undefined,
          monto:           this.tiene_costo ? (this.monto        ?? undefined) : undefined,
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
        // para poder guardar los horarios (los horarios viven en el equipo, no en el grupo)
        const equiposACrear = g.equipos.length > 0
          ? g.equipos
          : g.horarios.length > 0
            ? [{ nombre: 'General', color: this.color, coach_id: null }]
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
              lugar:       h.lugar || undefined,
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

  totalEquipos(): number {
    return this.grupos().reduce((acc, g) => acc + g.equipos.length, 0);
  }

  trackByIdx(_i: number, _v: any): number { return _i; }
}
