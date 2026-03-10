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
// Generic success/error envelope
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiResponse {
  success: boolean;
  message: string;
}
