import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScGuest,
  CreateGuestPayload,
  GuestResult,
  ScGuestListResponse,
} from '../../models/summer-course/summer-course.model';

/**
 * ScGuestSyncService
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio reutilizable para gestión de invitados de socios.
 * Crea invitados en DB y los sincroniza automáticamente con NetSuite Contact.
 *
 * Uso desde cualquier módulo:
 *   inject(ScGuestSyncService).createGuest(payload)
 *   inject(ScGuestSyncService).getGuestsBySocio(socioId)
 *   inject(ScGuestSyncService).retrySync(guestId)
 */
@Injectable({ providedIn: 'root' })
export class ScGuestSyncService {
  private readonly base = `${environment.apiUrl}/summer-course/guests`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los invitados registrados de un socio.
   * Si ns_synced=false, el guest quedó pendiente de sync con NetSuite.
   */
  getGuestsBySocio(socioId: number): Observable<ScGuestListResponse> {
    const params = new HttpParams().set('socio_id', socioId.toString());
    return this.http.get<ScGuestListResponse>(this.base, { params });
  }

  /**
   * Crea un invitado en DB y lo sincroniza con NetSuite Contact.
   * Si NS falla, el invitado queda guardado en DB con ns_synced=false.
   * El caller puede ofrecer "retry sync" después.
   */
  createGuest(payload: CreateGuestPayload): Observable<GuestResult> {
    return this.http.post<GuestResult>(this.base, payload);
  }

  /**
   * Reintenta la sincronización con NetSuite de un invitado previamente fallido.
   */
  retrySync(guestId: number): Observable<GuestResult> {
    return this.http.patch<GuestResult>(`${this.base}/${guestId}/sync`, {});
  }

  /** Helper: calcula edad en años desde una fecha de nacimiento (YYYY-MM-DD) */
  static calcAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now   = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  /** Helper: retorna true si el invitado ya está sincronizado con NetSuite */
  static isSynced(guest: ScGuest): boolean {
    return !!guest.netsuite_contact_id;
  }
}
