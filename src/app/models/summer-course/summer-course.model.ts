/**
 * Modelos para el módulo Curso de Verano (summer_course)
 * Tablas: sc_courses, sc_weeks, sc_costs, sc_participants,
 *         sc_enrollments, sc_enrollment_weeks,
 *         sc_activities, sc_activity_levels, sc_activity_instructors
 *
 * Confirmado con pruebas de endpoints reales (Abril 2026).
 */

// =====================================================================
// ENTIDADES PRINCIPALES
// =====================================================================

export interface ScCourse {
  id: number;
  name: string;
  start_date: string;           // DATE YYYY-MM-DD
  end_date: string;             // DATE YYYY-MM-DD
  status: 'setup' | 'active' | 'closed';
  acceso_club_id?: number | null;
  max_spots: number | null;
  description?: string | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  sc_weeks?: ScWeek[];
  sc_costs?: ScCost[];
  enrollment_count?: number;
}

export interface ScWeek {
  id: number;
  course_id: number;
  week_number: number;
  label: string;                // "Semana 1", "Semana 2", etc.
  start_date: string;           // DATE YYYY-MM-DD
  end_date: string;             // DATE YYYY-MM-DD
  sort_order: number;
}

export interface ScCost {
  id: number;
  course_id?: number;
  participant_type: 'member' | 'guest' | 'staff' | 'staff_guest';
  cost_per_week: number;
  created_at?: string;
}

export interface ScParticipant {
  id: number;
  detalle_membresia_id?: number | null;
  socio_id?: number | null;
  first_name: string;
  last_name: string;
  birth_date: string;           // DATE YYYY-MM-DD
  participant_type?: string;
  created_by?: number;
  created_at?: string;
  // Computed / relations
  full_name?: string;
  age?: number;
}

export interface ScEnrollment {
  id: number;
  participant_id: number;
  course_id: number;
  participant_type: 'member' | 'guest' | 'staff' | 'staff_guest';
  suggested_level?: number | null;    // integer 1-8
  assigned_level?: number | null;     // integer 1-8
  level_notes?: string | null;
  enrollment_date: string;            // DATE YYYY-MM-DD
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  sc_participant?: ScParticipant;
  sc_course?: ScCourse;
  sc_enrollment_weeks?: ScEnrollmentWeek[];
}

export interface ScEnrollmentWeek {
  id: number;
  enrollment_id: number;
  week_id: number;
  amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
}

export interface ScActivity {
  id: number;
  course_id: number;
  week_id: number;
  name: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  start_time: string;           // HH:MM:SS
  end_time: string;             // HH:MM:SS
  location?: string | null;
  notes?: string | null;
  created_by?: number;
  created_at?: string;
  // Relations
  sc_activity_levels?: ScActivityLevel[];
  sc_activity_instructors?: ScActivityInstructor[];
}

export interface ScActivityLevel {
  id: number;
  activity_id: number;
  level: number;                // 1-8
}

export interface ScActivityInstructor {
  id: number;
  activity_id: number;
  user_id: number;
  user?: ScInstructor;
}

export interface ScInstructor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialty?: string | null;
  is_instructor: boolean;
  created_at?: string;
  // Computed
  full_name?: string;
  initials?: string;            // 2 letras para avatar
}

// =====================================================================
// SCHEDULE EDITOR
// =====================================================================

/**
 * Entrada en una celda del horario (day × slot × level)
 * Un chip en la grilla.
 */
export interface ScScheduleEntry {
  id: string;                   // id de actividad del catálogo SC_ACTIVITIES (e.g. 'natacion')
  name: string;
  instructorId: number | null;
  dbId?: number;                // sc_activities.id una vez guardado en DB
}

/**
 * Estructura completa del horario:
 * scheduleData[dayIdx][slotId] = ScScheduleEntry[]
 *
 * dayIdx: 0=Lunes … 4=Viernes
 * slotId: 'b1' | 'b2' | 'b3' | 'b4'
 *
 * Cada entrada puede tener múltiples niveles (levels[]).
 * Formato de la API (GET /activities/schedule):
 * schedule[dayIdx][slotId] = [{id, name, levels:number[], instructorId}]
 */
export type ScScheduleData = Array<Record<string, ScScheduleApiEntry[]>>;

export interface ScScheduleApiEntry {
  id: number;                   // sc_activities.id (DB id)
  name: string;
  levels: number[];             // array de niveles (1-8)
  instructorId: number | null;
}

/**
 * Datos del horario para guardar (POST /activities/schedule).
 * schedule[dayIdx][slotId][levelNum] = [{name, instructorId}]
 */
export interface ScScheduleSavePayload {
  week_id: number;
  course_id: number;
  schedule: Record<string, Record<string, Record<string, Array<{ name: string; instructorId: number | null }>>>>;
}

// =====================================================================
// CONSTANTES DE TIPOS
// =====================================================================

export const SC_COURSE_STATUSES: { value: ScCourse['status']; label: string }[] = [
  { value: 'setup',  label: 'Configuración' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' },
];

export const SC_PARTICIPANT_TYPES: { value: ScCost['participant_type']; label: string }[] = [
  { value: 'member',      label: 'Socio' },
  { value: 'guest',       label: 'Invitado' },
  { value: 'staff',       label: 'Staff' },
  { value: 'staff_guest', label: 'Familiar staff' },
];

export const SC_PAYMENT_STATUSES: { value: ScEnrollment['payment_status']; label: string; color: string }[] = [
  { value: 'pending',   label: 'Pendiente',  color: 'warning' },
  { value: 'paid',      label: 'Pagado',     color: 'success' },
  { value: 'partial',   label: 'Parcial',    color: 'info'    },
  { value: 'cancelled', label: 'Cancelado',  color: 'danger'  },
];

export const SC_LEVEL_LABELS: Record<number, { roman: string; age: string }> = {
  1: { roman: 'I',    age: '3 años'     },
  2: { roman: 'II',   age: '4 años'     },
  3: { roman: 'III',  age: '5 años'     },
  4: { roman: 'IV',   age: '6 años'     },
  5: { roman: 'V',    age: '7 años'     },
  6: { roman: 'VI',   age: '8-9 años'   },
  7: { roman: 'VII',  age: '10-12 años' },
  8: { roman: 'VIII', age: '13+ años'   },
};

// =====================================================================
// REQUEST / RESPONSE WRAPPERS
// =====================================================================

// ── Courses ─────────────────────────────────────────────────────────

export interface ScCourseFormDataResponse {
  success: boolean;
  data: { 
    statuses: string[];
    acceso_clubes: { id: number; name: string }[];
  };
}

export interface ScCourseListResponse {
  success: boolean;
  data: { courses: ScCourse[]; total: number };
}

export interface ScCourseResponse {
  success: boolean;
  data: ScCourse;
}

export interface CreateScCourseRequest {
  name: string;
  start_date: string;
  end_date: string;
  status?: ScCourse['status'];
  acceso_club_id?: number | null;
  description?: string | null;
  weeks_count?: number;         // auto-generate N semanas
  costs?: Array<{ participant_type: ScCost['participant_type']; cost_per_week: number }>;
}

export interface UpdateScCourseRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: ScCourse['status'];
  acceso_club_id?: number | null;
  description?: string | null;
  costs?: Array<{ participant_type: ScCost['participant_type']; cost_per_week: number }>;
}

// ── Activities ──────────────────────────────────────────────────────
export interface ScCatalogLevel {
  id: number;
  level_number: number;
  roman: string;
  age_label: string;
  sort_order: number;
}

export interface ScCatalogActivityType {
  id: string;             // 'natacion', 'futbol', etc.
  label: string;
  emoji: string;
  category_id: string;    // 'aquatic', 'sports', etc.
  cat: string;            // alias for category_id (used by palette/grid)
  color: string;
  bg: string;
}

export interface ScCatalogCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface ScCatalogResponse {
  success: boolean;
  data: {
    levels: ScCatalogLevel[];
    activity_types: ScCatalogActivityType[];
    categories: ScCatalogCategory[];
  };
}
export interface ScActivityFormDataResponse {
  success: boolean;
  data: {
    courses: Array<{ id: number; name: string; weeks?: Array<{ id: number; label: string }> }>;
    days: Array<{ value: string; label: string }>;
    instructors: ScInstructor[];
  };
}

export interface ScActivityListResponse {
  success: boolean;
  data: { activities: ScActivity[] };
}

export interface ScActivityResponse {
  success: boolean;
  data: ScActivity;
}

export interface ScScheduleResponse {
  success: boolean;
  data: { week_id: number; schedule: ScScheduleData };
}

export interface CreateScActivityRequest {
  course_id: number;
  week_id: number;
  name: string;
  day_of_week: ScActivity['day_of_week'];
  start_time: string;
  end_time: string;
  location?: string | null;
  notes?: string | null;
  levels?: number[];
  instructor_ids?: number[];
}

// ── Enrollments ─────────────────────────────────────────────────────

export interface ScEnrollmentFormDataResponse {
  success: boolean;
  data: {
    courses: Array<{ id: number; name: string; weeks?: any[] }>;
    payment_statuses: string[];
    participant_types: string[];
  };
}

export interface ScEnrollmentListResponse {
  success: boolean;
  data: { enrollments: ScEnrollment[]; total: number };
}

export interface ScEnrollmentResponse {
  success: boolean;
  data: ScEnrollment;
}

export interface CreateScEnrollmentRequest {
  participant_id: number;
  course_id: number;
  participant_type: ScCost['participant_type'];
  suggested_level?: number | null;
  enrollment_date: string;
  week_ids?: number[];
}

export interface UpdateScEnrollmentRequest {
  participant_type?: ScCost['participant_type'];
  suggested_level?: number | null;
  payment_status?: ScEnrollment['payment_status'];
  level_notes?: string | null;
}

export interface AssignLevelRequest {
  assigned_level: number;
  level_notes?: string;
}

// ── Instructors ─────────────────────────────────────────────────────

export interface ScInstructorListResponse {
  success: boolean;
  data: { instructors: ScInstructor[] };
}

export interface ScInstructorResponse {
  success: boolean;
  data: ScInstructor;
}

export interface CreateScInstructorRequest {
  first_name: string;
  last_name: string;
  email: string;
  specialty?: string | null;
}

export interface UpdateScInstructorRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  specialty?: string | null;
}
