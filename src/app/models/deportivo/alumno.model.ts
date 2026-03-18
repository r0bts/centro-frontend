/**
 * Modelos para Alumnos, Ficha Médica y Documentos
 * Tablas: alumnos, ficha_medica_alumno, documentos_alumno, equipo_alumnos
 */

export interface Alumno {
  id: number;
  club_id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  genero?: 'M' | 'F' | 'otro' | null;
  foto_url?: string | null;
  numero_socio?: string | null;
  activo: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  club?: { id: number; nombre: string };
  tutores?: AlumnoTutorInfo[];
  equipos?: EquipoAlumnoInfo[];
  ficha_medica?: FichaMedicaAlumno;
}

export interface AlumnoTutorInfo {
  id: number;
  tutor_id: number;
  parentesco: string;
  es_contacto_principal: boolean;
  tutor?: { id: number; nombre: string; apellido: string; telefono?: string };
}

export interface EquipoAlumnoInfo {
  id: number;
  equipo_id: number;
  numero_camiseta?: string | null;
  posicion?: string | null;
  activo: boolean;
  equipo?: { id: number; nombre: string };
}

export interface FichaMedicaAlumno {
  id?: number;
  alumno_id: number;
  tipo_sangre?: string | null;
  alergias?: string | null;
  condiciones_medicas?: string | null;
  medicamentos?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  medico_nombre?: string | null;
  medico_telefono?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentoAlumno {
  id: number;
  alumno_id: number;
  tipo: string;
  nombre_archivo: string;
  url_archivo: string;
  fecha_vencimiento?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---- Response wrappers ----

export interface AlumnoResponse {
  success: boolean;
  message: string;
  data: Alumno;
}

export interface AlumnoListResponse {
  success: boolean;
  message: string;
  data: {
    alumnos: Alumno[];
    total: number;
  };
}

export interface AlumnoFormData {
  clubes: { id: number; nombre: string }[];
  generos: string[];
  tipos_sangre: string[];
}
