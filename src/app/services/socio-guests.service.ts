import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SocioGuest } from '../models/socio-guest.model';

export interface SocioGuestResponse {
  success: boolean;
  message?: string;
  data?: SocioGuest | SocioGuest[];
}

@Injectable({
  providedIn: 'root'
})
export class SocioGuestsService {
  private apiUrl = `${environment.apiUrl}/socio-guests`;

  constructor(private http: HttpClient) { }

  getBySocio(socioId: number): Observable<{ success: boolean, data: SocioGuest[] }> {
    return this.http.get<{ success: boolean, data: SocioGuest[] }>(`${this.apiUrl}?socio_id=${socioId}`);
  }

  create(guest: SocioGuest): Observable<{ success: boolean, data: SocioGuest, message: string }> {
    return this.http.post<{ success: boolean, data: SocioGuest, message: string }>(this.apiUrl, guest);
  }

  update(id: number, guest: SocioGuest): Observable<{ success: boolean, data: SocioGuest, message: string }> {
    return this.http.put<{ success: boolean, data: SocioGuest, message: string }>(`${this.apiUrl}/${id}`, guest);
  }

  delete(id: number): Observable<{ success: boolean, message: string }> {
    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`);
  }
}
