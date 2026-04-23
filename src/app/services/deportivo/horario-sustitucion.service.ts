import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GruposHorariosResponse,
  SustitucionResponse,
  SustitucionesListResponse,
  HorariosFormDataResponse,
  CreateSustitucionRequest,
  UpdateSustitucionRequest,
} from '../../models/deportivo/horario-sustitucion.model';

@Injectable({ providedIn: 'root' })
export class HorarioSustitucionService {
  private readonly base = `${environment.apiUrl}/deportivo/horarios`;

  constructor(private http: HttpClient) {}

  /**
   * GET /deportivo/horarios/grupos
   * Vista consolidada: actividades → grupos → horarios + sustitución vigente del día.
   */
  getGrupos(filters: { actividad_id?: number; club_id?: number } = {}): Observable<GruposHorariosResponse> {
    let params = new HttpParams();
    if (filters.actividad_id) params = params.set('actividad_id', filters.actividad_id);
    if (filters.club_id)      params = params.set('club_id', filters.club_id);
    return this.http.get<GruposHorariosResponse>(`${this.base}/grupos`, { params });
  }

  /**
   * GET /deportivo/horarios/form-data
   * Datos auxiliares para el formulario de creación de sustitución.
   */
  getFormData(): Observable<HorariosFormDataResponse> {
    return this.http.get<HorariosFormDataResponse>(`${this.base}/form-data`);
  }

  /**
   * GET /deportivo/horarios/sustituciones
   * Lista de sustituciones con filtros opcionales.
   */
  getSustituciones(filters: {
    equipo_id?: number;
    horario_id?: number;
    status?: 'activa' | 'vencida' | 'cancelada';
  } = {}): Observable<SustitucionesListResponse> {
    let params = new HttpParams();
    if (filters.equipo_id)  params = params.set('equipo_id',  filters.equipo_id);
    if (filters.horario_id) params = params.set('horario_id', filters.horario_id);
    if (filters.status)     params = params.set('status',     filters.status);
    return this.http.get<SustitucionesListResponse>(`${this.base}/sustituciones`, { params });
  }

  /**
   * GET /deportivo/horarios/sustituciones/:id
   */
  getSustitucionById(id: number): Observable<SustitucionResponse> {
    return this.http.get<SustitucionResponse>(`${this.base}/sustituciones/${id}`);
  }

  /**
   * POST /deportivo/horarios/sustituciones
   * Crea una nueva sustitución temporal.
   */
  create(data: CreateSustitucionRequest): Observable<SustitucionResponse> {
    return this.http.post<SustitucionResponse>(`${this.base}/sustituciones`, data);
  }

  /**
   * PUT /deportivo/horarios/sustituciones/:id
   * Edita una sustitución activa.
   */
  update(id: number, data: UpdateSustitucionRequest): Observable<SustitucionResponse> {
    return this.http.put<SustitucionResponse>(`${this.base}/sustituciones/${id}`, data);
  }

  /**
   * DELETE /deportivo/horarios/sustituciones/:id
   * Cancela (soft-delete) una sustitución.
   */
  cancel(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/sustituciones/${id}`);
  }

  /**
   * POST /deportivo/horarios/sustituciones/expirar
   * Marca como vencidas las sustituciones con fecha_fin pasada.
   */
  expirar(): Observable<{ success: boolean; message: string; data: { registros_vencidos: number } }> {
    return this.http.post<any>(`${this.base}/sustituciones/expirar`, {});
  }
}
