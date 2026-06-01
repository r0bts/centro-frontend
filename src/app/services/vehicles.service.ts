import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  VehiclesIndexResponse,
  VehiclesBySocioResponse,
  VehicleAddPayload,
  VehicleEditPayload,
  VehicleMutationResponse,
  SocioSearchResult,
} from '../models/vehicle.model';

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  private readonly BASE = `${environment.apiUrl}/vehicles`;
  private readonly SOCIOS_SEARCH = `${environment.apiUrl}/deportivo/equipos-torneo/search-socios`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/vehicles?q={placa|nombre|entityid}
  // Busca vehículos agrupados por membresía.
  // ─────────────────────────────────────────────────────────────────────────
  search(q: string): Observable<VehiclesIndexResponse> {
    const params = new HttpParams().set('q', q.trim());
    return this.http.get<VehiclesIndexResponse>(this.BASE, {
      headers: this.getHeaders(),
      params,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/vehicles/by-socio/{socio_id}
  // Lista todos los vehículos de un socio específico.
  // ─────────────────────────────────────────────────────────────────────────
  getBySocio(socioId: number): Observable<VehiclesBySocioResponse> {
    return this.http.get<VehiclesBySocioResponse>(`${this.BASE}/by-socio/${socioId}`, {
      headers: this.getHeaders(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/vehicles/add
  // Registra un nuevo vehículo para un socio.
  // ─────────────────────────────────────────────────────────────────────────
  add(payload: VehicleAddPayload): Observable<VehicleMutationResponse> {
    return this.http.post<VehicleMutationResponse>(`${this.BASE}/add`, payload, {
      headers: this.getHeaders(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/vehicles/edit
  // Edita los datos de un vehículo existente.
  // ─────────────────────────────────────────────────────────────────────────
  edit(payload: VehicleEditPayload): Observable<VehicleMutationResponse> {
    return this.http.post<VehicleMutationResponse>(`${this.BASE}/edit`, payload, {
      headers: this.getHeaders(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/vehicles/disable
  // Deshabilita un vehículo (soft-delete).
  // ─────────────────────────────────────────────────────────────────────────
  disable(id: number): Observable<VehicleMutationResponse> {
    return this.http.post<VehicleMutationResponse>(`${this.BASE}/disable`, { id }, {
      headers: this.getHeaders(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/deportivo/equipos-torneo/search-socios?q=
  // Busca socios por nombre / entityid para el selector del modal.
  // ─────────────────────────────────────────────────────────────────────────
  searchSocios(q: string): Observable<{ success: boolean; data: SocioSearchResult[] }> {
    const params = new HttpParams().set('q', q.trim());
    return this.http.get<{ success: boolean; data: SocioSearchResult[] }>(
      this.SOCIOS_SEARCH,
      { headers: this.getHeaders(), params }
    );
  }
}
