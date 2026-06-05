import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ScAuthorizedPickup {
  id?: number;
  participant_id: number;
  name: string;
  relationship: string;
  phone?: string;
  photo_base64?: string;
  photo_url?: string;
  allowed_days: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ScAuthorizedPickupsService {
  private apiUrl = `${environment.apiUrl}/deportivo/sc-authorized-pickups`;

  constructor(private http: HttpClient) {}

  getByParticipant(participantId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-participant/${participantId}`);
  }

  add(data: Partial<ScAuthorizedPickup>): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
