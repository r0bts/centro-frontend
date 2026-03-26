import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TorneoListResponse,
  TorneoResponse,
  TorneoFormDataResponse,
  JornadaListResponse,
  JornadaResponse,
  InscripcionListResponse,
  InscripcionResponse,
  GenerarJornadasResponse,
  CreateTorneoRequest,
  UpdateTorneoRequest,
  TorneoFormato,
} from '../../models/deportivo/torneo.model';

@Injectable({ providedIn: 'root' })
export class TorneoService {
  private readonly base = `${environment.apiUrl}/deportivo`;

  constructor(private http: HttpClient) {}

  // ── Torneos ──────────────────────────────────────────────────────────────────

  getFormData(): Observable<TorneoFormDataResponse> {
    return this.http.get<TorneoFormDataResponse>(`${this.base}/torneos/form-data`);
  }

  getAll(filtros: { actividad_id?: number; formato?: TorneoFormato; activo?: boolean } = {}): Observable<TorneoListResponse> {
    let params = new HttpParams();
    if (filtros.actividad_id) params = params.set('actividad_id', filtros.actividad_id);
    if (filtros.formato)      params = params.set('formato', filtros.formato);
    if (filtros.activo !== undefined) params = params.set('activo', filtros.activo ? '1' : '0');
    return this.http.get<TorneoListResponse>(`${this.base}/torneos`, { params });
  }

  getById(id: number): Observable<TorneoResponse> {
    return this.http.get<TorneoResponse>(`${this.base}/torneos/${id}`);
  }

  create(data: CreateTorneoRequest): Observable<TorneoResponse> {
    return this.http.post<TorneoResponse>(`${this.base}/torneos`, data);
  }

  update(id: number, data: UpdateTorneoRequest): Observable<TorneoResponse> {
    return this.http.put<TorneoResponse>(`${this.base}/torneos/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/torneos/${id}`);
  }

  toggleActive(id: number, is_active: boolean): Observable<TorneoResponse> {
    return this.http.patch<TorneoResponse>(`${this.base}/torneos/${id}`, { is_active });
  }

  // ── Inscripciones ─────────────────────────────────────────────────────────────

  getInscripciones(torneoId: number): Observable<InscripcionListResponse> {
    return this.http.get<InscripcionListResponse>(`${this.base}/torneos/${torneoId}/inscripciones`);
  }

  addInscripcion(torneoId: number, body: { equipo_id?: number; alumno_id?: number; torneo_equipo_id?: number }): Observable<InscripcionResponse> {
    return this.http.post<InscripcionResponse>(`${this.base}/torneos/${torneoId}/inscripciones`, body);
  }

  removeInscripcion(torneoId: number, inscripcionId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/torneos/${torneoId}/inscripciones/${inscripcionId}`);
  }

  updatePosicion(torneoId: number, inscripcionId: number, nuevaPos: number): Observable<InscripcionResponse> {
    return this.http.patch<InscripcionResponse>(
      `${this.base}/torneos/${torneoId}/inscripciones/${inscripcionId}/posicion`,
      { nueva_posicion: nuevaPos }
    );
  }

  // ── Jornadas ─────────────────────────────────────────────────────────────────

  getJornadas(torneoId: number): Observable<JornadaListResponse> {
    const params = new HttpParams().set('torneo_id', torneoId);
    return this.http.get<JornadaListResponse>(`${this.base}/jornadas`, { params });
  }

  getJornada(id: number): Observable<JornadaResponse> {
    return this.http.get<JornadaResponse>(`${this.base}/jornadas/${id}`);
  }

  updateJornada(id: number, data: { nombre?: string; fecha_inicio?: string; fecha_fin?: string }): Observable<JornadaResponse> {
    return this.http.put<JornadaResponse>(`${this.base}/jornadas/${id}`, data);
  }

  updateEstadoJornada(id: number, estado: 'pendiente' | 'en_curso' | 'finalizada'): Observable<JornadaResponse> {
    return this.http.patch<JornadaResponse>(`${this.base}/jornadas/${id}/estado`, { estado });
  }

  generarJornadas(torneoId: number, numJornadas?: number): Observable<GenerarJornadasResponse> {
    const body = numJornadas ? { num_jornadas: numJornadas } : {};
    return this.http.post<GenerarJornadasResponse>(`${this.base}/torneos/${torneoId}/generar-jornadas`, body);
  }

  // ── Partidos del torneo ───────────────────────────────────────────────────────

  getPartidos(torneoId: number, jornadaId?: number): Observable<{ success: boolean; message: string; data: { partidos: any[]; total: number } }> {
    let params = new HttpParams();
    if (jornadaId) params = params.set('jornada_id', jornadaId);
    return this.http.get<any>(`${this.base}/torneos/${torneoId}/partidos`, { params });
  }
}
