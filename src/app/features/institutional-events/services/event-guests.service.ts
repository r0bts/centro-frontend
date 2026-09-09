import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccessType, ApiResponse } from '../models/institutional-event.model';
import {
  AddManualGuestRow,
  AddManualGuestsResponse,
  GuestCountsResponse,
  GuestListResponse,
  GuestPublicRegistrantsSearchResponse,
  GuestScope,
  GuestScopeMode,
  GuestScopesResponse,
  GuestSociosSearchResponse,
  GuestStatus,
  PublicRegistrantType,
} from '../models/event-guest.model';

/**
 * Servicio HTTP del módulo "Lista de invitados con pantalla dividida" (mapa 16).
 *
 * Envuelve los endpoints reales de
 * `/api/institutional-events/{eventId}/guests/*` (ver
 * `backend/centro/config/routes.php` y
 * `backend/centro/src/Controller/Api/InstitutionalEventGuestsController.php`).
 */
@Injectable({ providedIn: 'root' })
export class EventGuestsService {
  private readonly base = `${environment.apiUrl}/institutional-events`;

  constructor(private http: HttpClient) {}

  private scopeParams(subeventId: number | null): HttpParams {
    let params = new HttpParams();
    if (subeventId !== null && subeventId !== undefined) {
      params = params.set('subevent_id', String(subeventId));
    }
    return params;
  }

  // ── Scopes ────────────────────────────────────────────────────────────────

  getScopes(eventId: number, subeventId: number | null): Observable<GuestScopesResponse> {
    return this.http.get<GuestScopesResponse>(
      `${this.base}/${eventId}/guests/scopes`,
      { params: this.scopeParams(subeventId) },
    );
  }

  updateScopes(
    eventId: number,
    subeventId: number | null,
    scopes: Array<{ access_type: AccessType; mode: GuestScopeMode }>,
  ): Observable<ApiResponse<{ scopes: GuestScope[] }>> {
    return this.http.patch<ApiResponse<{ scopes: GuestScope[] }>>(
      `${this.base}/${eventId}/guests/scopes`,
      { subevent_id: subeventId, scopes },
    );
  }

  // ── Counts y listado ─────────────────────────────────────────────────────

  getCounts(eventId: number, subeventId: number | null): Observable<GuestCountsResponse> {
    return this.http.get<GuestCountsResponse>(
      `${this.base}/${eventId}/guests/counts`,
      { params: this.scopeParams(subeventId) },
    );
  }

  getList(
    eventId: number,
    subeventId: number | null,
    accessType?: AccessType | null,
    page: number = 1,
    limit: number = 50,
  ): Observable<GuestListResponse> {
    let params = this.scopeParams(subeventId);
    if (accessType) params = params.set('access_type', accessType);
    params = params.set('page', String(page)).set('limit', String(limit));
    return this.http.get<GuestListResponse>(
      `${this.base}/${eventId}/guests/list`,
      { params },
    );
  }

  // ── Manual CRUD ──────────────────────────────────────────────────────────

  addManual(
    eventId: number,
    subeventId: number | null,
    accessType: AccessType,
    guests: AddManualGuestRow[],
  ): Observable<AddManualGuestsResponse> {
    return this.http.post<AddManualGuestsResponse>(
      `${this.base}/${eventId}/guests/manual`,
      {
        subevent_id: subeventId,
        access_type: accessType,
        guests,
      },
    );
  }

  editManual(
    eventId: number,
    guestId: number,
    changes: Partial<{ status: GuestStatus; notes: string | null }>,
  ): Observable<ApiResponse<{ guest: unknown }>> {
    return this.http.patch<ApiResponse<{ guest: unknown }>>(
      `${this.base}/${eventId}/guests/manual/${guestId}`,
      changes,
    );
  }

  deleteManual(eventId: number, guestId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.base}/${eventId}/guests/manual/${guestId}`,
    );
  }

  // ── Búsquedas ────────────────────────────────────────────────────────────

  searchSocios(
    eventId: number,
    q: string,
    accessType?: AccessType | null,
  ): Observable<GuestSociosSearchResponse> {
    let params = new HttpParams().set('q', q);
    if (accessType) params = params.set('access_type', accessType);
    return this.http.get<GuestSociosSearchResponse>(
      `${this.base}/${eventId}/guests/search-socios`,
      { params },
    );
  }

  searchPublicRegistrants(
    eventId: number,
    q: string,
    registrantType?: PublicRegistrantType | null,
  ): Observable<GuestPublicRegistrantsSearchResponse> {
    let params = new HttpParams().set('q', q);
    if (registrantType) params = params.set('registrant_type', registrantType);
    return this.http.get<GuestPublicRegistrantsSearchResponse>(
      `${this.base}/${eventId}/guests/search-public-registrants`,
      { params },
    );
  }

  /**
   * Crea un `event_public_registrant` externo (o encuentra el existente por
   * email) y lo agrega al scope como invitado manual. Ver mapa 16 §M6.
   */
  createPublicRegistrant(
    eventId: number,
    subeventId: number | null,
    accessType: 'public' | 'registration',
    data: {
      first_name: string;
      last_name?: string;
      email: string;
      phone?: string;
      notes?: string;
    },
  ): Observable<ApiResponse<{
    registrant: unknown;
    guest: unknown;
    registrant_was_new: boolean;
    duplicate: boolean;
  }>> {
    return this.http.post<ApiResponse<any>>(
      `${this.base}/${eventId}/guests/public-registrants`,
      {
        subevent_id: subeventId,
        access_type: accessType,
        ...data,
      },
    );
  }

  // ── Acciones batch ───────────────────────────────────────────────────────

  sendInvitations(
    eventId: number,
    subeventId: number | null,
  ): Observable<ApiResponse<{ updated_count: number }>> {
    return this.http.post<ApiResponse<{ updated_count: number }>>(
      `${this.base}/${eventId}/guests/send-invitations`,
      { subevent_id: subeventId },
    );
  }

  export(
    eventId: number,
    subeventId: number | null,
  ): Observable<ApiResponse<{ guests: unknown[]; total: number }>> {
    return this.http.get<ApiResponse<{ guests: unknown[]; total: number }>>(
      `${this.base}/${eventId}/guests/export`,
      { params: this.scopeParams(subeventId) },
    );
  }
}
