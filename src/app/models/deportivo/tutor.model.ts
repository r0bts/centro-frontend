/**
 * Modelos para Tutores y relación Alumno-Tutor
 * Tablas: tutores, alumno_tutores
 */

export interface Tutor {
  id: number;
  club_id: number;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  telefono_alternativo?: string | null;
  ocupacion?: string | null;
  foto_url?: string | null;
  fcm_token?: string | null;
  activo: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  club?: { id: number; nombre: string };
  alumnos?: AlumnoTutor[];
}

export interface AlumnoTutor {
  id: number;
  alumno_id: number;
  tutor_id: number;
  parentesco: string;
  es_contacto_principal: boolean;
  puede_recoger: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  alumno?: { id: number; nombre: string; apellido: string };
  tutor?: { id: number; nombre: string; apellido: string };
}

// ---- Response wrappers ----

export interface TutorResponse {
  success: boolean;
  message: string;
  data: Tutor;
}

export interface TutorListResponse {
  success: boolean;
  message: string;
  data: {
    tutores: Tutor[];
    total: number;
  };
}

export interface TutorFormData {
  clubes: { id: number; nombre: string }[];
  parentescos: string[];
}
