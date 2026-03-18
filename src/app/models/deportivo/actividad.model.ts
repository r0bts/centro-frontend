/**
 * Modelos para Actividades, Grupos, Equipos y Criterios de Evaluación
 * Tablas: actividades, grupos_categorias, equipos, criterios_evaluacion,
 *         coaches_equipo, horarios_entrenamiento
 */

export interface Actividad {
  id: number;
  club_id: number;
  nombre: string;
  descripcion?: string | null;
  tipo?: string | null;
  activa: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  club?: { id: number; nombre: string };
  grupos_categorias?: GrupoCategoria[];
  criterios_evaluacion?: CriterioEvaluacion[];
}

export interface GrupoCategoria {
  id: number;
  actividad_id: number;
  nombre: string;
  descripcion?: string | null;
  rango_edad_min?: number | null;
  rango_edad_max?: number | null;
  genero?: 'M' | 'F' | 'mixto' | null;
  activo: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  actividad?: { id: number; nombre: string };
  equipos?: Equipo[];
}

export interface Equipo {
  id: number;
  grupo_categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  temporada?: string | null;
  activo: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  grupo_categoria?: { id: number; nombre: string };
  coaches?: CoachEquipo[];
  horarios?: HorarioEntrenamiento[];
}

export interface CoachEquipo {
  id: number;
  equipo_id: number;
  user_id: number;
  rol: 'principal' | 'asistente' | 'auxiliar';
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  equipo?: { id: number; nombre: string };
  user?: { id: number; name: string };
}

export interface HorarioEntrenamiento {
  id: number;
  equipo_id: number;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  hora_inicio: string; // HH:MM
  hora_fin: string;    // HH:MM
  lugar?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CriterioEvaluacion {
  id: number;
  actividad_id: number;
  nombre: string;
  descripcion?: string | null;
  escala_min: number;
  escala_max: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

// ---- Response wrappers ----

export interface ActividadResponse {
  success: boolean;
  message: string;
  data: Actividad;
}

export interface ActividadListResponse {
  success: boolean;
  message: string;
  data: {
    actividades: Actividad[];
    total: number;
  };
}

export interface EquipoResponse {
  success: boolean;
  message: string;
  data: Equipo;
}

export interface EquipoListResponse {
  success: boolean;
  message: string;
  data: {
    equipos: Equipo[];
    total: number;
  };
}

export interface GrupoCategoriaListResponse {
  success: boolean;
  message: string;
  data: {
    grupos_categorias: GrupoCategoria[];
    total: number;
  };
}
