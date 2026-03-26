import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EquipoListResponse,
  EquipoResponse,
  IntegranteResponse,
  SocioSearchResponse,
  EquipoTorneosResponse,
  CreateEquipoRequest,
  UpdateEquipoRequest,
  AddIntegranteRequest,
  EditIntegranteRequest,
} from '../../models/deportivo/torneo-equipo.model';

@Injectable({ providedIn: 'root' })
export class TorneoEquipoService {
  private readonly base = `${environment.apiUrl}/deportivo/equipos-torneo`;

  constructor(private http: HttpClient) {}

  // ── Equipos ──────────────────────────────────────────────────────────────────

  getAll(filtros: { search?: string; activo?: boolean } = {}): Observable<EquipoListResponse> {
    let params = new HttpParams();
    if (filtros.search)              params = params.set('search', filtros.search);
    if (filtros.activo !== undefined) params = params.set('activo', filtros.activo ? '1' : '0');
    return this.http.get<EquipoListResponse>(this.base, { params });
  }

  getById(id: number): Observable<EquipoResponse> {
    return this.http.get<EquipoResponse>(`${this.base}/${id}`);
  }

  create(data: CreateEquipoRequest): Observable<EquipoResponse> {
    return this.http.post<EquipoResponse>(this.base, data);
  }

  update(id: number, data: UpdateEquipoRequest): Observable<EquipoResponse> {
    return this.http.put<EquipoResponse>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }

  toggleActive(id: number, is_active: boolean): Observable<EquipoResponse> {
    return this.http.patch<EquipoResponse>(`${this.base}/${id}`, { is_active });
  }
  // ── Torneos del equipo ────────────────────────────────────────────────────────

  getTorneos(equipoId: number): Observable<EquipoTorneosResponse> {
    return this.http.get<EquipoTorneosResponse>(`${this.base}/${equipoId}/torneos`);
  }
  // ── Integrantes ───────────────────────────────────────────────────────────────

  addIntegrante(equipoId: number, data: AddIntegranteRequest): Observable<IntegranteResponse> {
    return this.http.post<IntegranteResponse>(`${this.base}/${equipoId}/integrantes`, data);
  }

  editIntegrante(equipoId: number, integranteId: number, data: EditIntegranteRequest): Observable<IntegranteResponse> {
    return this.http.patch<IntegranteResponse>(`${this.base}/${equipoId}/integrantes/${integranteId}`, data);
  }

  removeIntegrante(equipoId: number, integranteId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.base}/${equipoId}/integrantes/${integranteId}`
    );
  }

  // ── Búsqueda de socios ────────────────────────────────────────────────────────

  searchSocios(q: string, equipoId?: number): Observable<SocioSearchResponse> {
    let params = new HttpParams().set('q', q);
    if (equipoId) params = params.set('equipo_id', equipoId);
    return this.http.get<SocioSearchResponse>(`${this.base}/search-socios`, { params });
  }
}
