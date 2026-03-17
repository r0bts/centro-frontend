/**
 * regla.model.ts
 *
 * TypeScript interfaces for the business rules engine (Motor de Reglas v2.1).
 * These shapes mirror the CakePHP API responses with camelCase conversion.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shape returned by GET /api/reglas-negocio  (list item, no conditions detail)
// ─────────────────────────────────────────────────────────────────────────────
export interface ReglaListItem {
  /** id_regla from DB */
  id: number;
  /** numero_regla — order/priority (multiples of 10) */
  numeroRegla: number;
  nombre: string;
  tipo: 'GENERAL' | 'PARTICULAR';
  accion: 'PERMITIR' | 'BLOQUEAR';
  activa: boolean;
  condicionesCount: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  /** fecha_creacion ISO-8601 */
  fechaCreacion: string | null;
  creadoPor: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination metadata returned alongside the list
// ─────────────────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full response envelope from GET /api/reglas-negocio
// ─────────────────────────────────────────────────────────────────────────────
export interface ReglaListResponse {
  success: boolean;
  message: string;
  data: {
    rules: ReglaListItem[];      // already mapped to camelCase by the service
    pagination: PaginationMeta;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query parameters accepted by getReglas()
// ─────────────────────────────────────────────────────────────────────────────
export interface ReglaFilterParams {
  page?: number;
  limit?: number;
  tipo?: string;
  accion?: string;
  activa?: string;
  search?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reglas-negocio/reorder
// ─────────────────────────────────────────────────────────────────────────────
export interface ReorderRequest {
  /** id_regla values in the NEW desired order (top → bottom) */
  ids: number[];
}

export interface ReorderResponseItem {
  id_regla: number;
  numero_regla: number;
}

export interface ReorderResponse {
  success: boolean;
  message: string;
  data: ReorderResponseItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reglas-negocio/{id}/toggle
// ─────────────────────────────────────────────────────────────────────────────
export interface ToggleResponse {
  success: boolean;
  message: string;
  data: {
    id_regla: number;
    activa: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reglas-negocio  (create rule)
// ─────────────────────────────────────────────────────────────────────────────

/** A single condition row — maps to cat_regla_condiciones */
export interface AddReglaCondicion {
  variable: string;
  comparador: string;
  /** Array of values — backend stores as CSV internally */
  valor: string[];
  operador_logico: 'AND' | 'OR';
  orden: number;
}

/** A single entity row — maps to cat_regla_particular */
export interface AddReglaEntidad {
  tipo_entidad: 'MEMBRESIA' | 'SOCIO';
  numero_humano: string;
  /** Optional NetSuite internal ID */
  id_entidad?: number | null;
}

/** Full payload sent to POST /api/reglas-negocio */
export interface AddReglaPayload {
  numero_regla: number;
  nombre: string;
  tipo: 'GENERAL' | 'PARTICULAR';
  accion: 'PERMITIR' | 'BLOQUEAR';
  activa: boolean;
  mensaje_cumplimiento: string | null;
  mensaje_acuerdo: string | null;
  mensaje_desacuerdo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  condiciones: AddReglaCondicion[];
  /** Key matches what the backend reads: data['entidades'] */
  entidades: AddReglaEntidad[];
}

/** Response envelope from POST /api/reglas-negocio (HTTP 201) */
export interface AddReglaResponse {
  success: boolean;
  message: string;
  data: {
    id_regla: number;
    numero_regla: number;
    nombre: string;
    tipo: 'GENERAL' | 'PARTICULAR';
    accion: 'PERMITIR' | 'BLOQUEAR';
    activa: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reglas-negocio/{id}  (full rule detail)
// ─────────────────────────────────────────────────────────────────────────────

/** One condition row as returned by GET /api/reglas-negocio/{id} */
export interface ReglaCondicionDetalle {
  id_condicion: number;
  variable: string;
  comparador: string;
  /** Already an array — backend splits the stored CSV on read */
  valor: string[];
  operador_logico: 'AND' | 'OR';
  orden: number;
}

/** One entity row (only present when tipo = PARTICULAR) */
export interface ReglaEntidadDetalle {
  id: number;
  tipo_entidad: 'MEMBRESIA' | 'SOCIO';
  id_entidad: number | null;
  numero_humano: string;
}

/** Full rule detail including conditions and entities */
export interface ReglaDetalle {
  id_regla: number;
  numero_regla: number;
  nombre: string;
  tipo: 'GENERAL' | 'PARTICULAR';
  accion: 'PERMITIR' | 'BLOQUEAR';
  activa: boolean;
  mensaje_cumplimiento: string | null;
  mensaje_acuerdo: string | null;
  mensaje_desacuerdo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creado_por: string | null;
  fecha_creacion: string | null;
  modificado_por: string | null;
  fecha_modificacion: string | null;
  condiciones: ReglaCondicionDetalle[];
  entidades: ReglaEntidadDetalle[];
}

/** Response envelope from GET /api/reglas-negocio/{id} */
export interface ReglaDetalleResponse {
  success: boolean;
  message: string;
  data: ReglaDetalle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic success/error envelope
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiResponse {
  success: boolean;
  message: string;
}
