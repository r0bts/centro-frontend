// =============================================================================
// Modelos TypeScript — Módulo Horarios y Sustituciones Temporales
// =============================================================================

// ── Sustitución individual ───────────────────────────────────────────────────

export interface HorarioSustitucion {
  id: number;
  equipo_id: number;
  horario_id: number;
  fecha_inicio: string;   // 'YYYY-MM-DD'
  fecha_fin: string;      // 'YYYY-MM-DD'
  // Valores sustitutos (null = ese campo no cambia)
  coach_id_sustituto: number | null;
  area_id_sustituto: number | null;
  dia_semana_sustituto: number | null;   // 1=Lun … 7=Dom
  hora_inicio_sustituta: string | null;  // 'HH:MM:SS'
  hora_fin_sustituta: string | null;
  // Snapshots originales (para mostrar "vuelve a X")
  coach_id_original: number | null;
  area_id_original: number | null;
  dia_semana_original: number | null;
  hora_inicio_original: string | null;
  hora_fin_original: string | null;
  // Relaciones cargadas por el backend
  coach_sustituto?: { id: number; full_name: string };
  coach_original?: { id: number; full_name: string };
  area_sustituta?: { id: number; name: string };
  area_original?: { id: number; name: string };
  equipo?: { id: number; nombre: string };
  // Metadata
  motivo: string | null;
  status: 'activa' | 'vencida' | 'cancelada';
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

// ── Horario con valores efectivos (resultado del endpoint /grupos) ───────────

export interface HorarioEfectivo {
  horario_id: number;
  tiene_sustitucion: boolean;
  sustitucion_vigente: HorarioSustitucion | null;
  // Valores efectivos (sustituto si hay vigencia, original si no)
  coach_id_efectivo: number | null;
  coach_nombre_efectivo: string | null;
  area_id_efectiva: number | null;
  area_nombre_efectiva: string | null;
  dia_semana_efectivo: number;           // 1-7
  hora_inicio_efectiva: string;
  hora_fin_efectiva: string;
  // Valores base permanentes (para comparación en UI)
  coach_id_base: number | null;
  coach_nombre_base: string | null;
  area_id_base: number | null;
  area_nombre_base: string | null;
  dia_semana_base: number;
  hora_inicio_base: string;
  hora_fin_base: string;
  lugar_base: string | null;
}

export interface EquipoConHorarios {
  id: number;
  nombre: string;
  coach_id_base: number | null;
  coach_nombre_base: string | null;
  horarios: HorarioEfectivo[];
}

export interface GrupoConEquipos {
  id: number;
  nombre: string;
  edad_min: number | null;
  edad_max: number | null;
  cupo_maximo: number | null;
  cupo_ocupado: number;
  equipos: EquipoConHorarios[];
}

export interface ActividadConGrupos {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  tipo: string;
  grupos: GrupoConEquipos[];
}

// ── Respuestas de la API ─────────────────────────────────────────────────────

export interface GruposHorariosResponse {
  success: boolean;
  message: string;
  data: {
    fecha_consulta: string;
    total_actividades: number;
    actividades: ActividadConGrupos[];
  };
}

export interface SustitucionResponse {
  success: boolean;
  message: string;
  data: HorarioSustitucion;
}

export interface SustitucionesListResponse {
  success: boolean;
  message: string;
  data: {
    sustituciones: HorarioSustitucion[];
    total: number;
  };
}

export interface HorariosFormDataResponse {
  success: boolean;
  message: string;
  data: {
    instructores: { id: number; full_name: string; specialty: string | null }[];
    areas: { area_id: number; area_name: string; acceso_club_id: number }[];
    equipos: {
      equipo_id: number;
      equipo_nombre: string;
      grupo_nombre: string;
      actividad_nombre: string;
      horario_id: number;
      dia_semana: number;
      hora_inicio: string;
      hora_fin: string;
      area_id: number | null;
      area_nombre: string | null;
      coach_id: number | null;
      coach_nombre: string | null;
    }[];
  };
}

// ── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateSustitucionRequest {
  equipo_id: number;
  horario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  // Al menos uno de los siguientes debe ser no-null
  coach_id_sustituto?: number | null;
  area_id_sustituto?: number | null;
  dia_semana_sustituto?: number | null;
  hora_inicio_sustituta?: string | null;
  hora_fin_sustituta?: string | null;
  motivo?: string | null;
}

export interface UpdateSustitucionRequest extends Partial<CreateSustitucionRequest> {
  status?: 'activa' | 'cancelada';
}

// ── Constantes de UI ─────────────────────────────────────────────────────────

export const DIAS_SEMANA: { num: number; label: string; labelCorto: string }[] = [
  { num: 1, label: 'Lunes',     labelCorto: 'Lu' },
  { num: 2, label: 'Martes',    labelCorto: 'Ma' },
  { num: 3, label: 'Miércoles', labelCorto: 'Mi' },
  { num: 4, label: 'Jueves',    labelCorto: 'Ju' },
  { num: 5, label: 'Viernes',   labelCorto: 'Vi' },
  { num: 6, label: 'Sábado',    labelCorto: 'Sá' },
  { num: 7, label: 'Domingo',   labelCorto: 'Do' },
];
