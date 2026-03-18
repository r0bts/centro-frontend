/**
 * Modelos para Asistencias
 * Tabla: asistencias
 */

export type AsistenciaEstado = 'presente' | 'ausente' | 'justificado' | 'tardanza';

export interface Asistencia {
  id: number;
  equipo_id: number;
  alumno_id: number;
  fecha: string;        // YYYY-MM-DD
  hora_inicio?: string | null; // HH:MM
  estado: AsistenciaEstado;
  observaciones?: string | null;
  registrado_por?: number | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  equipo?: { id: number; nombre: string };
  alumno?: { id: number; nombre: string; apellido: string };
}

export interface AsistenciaBatch {
  equipo_id: number;
  fecha: string;
  hora_inicio?: string;
  registros: {
    alumno_id: number;
    estado: AsistenciaEstado;
    observaciones?: string;
  }[];
}

// ---- Response wrappers ----

export interface AsistenciaResponse {
  success: boolean;
  message: string;
  data: Asistencia;
}

export interface AsistenciaListResponse {
  success: boolean;
  message: string;
  data: {
    asistencias: Asistencia[];
    total: number;
    resumen?: {
      presentes: number;
      ausentes: number;
      justificados: number;
      tardanzas: number;
    };
  };
}

export interface AsistenciaFormData {
  equipos: { id: number; nombre: string }[];
  estados: AsistenciaEstado[];
}
