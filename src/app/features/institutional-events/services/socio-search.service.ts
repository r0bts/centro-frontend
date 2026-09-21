import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SocioSearchResult {
  id: number;
  fullname: string;
  numero_socio?: string;
  email?: string | null;
  status?: string;
}

/**
 * Servicio dedicado a la búsqueda de socios para el flujo de inscripción
 * de asistentes a eventos institucionales.
 * Endpoint real: GET /api/institutional-events/socios/buscar?q=
 */
@Injectable({ providedIn: 'root' })
export class SocioSearchService {
  private readonly base = `${environment.apiUrl}/institutional-events`;

  constructor(private http: HttpClient) {}

  buscar(query: string): Observable<any> {
    const params = new HttpParams().set('q', query);
    return this.http.get<any>(`${this.base}/socios/buscar`, { params });
  }
}
