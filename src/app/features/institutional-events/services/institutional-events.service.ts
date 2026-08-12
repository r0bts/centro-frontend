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
  ApiResponse,
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

  // ── Endpoint público (sin JWT) ───────────────────────────────────────────────

  /** GET /api/public/events/:id — datos públicos del evento (landing sin login). */
  getPublic(id: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${environment.apiUrl}/public/events/${id}`);
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
}
