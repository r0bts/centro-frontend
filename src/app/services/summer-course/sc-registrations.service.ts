import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScRegistrationRequest,
  ScRegistrationResponse,
  ScRegistrationsListResponse,
  ScSocioSearchResponse,
  ScCostsResponse,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScRegistrationsService {
  /** Base para endpoints de registro (deportivo/summer-course) */
  private readonly base = `${environment.apiUrl}/deportivo/summer-course`;

  constructor(private http: HttpClient) {}

  /**
   * Busca socios por nombre o número de membresía.
   * Incluye familia e indica si ya están inscritos en el curso.
   */
  searchSocios(q: string, courseId?: number): Observable<ScSocioSearchResponse> {
    let params = new HttpParams().set('q', q);
    if (courseId) params = params.set('course_id', courseId.toString());
    return this.http.get<ScSocioSearchResponse>(`${this.base}/search-socios`, { params });
  }

  /**
   * Obtiene los costos del curso.
   */
  getCosts(courseId?: number): Observable<ScCostsResponse> {
    let params = new HttpParams();
    if (courseId) params = params.set('course_id', courseId.toString());
    return this.http.get<ScCostsResponse>(`${this.base}/costs`, { params });
  }

  /**
   * Registra la inscripción de uno o varios participantes.
   */
  register(payload: ScRegistrationRequest): Observable<ScRegistrationResponse> {
    return this.http.post<ScRegistrationResponse>(`${this.base}/registration`, payload);
  }

  /**
   * Listado admin: todos los inscritos en un curso agrupados por titular.
   */
  getRegistrations(courseId?: number): Observable<ScRegistrationsListResponse> {
    let params = new HttpParams();
    if (courseId) params = params.set('course_id', courseId.toString());
    return this.http.get<ScRegistrationsListResponse>(`${this.base}/registrations`, { params });
  }

  /**
   * Familia de un titular (por socio_id del titular).
   */
  getFamily(titularId: number | string): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.base}/titular/${titularId}/family`);
  }

  /**
   * Verificar si un titular ya tiene inscripción activa en el curso.
   */
  getActiveRegistration(userId: number | string, courseId?: number): Observable<any> {
    let params = new HttpParams().set('user_id', userId.toString());
    if (courseId) params = params.set('course_id', courseId.toString());
    return this.http.get(`${this.base}/active-registration`, { params });
  }
}
