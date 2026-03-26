/**
 * Modelos para Equipos de Torneo e Integrantes
 * Sincronizado con la DB real — 2026-03-25
 * Tablas: torneos_equipos, torneo_integrantes
 */
import type { TorneoFormato } from './torneo.model';

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface TorneoEquipo {
  id: number;
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  num_integrantes: number;
  num_torneos: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Relación incluida en GET /{id}
  integrantes?: TorneoIntegrante[];
}

export interface TorneoIntegrante {
  id: number;
  torneo_equipo_id: number;
  socio_id: number;
  numero_jersey?: string | null;
  posicion?: string | null;
  es_capitan: boolean;
  is_active: boolean;
  created_at?: string;
  socio?: {
    id: number;
    entityid: string;
    membership_id: string;
    nombre: string;
    email: string;
  };
}

/** Resultado de búsqueda de socios con membresía activa */
export interface SocioSearch {
  id: number;
  entityid: string;
  membership_id: string;
  nombre: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  membresia_activa: boolean;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateEquipoRequest {
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  logo_url?: string | null;
  is_active: boolean;
}

export type UpdateEquipoRequest = Partial<CreateEquipoRequest>;

export interface AddIntegranteRequest {
  socio_id: number;
  numero_jersey?: string | null;
  posicion?: string | null;
  es_capitan?: boolean;
}

export interface EditIntegranteRequest {
  numero_jersey?: string | null;
  posicion?: string | null;
  es_capitan?: boolean;
}

// ─── Response Wrappers ────────────────────────────────────────────────────────

export interface EquipoListResponse {
  success: boolean;
  message: string;
  data: { equipos: TorneoEquipo[]; total: number };
}

export interface EquipoResponse {
  success: boolean;
  message: string;
  data: TorneoEquipo;
}

export interface IntegranteResponse {
  success: boolean;
  message: string;
  data: TorneoIntegrante;
}

export interface SocioSearchResponse {
  success: boolean;
  message: string;
  data: { socios: SocioSearch[]; total: number };
}

// ─── Torneos del equipo ───────────────────────────────────────────────────────

export interface EquipoTorneoInscripcion {
  inscripcion_id: number;
  torneo_id: number;
  posicion_escalera?: number | null;
  puntos_totales: number;
  torneo?: {
    id: number;
    nombre: string;
    formato: TorneoFormato;
    is_active: boolean;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  };
}

export interface EquipoTorneosResponse {
  success: boolean;
  message: string;
  data: { torneos: EquipoTorneoInscripcion[]; total: number };
}
