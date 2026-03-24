/**
 * Modelos para Actividades, Grupos, Equipos y Criterios de Evaluación
 * Tablas: actividades, grupos_categorias, equipos, criterios_evaluacion,
 *         coaches_equipo, horarios_entrenamiento
 *
 * Campos confirmados con DESCRIBE de la DB real (2026-03-23).
 */

// =====================================================================
// ENTIDADES
// =====================================================================

export interface Actividad {
  id: number;
  club_id: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;           // emoji o código, varchar(100)
  color?: string | null;           // hex #RRGGBB, varchar(7)
  tipo?: string | null;            // deporte_equipo | deporte_individual | arte | otro
  modo_mensajeria: 'bidireccional' | 'solo_respuesta' | 'solo_lectura';
  is_active: boolean;
  created_by?: number;
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
  edad_min?: number | null;        // tinyint(3)
  edad_max?: number | null;        // tinyint(3)
  orden: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  actividad?: { id: number; nombre: string };
  equipos?: Equipo[];
}

export interface Equipo {
  id: number;
  grupo_id: number;                // FK → grupos_categorias.id
  nombre: string;
  color?: string | null;           // hex #RRGGBB, varchar(7)
  coach_id?: number | null;        // FK → users.id
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  grupo?: { id: number; nombre: string };
  horarios?: HorarioEntrenamiento[];
}

export interface CoachEquipo {
  id: number;
  equipo_id: number;
  user_id: number;
  rol: 'principal' | 'auxiliar';  // ENUM en DB — no existe 'asistente'
  created_at?: string;
  // Relations
  equipo?: { id: number; nombre: string };
  user?: { id: number; name: string };
}

export interface HorarioEntrenamiento {
  id: number;
  equipo_id: number;
  dia_semana: number;              // tinyint(1): 1=lunes … 7=domingo
  hora_inicio: string;             // HH:MM:SS
  hora_fin: string;                // HH:MM:SS
  lugar?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CriterioEvaluacion {
  id: number;
  actividad_id: number;
  nombre: string;
  descripcion?: string | null;
  escala_min: number;              // tinyint(1), default 1
  escala_max: number;              // tinyint(1), default 5
  orden: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// =====================================================================
// FORM DATA (GET /form-data)
// =====================================================================

export interface ActividadFormData {
  clubes: { id: number; nombre: string }[];
  tipos: string[];
}

// =====================================================================
// REQUEST PAYLOADS
// =====================================================================

export interface CreateActividadRequest {
  club_id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  tipo?: string;
  modo_mensajeria: 'bidireccional' | 'solo_respuesta' | 'solo_lectura';
  is_active: boolean;
  created_by: number;
}

export interface UpdateActividadRequest {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  tipo?: string;
  modo_mensajeria?: 'bidireccional' | 'solo_respuesta' | 'solo_lectura';
  is_active?: boolean;
}

export interface CreateGrupoRequest {
  actividad_id: number;
  nombre: string;
  descripcion?: string;
  edad_min?: number;
  edad_max?: number;
  orden?: number;
  is_active?: boolean;
}

export interface CreateEquipoRequest {
  grupo_id: number;
  nombre: string;
  color?: string;
  coach_id?: number;
  is_active?: boolean;
}

export interface CreateCriterioRequest {
  actividad_id: number;
  nombre: string;
  descripcion?: string;
  escala_min?: number;
  escala_max?: number;
  orden?: number;
  is_active?: boolean;
}

export interface CreateHorarioRequest {
  dia_semana: number;              // 1–7
  hora_inicio: string;             // HH:MM
  hora_fin: string;                // HH:MM
  lugar?: string;
  is_active?: boolean;
}

// =====================================================================
// RESPONSE WRAPPERS
// =====================================================================

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

export interface ActividadFormDataResponse {
  success: boolean;
  message: string;
  data: ActividadFormData;
}

export interface GrupoCategoriaResponse {
  success: boolean;
  message: string;
  data: GrupoCategoria;
}

export interface GrupoCategoriaListResponse {
  success: boolean;
  message: string;
  data: {
    grupos_categorias: GrupoCategoria[];
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

export interface CriterioResponse {
  success: boolean;
  message: string;
  data: CriterioEvaluacion;
}

export interface HorarioResponse {
  success: boolean;
  message: string;
  data: HorarioEntrenamiento;
}

// Helper: wizard state
export interface WizardGrupo {
  nombre: string;
  descripcion: string;
  edad_min: number | null;
  edad_max: number | null;
  equipos: WizardEquipo[];
  horarios: WizardHorario[];
}

export interface WizardEquipo {
  nombre: string;
  color: string;
  coach_id: number | null;
}

export interface WizardHorario {
  dia_semana: number;              // 1–7
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
}

export interface WizardCriterio {
  nombre: string;
  descripcion: string;
  escala_min: number;
  escala_max: number;
}
