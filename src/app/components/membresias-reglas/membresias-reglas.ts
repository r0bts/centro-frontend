import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ContentMenu } from '../content-menu/content-menu';
import { ReglaService, VarDef, VarValor } from '../../services/regla.service';
import { ReglaDetalle } from '../../models/regla.model';
import Swal from 'sweetalert2';

const CMP_LBL: Record<string, string> = {
  '=': 'igual a', '!=': 'diferente a',
  '<': 'menor que', '<=': 'menor o igual a',
  '>': 'mayor que', '>=': 'mayor o igual a',
  'IN': 'en el grupo', 'NOT_IN': 'fuera del grupo'
};

const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ── Interfaces ──
export interface Condition {
  id: number;
  variable: string;
  comparador: string;
  valor: string[];
  logico: 'AND' | 'OR';
  open: boolean;
}

export interface Entity {
  id: number;
  tipo: 'MEMBRESIA' | 'SOCIO';
  numero: string;
}

@Component({
  selector: 'app-membresias-reglas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './membresias-reglas.html',
  styleUrls: ['./membresias-reglas.scss']
})
export class MembresiasReglasComponent implements OnInit, OnDestroy {

  // ── Estado del wizard ──
  currentStep = signal(1);

  // ── Paso 1: Identidad y acción ──
  numeroRegla = signal<number | null>(null);
  nombre = signal('');
  tipo = signal<'GENERAL' | 'PARTICULAR'>('GENERAL');
  accion = signal<'PERMITIR' | 'BLOQUEAR' | null>(null);
  activa = signal(true);
  fechaInicio = signal('');
  fechaFin = signal('');
  showVigencia = signal(false);

  // ── Paso 2: Mensajes ──
  mensajeCumplimiento = signal('');
  mensajeAcuerdo = signal('');
  mensajeDesacuerdo = signal('');

  // ── Paso 3: Condiciones ──
  conditions = signal<Condition[]>([]);
  private condIdCounter: number = 0;

  // ── Paso 4: Alcance ──
  entities = signal<Entity[]>([]);
  newEntityTipo = signal<'MEMBRESIA' | 'SOCIO'>('MEMBRESIA');
  newEntityNumero = signal('');

  // ── Estado de guardado / modo ──
  isSaving = signal(false);
  isLoadingEdit = signal(false);
  isLoadingVars = signal(false);
  isEditMode = signal(false);
  editId = signal<number | null>(null);
  private destroy$ = new Subject<void>();

  // ── Catálogo dinámico de variables ──
  varsMap = signal<Record<string, VarDef>>({});
  varsLoaded = signal(false);

  // ── Catálogos expuestos al template ──
  readonly CMP_LBL = CMP_LBL;
  readonly ALPHA = ALPHA;

  // ── Computed: claves de variables disponibles ──
  varKeys = computed(() => Object.keys(this.varsMap()));

  // ── Computed (reemplazan los getters) ──
  validConditions = computed(() =>
    this.conditions().filter(c => c.variable && c.valor.length > 0)
  );

  conditionsCount = computed(() => {
    const valid = this.validConditions().length;
    const total = this.conditions().length;
    return valid !== total ? `${valid}/${total}` : `${valid}`;
  });

  sumNombre = computed(() => {
    const n = this.nombre().trim();
    if (!n) return '—';
    return n.length > 28 ? n.slice(0, 28) + '…' : n;
  });

  vigenciaText = computed(() => {
    if (!this.fechaInicio() && !this.fechaFin()) return '';
    return (this.fechaInicio() || '…') + ' → ' + (this.fechaFin() || 'sin límite');
  });

  msgCTruncated = computed(() => {
    const m = this.mensajeCumplimiento().trim();
    return m.length > 50 ? m.slice(0, 50) + '…' : m;
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reglaService: ReglaService,
  ) {}

  ngOnInit(): void {
    this.loadVariables();
  }

  private loadVariables(): void {
    this.isLoadingVars.set(true);
    this.reglaService.getVariables()
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoadingVars.set(false)))
      .subscribe({
        next: (map) => {
          this.varsMap.set(map);
          this.varsLoaded.set(true);
          // Ahora que las variables están disponibles, inicializar modo
          const idParam = this.route.snapshot.paramMap.get('id');
          if (idParam) {
            this.isEditMode.set(true);
            this.editId.set(+idParam);
            this.loadReglaParaEditar(+idParam);
          } else {
            this.addCondition();
          }
        },
        error: () => {
          this.showToast('⚠ No se pudieron cargar las variables del motor de reglas', 'error');
          // Fallback: continuar de todos modos
          this.varsLoaded.set(true);
          const idParam = this.route.snapshot.paramMap.get('id');
          if (idParam) {
            this.isEditMode.set(true);
            this.editId.set(+idParam);
            this.loadReglaParaEditar(+idParam);
          } else {
            this.addCondition();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga datos en modo editar ────────────────────────
  private loadReglaParaEditar(id: number): void {
    this.isLoadingEdit.set(true);
    this.reglaService
      .getRegla(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoadingEdit.set(false); }),
      )
      .subscribe({
        next: (res) => {
          const r: ReglaDetalle = res.data;

          // ── Paso 1 ──
          this.numeroRegla.set(r.numero_regla);
          this.nombre.set(r.nombre);
          this.tipo.set(r.tipo as 'GENERAL' | 'PARTICULAR');
          this.accion.set(r.accion as 'PERMITIR' | 'BLOQUEAR');
          this.activa.set(r.activa);
          if (r.fecha_inicio || r.fecha_fin) {
            this.showVigencia.set(true);
            this.fechaInicio.set(r.fecha_inicio ?? '');
            this.fechaFin.set(r.fecha_fin ?? '');
          }

          // ── Paso 2 ──
          this.mensajeCumplimiento.set(r.mensaje_cumplimiento ?? '');
          this.mensajeAcuerdo.set(r.mensaje_acuerdo ?? '');
          this.mensajeDesacuerdo.set(r.mensaje_desacuerdo ?? '');

          // ── Paso 3: reconstruir condiciones ──
          const conds = r.condiciones.map(c => ({
            id:         ++this.condIdCounter,
            variable:   c.variable,
            comparador: c.comparador,
            valor:      c.valor,
            logico:     c.operador_logico as 'AND' | 'OR',
            open:       false,
          }));
          this.conditions.set(conds.length > 0 ? conds : []);
          if (conds.length === 0) this.addCondition();

          // ── Paso 4: reconstruir entidades ──
          this.entities.set(r.entidades.map((e, i) => ({
            id:     Date.now() + i,
            tipo:   e.tipo_entidad,
            numero: e.numero_humano,
          })));
        },
        error: (err) => {
          const status = err?.status ?? 0;
          this.showToast(
            status === 404 ? '⚠ Regla no encontrada' : '⚠ No se pudo cargar la regla',
            'error',
          );
          this.router.navigate(['/membresias/reglas']);
        },
      });
  }

  // ════════════════════════════════════
  // NAVEGACIÓN
  // ════════════════════════════════════

  onVolver(): void {
    this.router.navigate(['/membresias/reglas']);
  }

  goTo(n: number): void {
    if (n > this.currentStep() && !this.validateStep(this.currentStep())) return;
    if (n === 3 && this.conditions().length === 0) this.addCondition();
    this.currentStep.set(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ════════════════════════════════════
  // VALIDACIÓN
  // ════════════════════════════════════

  validateStep(s: number): boolean {
    if (s === 1) {
      if (!this.numeroRegla() || this.numeroRegla()! < 1) {
        this.showToast('⚠ Ingresa el número de regla (mayor a 0)', 'warning');
        return false;
      }
      if (!this.nombre().trim()) {
        this.showToast('⚠ Ingresa el nombre de la regla', 'warning');
        return false;
      }
      if (!this.accion()) {
        this.showToast('⚠ Selecciona una acción (PERMITIR o BLOQUEAR)', 'warning');
        return false;
      }
    }
    if (s === 3) {
      if (this.validConditions().length === 0) {
        this.showToast('⚠ Agrega al menos una condición completa', 'warning');
        return false;
      }
    }
    if (s === 4) {
      if (this.tipo() === 'PARTICULAR' && this.entities().length === 0) {
        this.showToast('⚠ Agrega al menos una membresía o socio para el tipo PARTICULAR', 'warning');
        return false;
      }
    }
    return true;
  }

  // ════════════════════════════════════
  // PASO 1 — Tipo y Acción
  // ════════════════════════════════════

  selectTipo(v: 'GENERAL' | 'PARTICULAR'): void {
    this.tipo.set(v);
  }

  selectAccion(v: 'PERMITIR' | 'BLOQUEAR'): void {
    this.accion.set(v);
  }

  toggleVigencia(): void {
    this.showVigencia.update(v => !v);
    if (!this.showVigencia()) {
      this.fechaInicio.set('');
      this.fechaFin.set('');
    }
  }

  // ════════════════════════════════════
  // PASO 3 — Condiciones
  // ════════════════════════════════════

  addCondition(): void {
    this.conditions.update(cs => [...cs, {
      id: ++this.condIdCounter,
      variable: '',
      comparador: '=',
      valor: [],
      logico: 'AND',
      open: true
    }]);
  }

  removeCondition(id: number): void {
    if (this.conditions().length <= 1) return;
    this.conditions.update(cs => cs.filter(c => c.id !== id));
  }

  toggleCondition(id: number): void {
    this.conditions.update(cs => cs.map(c => c.id === id ? { ...c, open: !c.open } : c));
  }

  setVariable(id: number, variable: string): void {
    const vars = this.varsMap();
    this.conditions.update(cs => cs.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        variable,
        valor: [],
        comparador: variable && vars[variable] ? vars[variable].ops[0] : c.comparador,
      };
    }));
  }

  setComparador(id: number, comparador: string): void {
    this.conditions.update(cs => cs.map(c => {
      if (c.id !== id) return c;
      const wasMulti = ['IN', 'NOT_IN'].includes(c.comparador);
      const isMulti  = ['IN', 'NOT_IN'].includes(comparador);
      return { ...c, comparador, valor: wasMulti !== isMulti ? [] : c.valor };
    }));
  }

  setNumericValue(id: number, val: string): void {
    this.conditions.update(cs => cs.map(c =>
      c.id === id ? { ...c, valor: val ? [val] : [] } : c
    ));
  }

  toggleChip(id: number, val: string, multi: boolean): void {
    this.conditions.update(cs => cs.map(c => {
      if (c.id !== id) return c;
      let valor: string[];
      if (multi) {
        const i = c.valor.indexOf(val);
        valor = i > -1
          ? [...c.valor.slice(0, i), ...c.valor.slice(i + 1)]
          : [...c.valor, val];
      } else {
        valor = c.valor[0] === val ? [] : [val];
      }
      return { ...c, valor };
    }));
  }

  setLogic(id: number, logico: 'AND' | 'OR'): void {
    this.conditions.update(cs => cs.map(c => c.id === id ? { ...c, logico } : c));
  }

  isChipSelected(id: number, val: string): boolean {
    const c = this.conditions().find(x => x.id === id);
    return c ? c.valor.includes(val) : false;
  }

  isMultiComparador(comparador: string): boolean {
    return ['IN', 'NOT_IN'].includes(comparador);
  }

  getConditionVarInfo(variable: string): VarDef | null {
    return variable ? (this.varsMap()[variable] ?? null) : null;
  }

  getConditionOps(variable: string): string[] {
    const v = variable ? this.varsMap()[variable] : null;
    return v ? v.ops : Object.keys(CMP_LBL);
  }

  getConditionVals(variable: string): VarValor[] {
    const v = variable ? this.varsMap()[variable] : null;
    return v?.vals ?? [];
  }

  /** Devuelve el label legible para una lista de valores normalizados (usado en preview) */
  getDisplayLabels(variable: string, valores: string[]): string {
    const v = variable ? this.varsMap()[variable] : null;
    if (!v || v.tipo === 'NUMERO') return valores.join(', ');
    return valores
      .map(norm => v.vals.find(x => x.normalized === norm)?.raw ?? norm)
      .join(', ');
  }

  getConditionLetter(index: number): string {
    return ALPHA[index] || String(index + 1);
  }

  // ════════════════════════════════════
  // PASO 4 — Entidades
  // ════════════════════════════════════

  addEntity(): void {
    const num = this.newEntityNumero().trim();
    if (!num) {
      this.showToast('⚠ Escribe el número de membresía o socio', 'warning');
      return;
    }
    const exists = this.entities().find(e => e.tipo === this.newEntityTipo() && e.numero === num);
    if (exists) {
      this.showToast('Ya está en la lista', 'warning');
      return;
    }
    this.entities.update(es => [...es, { id: Date.now(), tipo: this.newEntityTipo(), numero: num }]);
    this.newEntityNumero.set('');
  }

  removeEntity(id: number): void {
    this.entities.update(es => es.filter(e => e.id !== id));
  }

  onEntityKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addEntity();
  }

  // ════════════════════════════════════
  // GUARDAR
  // ════════════════════════════════════

  saveRule(): void {
    if (!this.validateStep(1)) { this.goTo(1); return; }
    if (!this.validateStep(3)) { this.goTo(3); return; }
    if (!this.validateStep(4)) return;

    const payload = {
      numero_regla:          this.numeroRegla()!,
      nombre:                this.nombre().trim(),
      tipo:                  this.tipo(),
      accion:                this.accion()!,
      activa:                this.activa(),
      mensaje_cumplimiento:  this.mensajeCumplimiento().trim() || null,
      mensaje_acuerdo:       this.mensajeAcuerdo().trim()      || null,
      mensaje_desacuerdo:    this.mensajeDesacuerdo().trim()   || null,
      fecha_inicio:          this.fechaInicio()  || null,
      fecha_fin:             this.fechaFin()     || null,
      condiciones: this.validConditions().map((c, i) => ({
        variable:         c.variable,
        comparador:       c.comparador,
        valor:            c.valor,
        operador_logico:  c.logico,
        orden:            i + 1,
      })),
      entidades: this.tipo() === 'PARTICULAR'
        ? this.entities().map(e => ({
            tipo_entidad:  e.tipo,
            numero_humano: e.numero,
          }))
        : [],
    };

    this.isSaving.set(true);

    const obs = this.isEditMode()
      ? this.reglaService.editRegla(this.editId()!, payload as any)
      : this.reglaService.addRegla(payload as any);

    obs
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving.set(false); }),
      )
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: this.isEditMode() ? '¡Regla actualizada!' : '¡Regla guardada!',
            html: `La regla <strong>#${res.data.numero_regla} — ${res.data.nombre}</strong>
                   fue ${this.isEditMode() ? 'actualizada' : 'creada'} correctamente.`,
            confirmButtonText: 'Ver listado',
            timer: 4000,
            timerProgressBar: true,
          }).then(() => {
            this.router.navigate(['/membresias/reglas']);
          });
        },
        error: (err) => {
          const status  = err?.status  ?? 0;
          const message = err?.error?.message ?? err?.message ?? 'Error desconocido';
          const field   = err?.error?.error?.field;

          if (status === 400 && field === 'numero_regla') {
            this.showToast(
              `⚠ El número de regla #${this.numeroRegla()} ya existe. Elige otro número.`,
              'warning',
            );
            this.goTo(1);
            return;
          }

          if (status === 422) {
            Swal.fire({
              icon: 'warning',
              title: 'Datos inválidos',
              text: 'Revisa los campos e intenta de nuevo.',
              confirmButtonColor: '#F4D35E',
            });
            return;
          }

          Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            html: `No se pudo guardar la regla.<br><small class="text-muted">${message}</small>`,
            confirmButtonColor: '#DA3E3E',
          });
        },
      });
  }

  // ════════════════════════════════════
  // UTILIDADES
  // ════════════════════════════════════

  private showToast(msg: string, type: 'warning' | 'success' | 'error'): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: msg,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  trackByString(_index: number, item: string): string {
    return item;
  }

  trackByKey(_index: number, key: string): string {
    return key;
  }

  trackByNormalized(_index: number, item: VarValor): string {
    return item.normalized;
  }
}
