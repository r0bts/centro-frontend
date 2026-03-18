/**
 * Modelos para Evaluaciones y Criterios
 * Tablas: evaluaciones, evaluacion_criterios
 */

export interface Evaluacion {
  id: number;
  equipo_id: number;
  alumno_id: number;
  coach_id: number;
  fecha: string;        // YYYY-MM-DD
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  equipo?: { id: number; nombre: string };
  alumno?: { id: number; nombre: string; apellido: string };
  coach?: { id: number; name: string };
  criterios?: EvaluacionCriterio[];
}

export interface EvaluacionCriterio {
  id: number;
  evaluacion_id: number;
  criterio_id: number;
  puntaje: number;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  criterio?: { id: number; nombre: string; escala_min: number; escala_max: number };
}

export interface EvaluacionConCriterios {
  evaluacion: Omit<Evaluacion, 'criterios'>;
  criterios: {
    criterio_id: number;
    puntaje: number;
    observaciones?: string;
  }[];
}

// ---- Response wrappers ----

export interface EvaluacionResponse {
  success: boolean;
  message: string;
  data: Evaluacion;
}

export interface EvaluacionListResponse {
  success: boolean;
  message: string;
  data: {
    evaluaciones: Evaluacion[];
    total: number;
  };
}

export interface EvaluacionFormData {
  equipos: { id: number; nombre: string }[];
  alumnos: { id: number; nombre: string; apellido: string }[];
  criterios: { id: number; nombre: string; escala_min: number; escala_max: number }[];
}
