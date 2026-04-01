/**
 * membresia.model.ts
 *
 * TypeScript interfaces for the Membresía search module.
 * Mirrors the CakePHP API response of GET /api/membresias/buscar?q=
 */

// ─────────────────────────────────────────────────────────────────────────────
// Datos generales de la membresía (encabezado)
// Fuentes: membresias + estado_membresia + condicion_patrimonial + payment_frequencies
// ─────────────────────────────────────────────────────────────────────────────
export interface MembresiaResumen {
  /** membresias.id — id interno NS del registro de membresía */
  id: number;
  /** membresias.membership_id — número legible (ej. 10003) */
  numeroHumano: string;
  /** socios.first_name + last_name del titular */
  nombreTitular: string;
  /** condicion_patrimonial.name (ej. "Vitalicio") */
  patrimonio: string | null;
  /** estado_membresia.name (ej. "Activo", "Cancelado") */
  estado: string;
  /** payment_frequencies.name (ej. "Mensual") */
  frecuenciaPago: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mensajes de la regla que aplica al titular de la membresía
// Fuente: cat_reglas (via ctrl_cumplimiento.id_regla_aplicada del titular)
// ─────────────────────────────────────────────────────────────────────────────
export interface MensajeMembresia {
  /** cat_reglas.mensaje_cumplimiento */
  cumplimiento: string | null;
  /** cat_reglas.mensaje_acuerdo */
  acuerdo: string | null;
  /** cat_reglas.mensaje_desacuerdo */
  desacuerdo: string | null;
  /** cat_reglas.nombre */
  reglaNombre: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado de acceso de un socio individual
// Fuentes: ctrl_cumplimiento + cat_reglas
// ─────────────────────────────────────────────────────────────────────────────
export interface AccesoSocio {
  /** ctrl_cumplimiento.cumple — 1=cumple, 0=no cumple */
  cumple: boolean;
  /** Nombre del lector biométrico (placeholder, futuro) */
  lector: string | null;
  /** cat_reglas.nombre */
  reglaNombre: string | null;
  /** cat_reglas.mensaje_cumplimiento */
  reglaMensaje: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fila de beneficiario en la tabla de socios de la membresía
// Fuentes: detalle_membresias + socios + parentesco + condicion_adm + ctrl_cumplimiento
// ─────────────────────────────────────────────────────────────────────────────
export interface SocioMembresia {
  /** socios.entityid — número legible del socio */
  numeroHumano: string;
  /** socios.first_name + last_name (o altname) */
  nombreCompleto: string;
  /** detalle_membresias.edad */
  edad: number | null;
  /** parentesco.name (ej. "Titular", "Esposo(a)", "Hijo(a)") */
  parentesco: string;
  /** condicion_adm.name (ej. "Activo", "Baja", "Suspendido", "Fallecido") */
  condicionAdministrativa: string;
  /** URL de foto del socio (futuro) */
  fotoUrl: string | null;
  /** Estado de acceso y regla que aplica */
  acceso: AccesoSocio;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces RAW (snake_case) — forma exacta en que la API devuelve los datos
// Usadas solo en el servicio para tipar el HTTP response antes de mapear
// ─────────────────────────────────────────────────────────────────────────────
export interface MembresiaRaw {
  id: number;
  membership_id: string;
  nombre_titular: string;
  patrimonio: string | null;
  estado: string;
  frecuencia_pago: string | null;
}

export interface MensajeRaw {
  cumplimiento: string | null;
  acuerdo: string | null;
  desacuerdo: string | null;
  regla_nombre: string | null;
}

export interface AccesoRaw {
  cumple: boolean;
  lector: string | null;
  regla_nombre: string | null;
  regla_mensaje: string | null;
}

export interface SocioRaw {
  numero_humano: string;
  nombre_completo: string;
  edad: number | null;
  parentesco: string;
  condicion_administrativa: string;
  foto_url: string | null;
  acceso: AccesoRaw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Respuesta completa del endpoint GET /api/membresias/buscar?q=
// El servicio mapea snake_case → camelCase antes de entregar al componente
// ─────────────────────────────────────────────────────────────────────────────
export interface BuscarMembresiaRawResponse {
  success: boolean;
  message: string;
  data: {
    membresia: MembresiaRaw;
    mensaje: MensajeRaw;
    socios: SocioRaw[];
  } | null;
}

export interface BuscarMembresiaResponse {
  success: boolean;
  message: string;
  data: {
    membresia: MembresiaResumen;
    mensaje: MensajeMembresia;
    socios: SocioMembresia[];
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Estados internos del componente
// ─────────────────────────────────────────────────────────────────────────────
export type BuscarEstado = 'initial' | 'loading' | 'empty' | 'results';
