/**
 * Modelos para Torneos, Jornadas, Inscripciones y Partidos
 * Sincronizado con la DB real — 2026-03-25
 * Tablas: torneos, jornadas, inscripciones_torneo, partidos
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TorneoFormato = 'escalera' | 'americano' | 'divisiones' | 'race';
export type JornadaEstado = 'pendiente' | 'en_curso' | 'finalizada';
export type PartidoEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado' | 'pospuesto';

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface Torneo {
  id: number;
  actividad_id?: number | null;
  nombre: string;
  descripcion?: string | null;
  formato: TorneoFormato;
  sede?: string | null;
  is_active: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  actividad?: { id: number; nombre: string };
  jornadas?: Jornada[];
  inscripciones?: Inscripcion[];
  partidos?: Partido[];
}

export interface Jornada {
  id: number;
  torneo_id: number;
  numero: number;
  nombre?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado: JornadaEstado;
  partidos?: Partido[];
  num_partidos?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Inscripcion {
  id: number;
  torneo_id: number;
  equipo_id?: number | null;
  alumno_id?: number | null;
  posicion_escalera?: number | null;
  puntos_totales: number;
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_perdidos: number;
  partidos_empatados: number;
  goles_favor: number;
  goles_contra: number;
  division: number;
  is_active: boolean;
  torneo_equipo_id?: number | null;
  torneo_equipo?: { id: number; nombre: string; color?: string | null };
  equipo?: { id: number; nombre: string };
  alumno?: { id: number; nombre: string; apellido: string };
}

export interface Partido {
  id: number;
  torneo_id: number;
  jornada_id?: number | null;
  equipo_local_id: number;
  rival_nombre: string;
  fecha: string;
  lugar?: string | null;
  url_ubicacion?: string | null;
  es_local: boolean;
  goles_local?: number | null;
  goles_visitante?: number | null;
  estado: PartidoEstado;
  motivo_cancelacion?: string | null;
  mensaje_coach?: string | null;
  habilitado_marcador: boolean;
  coach_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateTorneoRequest {
  nombre: string;
  descripcion?: string | null;
  formato: TorneoFormato;
  sede?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  is_active: boolean;
}

export type UpdateTorneoRequest = Partial<CreateTorneoRequest>;

// ─── Form Data ────────────────────────────────────────────────────────────────

export interface TorneoFormData {
  formatos: TorneoFormato[];
  torneos_equipos: { id: number; nombre: string; color?: string | null }[];
}

// ─── Response Wrappers ────────────────────────────────────────────────────────

export interface TorneoListResponse {
  success: boolean;
  message: string;
  data: { torneos: Torneo[]; total: number };
}

export interface TorneoResponse {
  success: boolean;
  message: string;
  data: Torneo;
}

export interface TorneoFormDataResponse {
  success: boolean;
  message: string;
  data: TorneoFormData;
}

export interface JornadaListResponse {
  success: boolean;
  message: string;
  data: { jornadas: Jornada[]; total: number };
}

export interface JornadaResponse {
  success: boolean;
  message: string;
  data: Jornada;
}

export interface InscripcionListResponse {
  success: boolean;
  message: string;
  data: {
    inscripciones: Inscripcion[];
    total: number;
    torneo: { id: number; nombre: string; formato: TorneoFormato };
  };
}

export interface InscripcionResponse {
  success: boolean;
  message: string;
  data: Inscripcion;
}

export interface GenerarJornadasResponse {
  success: boolean;
  message: string;
  data: { jornadas: Jornada[]; total: number };
}

// ─── Metadatos de formato (para UI) ──────────────────────────────────────────

export interface FormatoMeta {
  key: TorneoFormato;
  label: string;
  descripcion: string;
  icon: string;
  color: string;
  badgeClass: string;
}

export const FORMATO_META: Record<TorneoFormato, FormatoMeta> = {
  americano: {
    key: 'americano',
    label: 'Americano',
    descripcion: 'Todos contra todos — fechas de round-robin',
    icon: 'bi-trophy',
    color: '#0d6efd',
    badgeClass: 'bg-primary',
  },
  escalera: {
    key: 'escalera',
    label: 'Escalera',
    descripcion: 'Ranking por posición — el ganador sube, el perdedor baja',
    icon: 'bi-bar-chart-steps',
    color: '#ffc107',
    badgeClass: 'bg-warning text-dark',
  },
  divisiones: {
    key: 'divisiones',
    label: 'Divisiones',
    descripcion: 'Grupos por división con eliminatorias finales',
    icon: 'bi-diagram-3',
    color: '#198754',
    badgeClass: 'bg-success',
  },
  race: {
    key: 'race',
    label: 'Race',
    descripcion: 'Clasificación → Cuartos → Semifinal → Final',
    icon: 'bi-flag-fill',
    color: '#dc3545',
    badgeClass: 'bg-danger',
  },
};
