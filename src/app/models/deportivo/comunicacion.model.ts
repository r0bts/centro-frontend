/**
 * Modelos para Mensajes Coach, Encuestas, Eventos y Comunicados
 * Tablas: mensajes_coach, mensajes_coach_destinatarios, respuestas_tutor,
 *         encuestas, encuesta_preguntas, encuesta_opciones,
 *         encuesta_asignaciones, encuesta_respuestas,
 *         eventos, evento_confirmaciones,
 *         comunicados, comunicado_destinatarios, comunicado_firmas
 */

// ==================== Mensajes Coach ====================

export interface MensajeCoach {
  id: number;
  equipo_id: number;
  coach_id: number;
  asunto: string;
  cuerpo: string;
  tipo: 'individual' | 'grupal' | 'equipo';
  created_at?: string;
  updated_at?: string;
  // Relations
  equipo?: { id: number; nombre: string };
  coach?: { id: number; name: string };
  destinatarios?: MensajeCoachDestinatario[];
}

export interface MensajeCoachDestinatario {
  id: number;
  mensaje_id: number;
  tutor_id: number;
  leido: boolean;
  fecha_lectura?: string | null;
  created_at?: string;
  tutor?: { id: number; nombre: string; apellido: string };
}

export interface RespuestaTutor {
  id: number;
  mensaje_id: number;
  tutor_id: number;
  cuerpo: string;
  created_at?: string;
  tutor?: { id: number; nombre: string; apellido: string };
}

// ==================== Encuestas ====================

export type TipoPregunta = 'abierta' | 'opcion_multiple' | 'escala' | 'si_no';
export type EstadoEncuesta = 'borrador' | 'activa' | 'cerrada';

export interface Encuesta {
  id: number;
  club_id: number;
  creador_id: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado: EstadoEncuesta;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  preguntas?: EncuestaPregunta[];
  asignaciones?: EncuestaAsignacion[];
}

export interface EncuestaPregunta {
  id: number;
  encuesta_id: number;
  pregunta: string;
  tipo: TipoPregunta;
  obligatoria: boolean;
  orden: number;
  created_at?: string;
  updated_at?: string;
  opciones?: EncuestaOpcion[];
}

export interface EncuestaOpcion {
  id: number;
  pregunta_id: number;
  opcion: string;
  orden: number;
  created_at?: string;
}

export interface EncuestaAsignacion {
  id: number;
  encuesta_id: number;
  equipo_id?: number | null;
  tutor_id?: number | null;
  created_at?: string;
  equipo?: { id: number; nombre: string };
  tutor?: { id: number; nombre: string; apellido: string };
}

export interface EncuestaRespuesta {
  id: number;
  asignacion_id: number;
  pregunta_id: number;
  respuesta_texto?: string | null;
  opcion_id?: number | null;
  valor_escala?: number | null;
  created_at?: string;
}

// ==================== Eventos ====================

export type EventoEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';

export interface Evento {
  id: number;
  club_id: number;
  creador_id: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  lugar?: string | null;
  estado: EventoEstado;
  requiere_confirmacion: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  confirmaciones?: EventoConfirmacion[];
}

export interface EventoConfirmacion {
  id: number;
  evento_id: number;
  tutor_id: number;
  alumno_id?: number | null;
  estado: 'pendiente' | 'confirmado' | 'rechazado';
  fecha_respuesta?: string | null;
  comentario?: string | null;
  created_at?: string;
  updated_at?: string;
  tutor?: { id: number; nombre: string; apellido: string };
  alumno?: { id: number; nombre: string; apellido: string };
}

// ==================== Comunicados ====================

export interface Comunicado {
  id: number;
  club_id: number;
  creador_id: number;
  titulo: string;
  cuerpo: string;
  requiere_firma: boolean;
  fecha_limite_firma?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  destinatarios?: ComunicadoDestinatario[];
  firmas?: ComunicadoFirma[];
}

export interface ComunicadoDestinatario {
  id: number;
  comunicado_id: number;
  tipo: 'equipo' | 'tutor' | 'todos';
  equipo_id?: number | null;
  tutor_id?: number | null;
  created_at?: string;
  equipo?: { id: number; nombre: string };
  tutor?: { id: number; nombre: string; apellido: string };
}

export interface ComunicadoFirma {
  id: number;
  comunicado_id: number;
  tutor_id: number;
  leido: boolean;
  fecha_lectura?: string | null;
  firmado: boolean;
  fecha_firma?: string | null;
  created_at?: string;
  updated_at?: string;
  tutor?: { id: number; nombre: string; apellido: string };
}

// ---- Response wrappers ----

export interface EncuestaListResponse {
  success: boolean;
  message: string;
  data: { encuestas: Encuesta[]; total: number };
}

export interface EventoListResponse {
  success: boolean;
  message: string;
  data: { eventos: Evento[]; total: number };
}

export interface ComunicadoListResponse {
  success: boolean;
  message: string;
  data: { comunicados: Comunicado[]; total: number };
}

export interface MensajeCoachListResponse {
  success: boolean;
  message: string;
  data: { mensajes: MensajeCoach[]; total: number };
}
