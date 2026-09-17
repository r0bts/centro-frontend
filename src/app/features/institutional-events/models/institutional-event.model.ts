/**
 * Modelos del Módulo de Eventos Institucionales (MVP)
 * Sincronizado con el schema real — docs/Events/12-EVENTOS-MVP-SCHEMA.sql
 * Tablas: institutional_events, institutional_event_subevents,
 *         institutional_event_attendees, institutional_event_attendee_subevents
 *
 * NO usar los modelos de docs/Events/08-MODULO-EVENTOS.md (OBSOLETO, prefijo `events`).
 */

// ─── Tipos (enums reales de la DB) ─────────────────────────────────────────────

export type EventType = 'academic' | 'sports' | 'cultural' | 'social' | 'religious' | 'political' | 'other';
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'closed' | 'cancelled';
export type AccessType = 'public' | 'members' | 'patron' | 'committee' | 'registration';

/** Tipo de acceso cargado desde el API /api/event-access-types */
export interface EventAccessType {
  id:                    AccessType;
  label:                 string;
  description:           string;
  condition_ids:         number[] | null;
  requires_membership:   boolean;
  requires_registration: boolean;
}

export type ColorTheme = 'classic' | 'gold' | 'sports' | 'cultural' | 'modern';

/** Tema de color cargado desde el API /api/event-color-themes */
export interface EventColorTheme {
  id:            ColorTheme;
  name:          string;
  description:   string;
  color_primary: string;
  color_accent:  string;
  color_bg:      string;
  color_text:    string;
}
export type EventModality = 'presencial' | 'virtual' | 'hibrido';
export type SubeventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type AttendeeType = 'socio' | 'invitado' | 'staff' | 'externo';
export type AttendeeStatus = 'confirmed' | 'pending' | 'cancelled';
export type AttendanceStatus = 'pending' | 'present' | 'absent';
export type PaymentStatus = 'free' | 'pending' | 'paid' | 'cancelled';
export type RegistrationChannel = 'public_self' | 'public_by_socio' | 'admin_manual';

// ─── Metadatos de UI (labels/íconos/colores) ───────────────────────────────────

export const EVENT_TYPE_META: Record<EventType, { label: string; icon: string; badgeClass: string; gradient: string }> = {
  academic:   { label: 'Académico',  icon: 'bi-mortarboard-fill',   badgeClass: 'bg-primary-subtle text-primary-emphasis border-primary-subtle',     gradient: 'linear-gradient(135deg,#406eba,#1d3d79)' },
  sports:     { label: 'Deportivo',  icon: 'bi-trophy-fill',        badgeClass: 'bg-success-subtle text-success-emphasis border-success-subtle',     gradient: 'linear-gradient(135deg,#87700b,#b39716)' },
  cultural:   { label: 'Cultural',   icon: 'bi-music-note-beamed',  badgeClass: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle', gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  social:     { label: 'Social',     icon: 'bi-people-fill',        badgeClass: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle', gradient: 'linear-gradient(135deg,#4caf50,#1b5e20)' },
  religious:  { label: 'Religioso',  icon: 'bi-moon-stars-fill',    badgeClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',      gradient: 'linear-gradient(135deg,#c9a227,#7a5c00)' },
  political:  { label: 'Político',   icon: 'bi-bank2',              badgeClass: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',         gradient: 'linear-gradient(135deg,#e53935,#7f0000)' },
  other:      { label: 'Otro',       icon: 'bi-calendar-event',     badgeClass: 'bg-light text-dark border-secondary-subtle',                          gradient: 'linear-gradient(135deg,#6c757d,#495057)' },
};

export const EVENT_STATUS_META: Record<EventStatus, { label: string; badgeClass: string }> = {
  draft: { label: 'Borrador', badgeClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle' },
  published: { label: 'Publicado', badgeClass: 'bg-success-subtle text-success-emphasis border-success-subtle' },
  ongoing: { label: 'En curso', badgeClass: 'bg-info-subtle text-info-emphasis border-info-subtle' },
  closed: { label: 'Cerrado', badgeClass: 'bg-danger-subtle text-danger-emphasis border-danger-subtle' },
  cancelled: { label: 'Cancelado', badgeClass: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle' },
};

export const ACCESS_TYPE_META: Record<AccessType, { label: string; icon: string; desc: string }> = {
  public:       { label: 'Público en general', icon: 'bi-globe2',                desc: 'Cualquier persona, incluyendo externos al club' },
  members:      { label: 'Socios Activos',      icon: 'bi-person-badge-fill',    desc: 'Solo socios con membresía Socio Activo vigente' },
  patron:       { label: 'Asociados Patrono',   icon: 'bi-star-fill',            desc: 'Patrono, Patrono Vitalicio y Benefactor' },
  committee:    { label: 'Comité',               icon: 'bi-shield-lock-fill',     desc: 'Uso interno, solo personal autorizado' },
  registration: { label: 'Con registro previo', icon: 'bi-clipboard-check-fill', desc: 'Requiere registro aunque sea público' },
};

export const SUBEVENT_STATUS_META: Record<SubeventStatus, { label: string; badgeClass: string }> = {
  confirmed: { label: 'Confirmado', badgeClass: 'bg-success-subtle text-success-emphasis border-success-subtle' },
  tentative: { label: 'Por confirmar', badgeClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle' },
  cancelled: { label: 'Cancelado', badgeClass: 'bg-danger-subtle text-danger-emphasis border-danger-subtle' },
};

// ─── Entidades ──────────────────────────────────────────────────────────────────

export interface InstitutionalEventSubevent {
  id?: number;
  event_id?: number;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  venue?: string | null;
  area_id?: number | null;
  area?: { id: number; name: string } | null;
  max_capacity: number;
  current_attendee_count?: number;
  cost?: number | null;
  /**
   * ID del ítem NetSuite específico del subevento.
   * Si es `null`/`undefined`, el backend hereda `ns_item_id` del evento padre
   * al construir la Sales Order. El modal del formulario lo prellena con el
   * valor del evento cuando `cost > 0`. Ver docs/Events/15-SUBEVENTOS-NS-ITEM-ID.md.
   */
  ns_item_id?: number | null;
  /**
   * FK a `sale_types.id` (customlist_cl_tipo_venta NS) para este subevento.
   * `null` = hereda del `sale_type_id` del evento padre; si el evento tampoco
   * lo tiene, cae al default global (id 6 = curso de verano). Se propaga como
   * `custbody_cl_tipo_venta` al generar la Sales Order.
   */
  sale_type_id?: number | null;
  sale_type?: SaleType | null;
  /**
   * Activa la matriz de precios por `access_type` en el subevento.
   * Cuando es `true`, el `cost` del subevento se resuelve desde
   * `institutional_event_prices` según el `access_type_selected` del asistente.
   * En opción C (mapa 15 §7.3): la ausencia de fila para un `access_type`
   * significa que el subevento NO está habilitado para ese tipo.
   */
  has_matrix_pricing?: boolean;
  /** Filas de la matriz de precios del subevento (una por `access_type` habilitado). */
  institutional_event_prices?: InstitutionalEventPrice[];
  /**
   * @deprecated Usar `access_types[]` múltiple. Se conserva 1-2 iteraciones
   * para retro-compat con eventos históricos (mapa 15 §8). El backend lo
   * mantiene sincronizado con el primer elemento de `access_types[]`.
   */
  access_type?: AccessType | null;
  /**
   * Tipos de acceso habilitados en el subevento (múltiple, propio, no heredado
   * del evento contenedor). Subset estricto de `event.access_types[]`.
   */
  access_types: AccessType[];
  instructor_name?:  string | null;
  instructor_phone?: string | null;
  instructor_email?: string | null;
  instructor_notes?: string | null;
  status: SubeventStatus;
  created_at?: string;
  updated_at?: string;
}

export interface InstitutionalEventDocument {
  name: string;
  url: string;
}

/**
 * Precio para un `access_type` específico de un evento o subevento (matriz
 * de precios de la iteración del mapa 15 §7).
 *
 *  - `subevent_id === null`  → fila del evento base para ese `access_type`.
 *  - `subevent_id !== null`  → fila de un subevento específico.
 *
 * El `ns_item_id` NO se almacena aquí: sigue siendo único por (evento|subevento).
 */
export interface InstitutionalEventPrice {
  id?: number;
  event_id?: number;
  subevent_id?: number | null;
  access_type: AccessType;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

export interface InstitutionalEventFaq {
  question: string;
  answer: string;
}

export interface InstitutionalEventSpeaker {
  name: string;
  role: string;
  bio?: string | null;
  photo_url?: string | null;
}

export interface InstitutionalEventTestimonial {
  name: string;
  role: string;
  quote: string;
  stars?: number | null;
}

/** Material post-evento: galería, métricas logradas, resumen narrativo. */
export interface PostEventMetric {
  value: string;
  label: string;
  prefix?: string;
}

export interface PostEventGalleryItem {
  url: string;
  caption?: string;
}

export interface PostEventData {
  gallery?: PostEventGalleryItem[];
  metrics?: PostEventMetric[];
  summary?: string;
}

/** Datos extendidos de contacto, redes sociales e indicadores para la Landing. */
export interface EventIndicator {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
}

export interface EventAlly {
  id: string; // uuid o identificador local temporal
  name: string;
  url?: string;
  logo_url?: string;
}

export interface EventExtraData {
  contact_person?: string;
  contact_schedule?: string;
  maps_url?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_twitter?: string;
  social_tiktok?: string;
  indicators?: EventIndicator[];
  allies?: EventAlly[] | string[];
  allies_header?: string;
  banner_mobile_url?: string;
  cover_image_url?: string;
  donation_legend?: string;
  donation_frequencies?: string[];
  color_theme?: ColorTheme;
}

export interface InstitutionalEvent {
  id: number;
  location_id: number;
  location?: { id: number; name: string } | null;
  area_id?: number | null;
  area?: { id: number; name: string } | null;
  place_id?: number | null;
  place?: EventPlace | null;
  name: string;
  kicker?: string | null;
  event_type: EventType;
  color_theme?: ColorTheme;
  description?: string | null;
  banner_image_url?: string | null;
  start_date: string;
  end_date?: string | null;
  all_day: boolean;
  venue?: string | null;
  event_modality: EventModality;
  stream_url?: string | null;
  doors_open_time?: string | null;
  access_types: AccessType[];
  has_registration: boolean;
  max_capacity?: number | null;
  current_attendee_count: number;
  has_cost: boolean;
  cost?: number | null;
  ns_item_id?: number | null;
  /**
   * FK a `sale_types.id` (customlist_cl_tipo_venta de NS). El backend lo
   * propaga como `custbody_cl_tipo_venta` al generar la Sales Order.
   * `null` = usa el default hardcodeado del servicio (id 6 = curso de verano).
   */
  sale_type_id?: number | null;
  sale_type?: SaleType | null;
  /**
   * Activa la matriz de precios por `access_type` en el evento base.
   * Cuando es `true`, el precio del evento se resuelve desde
   * `institutional_event_prices` según el `access_type_selected` del asistente;
   * si falta la fila para su tipo, se cae al `cost` plano (fallback, mapa 15 §7.9).
   */
  has_matrix_pricing?: boolean;
  /** Filas de la matriz de precios del evento base (una por `access_type`). */
  institutional_event_prices?: InstitutionalEventPrice[];
  has_donations: boolean;
  donation_amounts?: number[] | null;
  documents?: InstitutionalEventDocument[] | null;
  faqs?: InstitutionalEventFaq[] | null;
  speakers?: InstitutionalEventSpeaker[] | null;
  testimonials?: InstitutionalEventTestimonial[] | null;
  post_event_data?: PostEventData | null;
  extra_data?: EventExtraData | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status: EventStatus;
  published_at?: string | null;
  closed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
  institutional_event_subevents?: InstitutionalEventSubevent[];
}

export interface InstitutionalEventAttendee {
  id: number;
  event_id: number;
  attendee_type: AttendeeType;
  socio_id?: number | null;
  host_socio_id?: number | null;
  relationship_id?: number | null;
  relationship_other_label?: string | null;
  staff_role?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  access_type_selected?: AccessType | null;
  registration_channel: RegistrationChannel;
  status: AttendeeStatus;
  notes?: string | null;
  // Pago y NetSuite
  payment_status?: PaymentStatus | null;
  amount_paid?: number | null;
  titular_id?: number | null;
  ns_sales_order_id?: number | null;
  ns_so_status?: string | null;
  ns_so_sync_error?: string | null;
  ns_so_synced_at?: string | null;
  // Check-in evento
  attendance_status?: AttendanceStatus;
  checked_in_at?: string | null;
  checked_in_by?: number | null;
  created_at: string;
  updated_at: string;
}

/** Miembro de un grupo familiar (viene dentro de EventSocioSearchResult.family). */
export interface FamilyMember {
  id: number;
  entityid: string;
  fullname: string;
  email: string | null;
  phone: string | null;
  parentesco: string;    // 'Titular', 'Esposo(a)', 'Hijo(a)', etc.
  is_titular: boolean;
}

/** Miembro en el wizard v2 con estado de selección y costos calculados. */
export interface PendingMember {
  socio_id: number;
  entityid: string;
  fullname: string;
  parentesco: string;
  is_titular: boolean;
  selected: boolean;
  alreadyEnrolled: boolean;
  selectedSubeventIds: number[];
  baseCost: number;
  subeventsCost: number;
  totalCost: number;
  /**
   * Tipo de acceso con el que se inscribe este miembro (fase 2 mapa 15 §9.3 P3).
   * Determina qué fila de la matriz de precios aplica al calcular `baseCost` y
   * `subeventsCost` para esta persona.
   */
  access_type_selected: AccessType;
}

/** Resultado de búsqueda de socio para el wizard de inscripción. */
export interface EventSocioSearchResult {
  id: number;
  entityid: string;
  fullname: string;
  email: string | null;
  phone: string | null;
  membership_id: string | null;
  /** socios.id del titular del grupo familiar (null si el socio ES el titular) */
  titular_id: number | null;
  /** fullname del titular, para mostrar en el wizard bajo "SO a nombre de:" */
  titular_name: string | null;
  /** Grupo familiar completo (todos los socios con la misma membership_id). */
  family: FamilyMember[];
}

/** Payload para POST /api/institutional-events/:id/attendees (inscripción de socio). */
export interface AddAttendeePayload {
  attendee_type: 'socio';
  socio_id: number;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  access_type_selected: AccessType;
  subevent_ids?: number[];
  registration_channel: 'admin_manual';
  notes?: string | null;
}

// ─── Respuestas de la API ───────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

export type EventListResponse = ApiResponse<{ events: InstitutionalEvent[]; pagination: Pagination }>;
export type EventResponse = ApiResponse<{ event: InstitutionalEvent }>;
export type AttendeeListResponse = ApiResponse<{ attendees: InstitutionalEventAttendee[] }>;
export type AttendeeResponse = ApiResponse<{ attendee: InstitutionalEventAttendee }>;

export interface EventListFilters {
  page?: number;
  limit?: number;
  status?: EventStatus;
  event_type?: EventType;
  location_id?: number;
}

/** Ubicación / sede real donde puede realizarse un evento (catálogo `locations`). */
export interface EventLocation {
  id: number;
  name: string;
}

export interface EventArea {
  id: number;
  name: string;
}

/** Lugar personalizado para un evento — tabla event_places. */
export interface EventPlace {
  id: number;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
}

/**
 * Servicio de NetSuite sincronizado en la tabla local `ns_services`.
 * Devuelto por `GET /api/ns-catalogs/services`. Se usa en el Paso 3 del
 * formulario de eventos institucionales para seleccionar el ítem con el
 * que se generará la Sales Order cuando el evento tiene costo.
 * - `id`: ID interno de NetSuite (INT). Este es el que se guarda en `institutional_events.ns_item_id`.
 * - `item_id`: código legible del ítem en NS (ej. "CURSOVER").
 * - `item_name`: nombre visible del ítem/servicio.
 */
export interface NsService {
  id: number;
  item_id: string;
  item_name: string;
  is_inactive: boolean;
  has_assetaccount: boolean;   // Legacy: cuenta de activo asociada (inventario).
  has_incomeaccount: boolean;  // Vendible en Sales Order (Service for Sale).
  has_expenseaccount: boolean; // Comprable en Purchase Order / gastos (Service for Purchase).
}

/**
 * Tipo de venta NetSuite sincronizado en la tabla local `sale_types`
 * desde el customlist `customlist_cl_tipo_venta`. Devuelto por
 * `GET /api/sale-types`. Se usa en el formulario de eventos institucionales
 * para elegir el `sale_type_id` que el backend propaga a
 * `custbody_cl_tipo_venta` al generar la Sales Order.
 * - `id`: ID interno del customlist NS. Este es el que se guarda en
 *   `institutional_events.sale_type_id`.
 * - `name`: etiqueta visible (ej. "Curso de verano", "Pases de Invitados").
 */
export interface SaleType {
  id: number;
  name: string;
  is_inactive: boolean;
}

/** Payload exacto que espera la API para crear/editar un evento (snake_case, 1:1 con la BD). */
export interface InstitutionalEventPayload {
  location_id: number;
  area_id?: number | null;
  place_id?: number | null;
  name: string;
  kicker?: string | null;
  event_type: EventType;
  color_theme?: ColorTheme;
  description?: string | null;
  banner_image_url?: string | null;
  start_date: string;
  end_date?: string | null;
  all_day: boolean;
  venue?: string | null;
  event_modality?: EventModality;
  stream_url?: string | null;
  doors_open_time?: string | null;
  access_types: AccessType[];
  has_registration: boolean;
  max_capacity?: number | null;
  has_cost: boolean;
  cost?: number | null;
  ns_item_id?: number | null;
  sale_type_id?: number | null;
  has_matrix_pricing?: boolean;
  institutional_event_prices?: InstitutionalEventPrice[];
  has_donations: boolean;
  donation_amounts?: number[] | null;
  documents?: InstitutionalEventDocument[] | null;
  faqs?: InstitutionalEventFaq[] | null;
  speakers?: InstitutionalEventSpeaker[] | null;
  testimonials?: InstitutionalEventTestimonial[] | null;
  post_event_data?: PostEventData | null;
  extra_data?: EventExtraData | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  institutional_event_subevents?: InstitutionalEventSubevent[];
}
