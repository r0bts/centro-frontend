/**
 * Modelos para Finanzas Deportivas (Conceptos de Pago y Pagos)
 * Tablas: conceptos_pago, pagos
 */

export type PagoEstado = 'pendiente' | 'pagado' | 'vencido' | 'cancelado';
export type PagoMetodo = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
export type ConceptoPeriodicidad = 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'unico';

export interface ConceptoPago {
  id: number;
  club_id: number;
  actividad_id?: number | null;
  nombre: string;
  descripcion?: string | null;
  monto: number;
  moneda: string;
  periodicidad: ConceptoPeriodicidad;
  fecha_limite?: string | null;
  activo: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  club?: { id: number; nombre: string };
  actividad?: { id: number; nombre: string };
}

export interface Pago {
  id: number;
  alumno_id: number;
  concepto_id: number;
  monto: number;
  moneda: string;
  estado: PagoEstado;
  metodo_pago?: PagoMetodo | null;
  referencia?: string | null;
  fecha_vencimiento?: string | null;
  fecha_pago?: string | null;
  registrado_por?: number | null;
  notas?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  alumno?: { id: number; nombre: string; apellido: string };
  concepto?: { id: number; nombre: string; monto: number; moneda: string };
}

export interface ReportePagos {
  total_pendiente: number;
  total_pagado: number;
  total_vencido: number;
  por_concepto: {
    concepto_id: number;
    concepto_nombre: string;
    total: number;
    pagados: number;
    pendientes: number;
  }[];
  por_mes: {
    mes: string;
    total: number;
  }[];
}

// ---- Response wrappers ----

export interface ConceptoPagoListResponse {
  success: boolean;
  message: string;
  data: {
    conceptos_pago: ConceptoPago[];
    total: number;
  };
}

export interface PagoListResponse {
  success: boolean;
  message: string;
  data: {
    pagos: Pago[];
    total: number;
    resumen?: {
      pendiente: number;
      pagado: number;
      vencido: number;
    };
  };
}

export interface PagoFormData {
  alumnos: { id: number; nombre: string; apellido: string }[];
  conceptos: ConceptoPago[];
  estados: PagoEstado[];
  metodos: PagoMetodo[];
}
