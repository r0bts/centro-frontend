/**
 * Modelos para Torneos, Partidos y Convocatorias
 * Tablas: torneos, partidos, convocatorias_partido
 */

export type TorneoEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
export type PartidoEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado' | 'suspendido';
export type ConvocatoriaEstado = 'convocado' | 'confirmado' | 'no_disponible' | 'baja';

export interface Torneo {
  id: number;
  club_id: number;
  actividad_id: number;
  nombre: string;
  descripcion?: string | null;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin?: string | null;
  lugar?: string | null;
  estado: TorneoEstado;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  club?: { id: number; nombre: string };
  actividad?: { id: number; nombre: string };
  partidos?: Partido[];
}

export interface Partido {
  id: number;
  torneo_id: number;
  equipo_local_id: number;
  equipo_visitante_id?: number | null;
  rival_nombre?: string | null;
  fecha_hora: string;   // ISO datetime
  lugar?: string | null;
  estado: PartidoEstado;
  goles_local?: number | null;
  goles_visitante?: number | null;
  observaciones?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  torneo?: { id: number; nombre: string };
  equipo_local?: { id: number; nombre: string };
  equipo_visitante?: { id: number; nombre: string };
  convocatoria?: ConvocatoriaPartido[];
}

export interface ConvocatoriaPartido {
  id: number;
  partido_id: number;
  alumno_id: number;
  estado: ConvocatoriaEstado;
  posicion?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  alumno?: { id: number; nombre: string; apellido: string; numero_camiseta?: string };
}

// ---- Response wrappers ----

export interface TorneoResponse {
  success: boolean;
  message: string;
  data: Torneo;
}

export interface TorneoListResponse {
  success: boolean;
  message: string;
  data: {
    torneos: Torneo[];
    total: number;
  };
}

export interface PartidoResponse {
  success: boolean;
  message: string;
  data: Partido;
}

export interface PartidoListResponse {
  success: boolean;
  message: string;
  data: {
    partidos: Partido[];
    total: number;
  };
}

export interface TorneoFormData {
  clubes: { id: number; nombre: string }[];
  actividades: { id: number; nombre: string }[];
  equipos: { id: number; nombre: string }[];
  estados: TorneoEstado[];
}
