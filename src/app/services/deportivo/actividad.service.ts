import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActividadListResponse,
  ActividadResponse,
  ActividadFormDataResponse,
  GrupoCategoriaResponse,
  EquipoResponse,
  CriterioResponse,
  HorarioResponse,
  CreateActividadRequest,
  UpdateActividadRequest,
  CreateGrupoRequest,
  CreateEquipoRequest,
  CreateCriterioRequest,
  CreateHorarioRequest,
} from '../../models/deportivo/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly base = `${environment.apiUrl}/deportivo`;

  constructor(private http: HttpClient) {}

  // ── Actividades ─────────────────────────────────────────────────────────────

  getFormData(): Observable<ActividadFormDataResponse> {
    return this.http.get<ActividadFormDataResponse>(`${this.base}/actividades/form-data`);
  }

  getAll(filters: { club_id?: number; activa?: boolean } = {}): Observable<ActividadListResponse> {
    let params = new HttpParams();
    if (filters.club_id) params = params.set('club_id', filters.club_id);
    if (filters.activa !== undefined) params = params.set('activa', filters.activa ? '1' : '0');
    return this.http.get<ActividadListResponse>(`${this.base}/actividades`, { params });
  }

  getById(id: number): Observable<ActividadResponse> {
    return this.http.get<ActividadResponse>(`${this.base}/actividades/${id}`);
  }

  create(data: CreateActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(`${this.base}/actividades`, data);
  }

  update(id: number, data: UpdateActividadRequest): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.base}/actividades/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/actividades/${id}`);
  }

  toggleActive(id: number, is_active: boolean): Observable<ActividadResponse> {
    return this.update(id, { is_active });
  }

  // ── Grupos / Categorías ─────────────────────────────────────────────────────

  createGrupo(data: CreateGrupoRequest): Observable<GrupoCategoriaResponse> {
    return this.http.post<GrupoCategoriaResponse>(`${this.base}/grupos-categorias`, data);
  }

  updateGrupo(id: number, data: Partial<CreateGrupoRequest>): Observable<GrupoCategoriaResponse> {
    return this.http.put<GrupoCategoriaResponse>(`${this.base}/grupos-categorias/${id}`, data);
  }

  deleteGrupo(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/grupos-categorias/${id}`);
  }

  // ── Equipos ─────────────────────────────────────────────────────────────────

  createEquipo(data: CreateEquipoRequest): Observable<EquipoResponse> {
    return this.http.post<EquipoResponse>(`${this.base}/equipos`, data);
  }

  updateEquipo(id: number, data: Partial<CreateEquipoRequest>): Observable<EquipoResponse> {
    return this.http.put<EquipoResponse>(`${this.base}/equipos/${id}`, data);
  }

  deleteEquipo(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/equipos/${id}`);
  }

  // ── Horarios ────────────────────────────────────────────────────────────────

  createHorario(equipoId: number, data: CreateHorarioRequest): Observable<HorarioResponse> {
    return this.http.post<HorarioResponse>(`${this.base}/equipos/${equipoId}/horarios`, data);
  }

  deleteHorario(equipoId: number, horarioId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/equipos/${equipoId}/horarios/${horarioId}`);
  }

  // ── Criterios de Evaluación ─────────────────────────────────────────────────

  createCriterio(data: CreateCriterioRequest): Observable<CriterioResponse> {
    return this.http.post<CriterioResponse>(`${this.base}/criterios-evaluacion`, data);
  }

  updateCriterio(id: number, data: Partial<CreateCriterioRequest>): Observable<CriterioResponse> {
    return this.http.put<CriterioResponse>(`${this.base}/criterios-evaluacion/${id}`, data);
  }

  deleteCriterio(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/criterios-evaluacion/${id}`);
  }
}
