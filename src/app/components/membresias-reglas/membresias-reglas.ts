import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

// ── Catálogo de variables evaluables (espejo de cat_variables_regla) ──
const VARS: Record<string, { label: string; icon: string; tipo: 'CATALOGO' | 'NUMERO'; ops: string[]; vals?: string[]; unit?: string; prefix?: string }> = {
  CONDICION_ADMINISTRATIVA: {
    label: 'Condición administrativa', icon: '📋', tipo: 'CATALOGO',
    ops: ['=', '!=', 'IN', 'NOT_IN'],
    vals: ['ACTIVO', 'SUSPENDIDO', 'BAJA', 'ACUERDO_PAGO']
  },
  CONDICION_PATRIMONIAL: {
    label: 'Condición patrimonial', icon: '💰', tipo: 'CATALOGO',
    ops: ['=', '!=', 'IN', 'NOT_IN'],
    vals: ['AL_CORRIENTE', 'CON_DEUDA', 'MOROSO']
  },
  EDAD: {
    label: 'Edad del socio', icon: '🎂', tipo: 'NUMERO',
    ops: ['=', '!=', '<', '<=', '>', '>='], unit: 'años'
  },
  MONTO: {
    label: 'Monto de deuda', icon: '💳', tipo: 'NUMERO',
    ops: ['=', '!=', '<', '<=', '>', '>='], prefix: '$'
  },
  ESTADO_MEMBRESIA: {
    label: 'Estado de la membresía', icon: '🏷️', tipo: 'CATALOGO',
    ops: ['=', '!=', 'IN', 'NOT_IN'],
    vals: ['ACTIVO', 'SUSPENDIDO', 'CANCELADO', 'AUSENTE']
  },
  GENERO: {
    label: 'Género del socio', icon: '👤', tipo: 'CATALOGO',
    ops: ['=', '!='], vals: ['MASCULINO', 'FEMENINO']
  },
  TIPO_SOCIO: {
    label: 'Tipo de socio', icon: '🏅', tipo: 'CATALOGO',
    ops: ['=', '!=', 'IN', 'NOT_IN'],
    vals: ['TITULAR', 'DEPENDIENTE', 'MENOR', 'INVITADO']
  }
};

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
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './membresias-reglas.html',
  styleUrls: ['./membresias-reglas.scss']
})
export class MembresiasReglasComponent implements OnInit {

  // ── Estado del wizard ──
  currentStep: number = 1;

  // ── Paso 1: Identidad y acción ──
  numeroRegla: number | null = null;
  nombre: string = '';
  tipo: 'GENERAL' | 'PARTICULAR' = 'GENERAL';
  accion: 'PERMITIR' | 'BLOQUEAR' | null = null;
  activa: boolean = true;
  fechaInicio: string = '';
  fechaFin: string = '';
  showVigencia: boolean = false;

  // ── Paso 2: Mensajes ──
  mensajeCumplimiento: string = '';
  mensajeAcuerdo: string = '';
  mensajeDesacuerdo: string = '';

  // ── Paso 3: Condiciones ──
  conditions: Condition[] = [];
  private condIdCounter: number = 0;

  // ── Paso 4: Alcance ──
  entities: Entity[] = [];
  newEntityTipo: 'MEMBRESIA' | 'SOCIO' = 'MEMBRESIA';
  newEntityNumero: string = '';

  // ── Catálogos expuestos al template ──
  readonly VARS = VARS;
  readonly CMP_LBL = CMP_LBL;
  readonly ALPHA = ALPHA;
  readonly varKeys = Object.keys(VARS);

  ngOnInit(): void {
    this.addCondition();
  }

  // ════════════════════════════════════
  // NAVEGACIÓN
  // ════════════════════════════════════

  goTo(n: number): void {
    if (n > this.currentStep && !this.validateStep(this.currentStep)) return;
    if (n === 3 && this.conditions.length === 0) this.addCondition();
    this.currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ════════════════════════════════════
  // VALIDACIÓN
  // ════════════════════════════════════

  validateStep(s: number): boolean {
    if (s === 1) {
      if (!this.numeroRegla || this.numeroRegla < 1) {
        this.showToast('⚠ Ingresa el número de regla (mayor a 0)', 'warning');
        return false;
      }
      if (!this.nombre.trim()) {
        this.showToast('⚠ Ingresa el nombre de la regla', 'warning');
        return false;
      }
      if (!this.accion) {
        this.showToast('⚠ Selecciona una acción (PERMITIR o BLOQUEAR)', 'warning');
        return false;
      }
    }
    if (s === 3) {
      const valid = this.validConditions;
      if (valid.length === 0) {
        this.showToast('⚠ Agrega al menos una condición completa', 'warning');
        return false;
      }
    }
    if (s === 4) {
      if (this.tipo === 'PARTICULAR' && this.entities.length === 0) {
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
    this.tipo = v;
  }

  selectAccion(v: 'PERMITIR' | 'BLOQUEAR'): void {
    this.accion = v;
  }

  toggleVigencia(): void {
    this.showVigencia = !this.showVigencia;
    if (!this.showVigencia) {
      this.fechaInicio = '';
      this.fechaFin = '';
    }
  }

  // ════════════════════════════════════
  // PASO 3 — Condiciones
  // ════════════════════════════════════

  addCondition(): void {
    this.conditions.push({
      id: ++this.condIdCounter,
      variable: '',
      comparador: '=',
      valor: [],
      logico: 'AND',
      open: true
    });
  }

  removeCondition(id: number): void {
    if (this.conditions.length <= 1) return;
    this.conditions = this.conditions.filter(c => c.id !== id);
  }

  toggleCondition(id: number): void {
    const c = this.conditions.find(x => x.id === id);
    if (c) c.open = !c.open;
  }

  setVariable(id: number, variable: string): void {
    const c = this.conditions.find(x => x.id === id);
    if (!c) return;
    c.variable = variable;
    c.valor = [];
    if (variable && VARS[variable]) {
      c.comparador = VARS[variable].ops[0];
    }
  }

  setComparador(id: number, comparador: string): void {
    const c = this.conditions.find(x => x.id === id);
    if (!c) return;
    const wasMulti = ['IN', 'NOT_IN'].includes(c.comparador);
    const isMulti  = ['IN', 'NOT_IN'].includes(comparador);
    c.comparador = comparador;
    if (wasMulti !== isMulti) c.valor = [];
  }

  setNumericValue(id: number, val: string): void {
    const c = this.conditions.find(x => x.id === id);
    if (c) c.valor = val ? [val] : [];
  }

  toggleChip(id: number, val: string, multi: boolean): void {
    const c = this.conditions.find(x => x.id === id);
    if (!c) return;
    if (multi) {
      const i = c.valor.indexOf(val);
      if (i > -1) c.valor.splice(i, 1);
      else c.valor.push(val);
    } else {
      c.valor = c.valor[0] === val ? [] : [val];
    }
  }

  setLogic(id: number, logico: 'AND' | 'OR'): void {
    const c = this.conditions.find(x => x.id === id);
    if (c) c.logico = logico;
  }

  isChipSelected(id: number, val: string): boolean {
    const c = this.conditions.find(x => x.id === id);
    return c ? c.valor.includes(val) : false;
  }

  isMultiComparador(comparador: string): boolean {
    return ['IN', 'NOT_IN'].includes(comparador);
  }

  getConditionVarInfo(variable: string) {
    return variable ? VARS[variable] : null;
  }

  getConditionOps(variable: string): string[] {
    return variable && VARS[variable] ? VARS[variable].ops : Object.keys(CMP_LBL);
  }

  getConditionVals(variable: string): string[] {
    return variable && VARS[variable]?.vals ? VARS[variable].vals! : [];
  }

  getConditionLetter(index: number): string {
    return ALPHA[index] || String(index + 1);
  }

  // ════════════════════════════════════
  // PASO 4 — Entidades
  // ════════════════════════════════════

  addEntity(): void {
    const num = this.newEntityNumero.trim();
    if (!num) {
      this.showToast('⚠ Escribe el número de membresía o socio', 'warning');
      return;
    }
    const exists = this.entities.find(e => e.tipo === this.newEntityTipo && e.numero === num);
    if (exists) {
      this.showToast('Ya está en la lista', 'warning');
      return;
    }
    this.entities.push({ id: Date.now(), tipo: this.newEntityTipo, numero: num });
    this.newEntityNumero = '';
  }

  removeEntity(id: number): void {
    this.entities = this.entities.filter(e => e.id !== id);
  }

  onEntityKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addEntity();
  }

  // ════════════════════════════════════
  // GETTERS — sidebar resumen y revisión
  // ════════════════════════════════════

  get validConditions(): Condition[] {
    return this.conditions.filter(c => c.variable && c.valor.length > 0);
  }

  get conditionsCount(): string {
    const valid = this.validConditions.length;
    const total = this.conditions.length;
    return valid !== total ? `${valid}/${total}` : `${valid}`;
  }

  get sumNombre(): string {
    const n = this.nombre.trim();
    if (!n) return '—';
    return n.length > 28 ? n.slice(0, 28) + '…' : n;
  }

  get vigenciaText(): string {
    if (!this.fechaInicio && !this.fechaFin) return '';
    return (this.fechaInicio || '…') + ' → ' + (this.fechaFin || 'sin límite');
  }

  get msgCTruncated(): string {
    const m = this.mensajeCumplimiento.trim();
    return m.length > 50 ? m.slice(0, 50) + '…' : m;
  }

  // ════════════════════════════════════
  // GUARDAR
  // ════════════════════════════════════

  saveRule(): void {
    if (!this.validateStep(1)) { this.goTo(1); return; }
    if (!this.validateStep(3)) { this.goTo(3); return; }
    if (!this.validateStep(4)) return;

    const payload = {
      numero_regla: this.numeroRegla,
      nombre: this.nombre.trim(),
      tipo: this.tipo,
      accion: this.accion,
      activa: this.activa ? 1 : 0,
      mensaje_cumplimiento: this.mensajeCumplimiento.trim() || null,
      mensaje_acuerdo: this.mensajeAcuerdo.trim() || null,
      mensaje_desacuerdo: this.mensajeDesacuerdo.trim() || null,
      fecha_inicio: this.fechaInicio || null,
      fecha_fin: this.fechaFin || null,
      condiciones: this.validConditions.map((c, i) => ({
        variable: c.variable,
        comparador: c.comparador,
        valor: c.valor.join(','),
        operador_logico: c.logico,
        orden: i + 1
      })),
      particulares: this.tipo === 'PARTICULAR'
        ? this.entities.map(e => ({ tipo_entidad: e.tipo, numero_humano: e.numero }))
        : []
    };

    console.log('📤 Payload → POST /reglas-negocio/agregar', JSON.stringify(payload, null, 2));

    Swal.fire({
      icon: 'success',
      title: '¡Regla guardada!',
      text: `La regla "${this.nombre}" ha sido guardada correctamente.`,
      confirmButtonText: 'Continuar',
      timer: 3000,
      timerProgressBar: true
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

  // TrackBy para *ngFor
  trackById(index: number, item: { id: number }): number {
    return item.id;
  }

  trackByString(index: number, item: string): string {
    return item;
  }

  trackByKey(index: number, item: string): string {
    return item;
  }
}
