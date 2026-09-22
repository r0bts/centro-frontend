import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EventListResponse,
  EventResponse,
  EventListFilters,
  AttendeeListResponse,
  AttendeeResponse,
  InstitutionalEventPayload,
  EventLocation,
  EventArea,
  EventPlace,
  EventAccessType,
  ApiResponse,
  EventSocioSearchResult,
  AddAttendeePayload,
  NsService,
  SaleType,
} from '../models/institutional-event.model';

/**
 * Servicio HTTP principal del módulo de Eventos Institucionales.
 * Envuelve todos los endpoints reales de `/api/institutional-events`
 * (ver backend/centro/config/routes.php).
 */
@Injectable({ providedIn: 'root' })
export class InstitutionalEventsService {
  private readonly base = `${environment.apiUrl}/institutional-events`;
  private readonly locationsBase = `${environment.apiUrl}/locations`;

  /** Sedes reales donde se pueden realizar eventos institucionales (ver comentario de columna location_id en el schema). */
  private static readonly SEDES_EVENTOS = ['HERMES', 'GLACIAR'];

  constructor(private http: HttpClient) {}

  // ── Eventos ──────────────────────────────────────────────────────────────────

  getAll(filters: EventListFilters = {}): Observable<EventListResponse> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.event_type) params = params.set('event_type', filters.event_type);
    if (filters.location_id) params = params.set('location_id', filters.location_id);
    return this.http.get<EventListResponse>(`${this.base}`, { params });
  }

  getById(id: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${this.base}/${id}`);
  }

  create(data: InstitutionalEventPayload): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.base}`, data);
  }

  update(id: number, data: Partial<InstitutionalEventPayload>): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }

  publish(id: number): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${this.base}/${id}/publish`, {});
  }

  close(id: number): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${this.base}/${id}/close`, {});
  }

  cancel(id: number, cancellation_reason: string): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${this.base}/${id}/cancel`, { cancellation_reason });
  }

  /** POST /api/institutional-events/:id/upload/:type — sube un archivo de imagen y devuelve la URL pública. */
  uploadImage(eventId: number, type: string, file: File): Observable<{ success: boolean; url: string; type: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ success: boolean; url: string; type: string }>(
      `${this.base}/${eventId}/upload/${type}`,
      formData
    );
  }

  // ── Endpoint público (sin JWT) ───────────────────────────────────────────────

  /** GET /api/public/events/:id — datos públicos del evento (landing sin login). */
  getPublic(id: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${environment.apiUrl}/public/events/${id}`);
  }

  registerPublic(eventId: number, data: any): Observable<ApiResponse<{ created: number; skipped: number; details?: any[]; sales_order_id?: number }>> {
    return this.http.post<ApiResponse<{ created: number; skipped: number; details?: any[]; sales_order_id?: number }>>(`${environment.apiUrl}/public/events/${eventId}/register`, data);
  }

  // ── Asistentes ───────────────────────────────────────────────────────────────

  getAttendees(eventId: number): Observable<AttendeeListResponse> {
    return this.http.get<AttendeeListResponse>(`${this.base}/${eventId}/attendees`);
  }

  addAttendee(eventId: number, data: Partial<any>): Observable<AttendeeResponse> {
    return this.http.post<AttendeeResponse>(`${this.base}/${eventId}/attendees`, data);
  }

  cancelAttendee(eventId: number, attendeeId: number): Observable<AttendeeResponse> {
    return this.http.patch<AttendeeResponse>(`${this.base}/${eventId}/attendees/${attendeeId}/cancel`, {});
  }

  /** GET /api/institutional-events/socios/buscar?q= — busca socios con datos de titular */
  searchSocio(q: string): Observable<ApiResponse<{ socios: EventSocioSearchResult[] }>> {
    return this.http.get<ApiResponse<{ socios: EventSocioSearchResult[] }>>(
      `${this.base}/socios/buscar`,
      { params: new HttpParams().set('q', q) }
    );
  }

  /** GET /api/external-visitors?search= — busca visitantes externos por nombre, email o teléfono */
  searchExternalVisitor(q: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/external-visitors`,
      { params: new HttpParams().set('search', q) }
    );
  }

  /** GET /api/institutional-event-preregistrants?search= — busca pre-registrados */
  searchPreregistrant(q: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/institutional-event-preregistrants`,
      { params: new HttpParams().set('search', q) }
    );
  }

  /** PATCH /api/institutional-events/:id/attendees/:aid/checkin */
  checkinAttendee(eventId: number, attendeeId: number, status: 'present' | 'absent' | 'pending'): Observable<AttendeeResponse> {
    return this.http.patch<AttendeeResponse>(
      `${this.base}/${eventId}/attendees/${attendeeId}/checkin`,
      { attendance_status: status }
    );
  }

  addAttendeesBatch(eventId: number, data: {
    attendees: {
      socio_id?: number;
      host_socio_id?: number;
      socio_guest_id?: number;
      attendee_type?: string;
      full_name: string;
      subevent_ids: number[];
      /**
       * access_type por-persona (fase 2 mapa 15 §9.3 P3). Si se envía, el backend
       * cobra según la matriz de precios; si no, cae al `access_type_selected`
       * del nivel del batch como fallback.
       */
      access_type_selected?: string;
    }[];
    registration_channel: 'admin_manual';
    access_type_selected: string;
    notes?: string | null;
    create_ns_order: boolean;
    skip_billing?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/${eventId}/attendees/batch`, data);
  }

  /** POST /api/institutional-events/:id/attendees/send-tickets */
  sendTickets(eventId: number, payload: { target: 'all' } | { target: 'selected'; attendee_ids: number[] }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/${eventId}/attendees/send-tickets`, payload);
  }

  // ── Catálogo de sedes ────────────────────────────────────────────────────────

  /**
   * Sedes reales disponibles para eventos institucionales (HERMES, GLACIAR).
   * Reutiliza el catálogo general `locations` (compartido con Almacén/NetSuite)
   * pero lo filtra a solo las sedes físicas del club, que son las únicas
   * válidas de negocio para location_id en institutional_events.
   */
  getEventLocations(): Observable<EventLocation[]> {
    return this.http.get<ApiResponse<{ locations: any[] }>>(`${this.locationsBase}`).pipe(
      map(res => {
        const all = res.data?.locations ?? [];
        const activos = all.filter(l => l.is_active);
        const sedes = activos.filter(l => InstitutionalEventsService.SEDES_EVENTOS.includes(String(l.name).toUpperCase()));
        const lista = sedes.length ? sedes : activos;
        return lista.map(l => ({ id: Number(l.id), name: l.name }));
      })
    );
  }

  /** GET /api/areas?active=true — catálogo de áreas activas del club (para campo area_id del evento). */
  getAreas(): Observable<EventArea[]> {
    return this.http.get<ApiResponse<{ areas: any[] }>>(`${environment.apiUrl}/areas`, {
      params: new HttpParams().set('active', 'true').set('limit', '200'),
    }).pipe(
      map(res => {
        const all = res.data?.areas ?? (res as any)?.data ?? [];
        return all.filter((a: any) => !a.is_inactive).map((a: any) => ({ id: Number(a.id), name: a.name }));
      })
    );
  }

  // ── Lugares personalizados (event_places) ──────────────────────────────────

  /** GET /api/event-places — lista todos los lugares disponibles. */
  getPlaces(): Observable<EventPlace[]> {
    return this.http.get<any>(`${environment.apiUrl}/event-places`).pipe(
      map(res => (res.data?.places ?? []).map((p: any) => ({
        id: Number(p.id),
        name: p.name,
        address: p.address ?? null,
        lat: p.lat != null ? Number(p.lat) : null,
        lng: p.lng != null ? Number(p.lng) : null,
        notes: p.notes ?? null,
      })))
    );
  }

  /** POST /api/event-places — crea un nuevo lugar. */
  createPlace(data: Omit<EventPlace, 'id'>): Observable<EventPlace> {
    return this.http.post<any>(`${environment.apiUrl}/event-places`, data).pipe(
      map(res => res.data.place)
    );
  }

  /** PATCH /api/event-places/:id — actualiza un lugar existente. */
  updatePlace(id: number, data: Partial<EventPlace>): Observable<EventPlace> {
    return this.http.patch<any>(`${environment.apiUrl}/event-places/${id}`, data).pipe(
      map(res => res.data.place)
    );
  }

  /** GET /api/event-access-types — catálogo de tipos de acceso para eventos. */
  getAccessTypes(): Observable<EventAccessType[]> {
    return this.http.get<any>(`${environment.apiUrl}/event-access-types`).pipe(
      map(res => res.types ?? [])
    );
  }

  /** GET /api/event-color-themes — catálogo de temas de color para la landing. */
  getColorThemes(): Observable<import('../models/institutional-event.model').EventColorTheme[]> {
    return this.http.get<any>(`${environment.apiUrl}/event-color-themes`).pipe(
      map(res => res.themes ?? [])
    );
  }

  // ── Catálogo de servicios NetSuite (para costo del evento) ─────────────────

  /**
   * GET /api/ns-catalogs/services — devuelve los Servicios de NetSuite
   * sincronizados en `ns_services`. Filtros:
   *   - `q`           búsqueda parcial en item_name / item_id.
   *   - `active`      default true (sólo activos).
   *   - `sellable`    default true (sólo con `has_incomeaccount = 1`, aptos para Sales Order).
   *   - `purchasable` opcional (sólo con `has_expenseaccount = 1`, aptos para Purchase Order).
   *   - `limit`       tope 500.
   * Se usa en Paso 3 para poblar el selector de “Tipo de servicio de NetSuite”
   * cuando el evento tiene costo (`has_cost = true`).
   */
  getNsServices(opts: {
    q?: string;
    active?: boolean;
    sellable?: boolean;
    purchasable?: boolean;
    limit?: number;
  } = {}): Observable<NsService[]> {
    let params = new HttpParams();
    if (opts.q)                         params = params.set('q', opts.q);
    if (opts.active !== undefined)      params = params.set('active', opts.active ? '1' : '0');
    if (opts.sellable !== undefined)    params = params.set('sellable', opts.sellable ? '1' : '0');
    if (opts.purchasable !== undefined) params = params.set('purchasable', opts.purchasable ? '1' : '0');
    if (opts.limit)                     params = params.set('limit', String(opts.limit));
    return this.http
      .get<ApiResponse<{ services: NsService[]; count: number }>>(`${environment.apiUrl}/ns-catalogs/services`, { params })
      .pipe(map(res => res.data?.services ?? []));
  }

  // ── Catálogo de tipos de venta NetSuite (customlist_cl_tipo_venta) ─────────

  /**
   * GET /api/sale-types — devuelve el catálogo local de tipos de venta
   * sincronizados en `sale_types`. Sólo activos por default. Se usa en el
   * Paso 3 del formulario para poblar el selector de `sale_type_id` del
   * evento (mapa 15 §pendiente saleType).
   */
  getSaleTypes(opts: { active?: boolean; limit?: number } = {}): Observable<SaleType[]> {
    let params = new HttpParams();
    if (opts.active !== undefined) params = params.set('active', opts.active ? '1' : '0');
    if (opts.limit)                params = params.set('limit', String(opts.limit));
    return this.http
      .get<ApiResponse<{ sale_types: SaleType[]; total: number }>>(`${environment.apiUrl}/sale-types`, { params })
      .pipe(map(res => res.data?.sale_types ?? []));
  }
}
