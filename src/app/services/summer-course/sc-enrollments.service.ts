import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScEnrollmentFormDataResponse,
  ScEnrollmentListResponse,
  ScEnrollmentResponse,
  CreateScEnrollmentRequest,
  UpdateScEnrollmentRequest,
  AssignLevelRequest,
  AssignGroupRequest,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScEnrollmentsService {
  private readonly base = `${environment.apiUrl}/summer-course/enrollments`;

  constructor(private http: HttpClient) {}

  getFormData(courseId?: number): Observable<ScEnrollmentFormDataResponse> {
    let params = new HttpParams();
    if (courseId) params = params.set('course_id', courseId);
    return this.http.get<ScEnrollmentFormDataResponse>(`${this.base}/form-data`, { params });
  }

  getAll(filters: { course_id?: number; status?: string; level?: number } = {}): Observable<ScEnrollmentListResponse> {
    let params = new HttpParams();
    if (filters.course_id) params = params.set('course_id', filters.course_id);
    if (filters.status)    params = params.set('status',    filters.status);
    if (filters.level)     params = params.set('level',     filters.level);
    return this.http.get<ScEnrollmentListResponse>(this.base, { params });
  }

  getById(id: number): Observable<ScEnrollmentResponse> {
    return this.http.get<ScEnrollmentResponse>(`${this.base}/${id}`);
  }

  create(data: CreateScEnrollmentRequest): Observable<ScEnrollmentResponse> {
    return this.http.post<ScEnrollmentResponse>(this.base, data);
  }

  update(id: number, data: UpdateScEnrollmentRequest): Observable<ScEnrollmentResponse> {
    return this.http.put<ScEnrollmentResponse>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }

  assignLevel(id: number, data: AssignLevelRequest): Observable<ScEnrollmentResponse> {
    return this.http.patch<ScEnrollmentResponse>(`${this.base}/${id}/level`, data);
  }

  assignGroup(id: number, data: AssignGroupRequest): Observable<ScEnrollmentResponse> {
    return this.http.patch<ScEnrollmentResponse>(`${this.base}/${id}/group`, data);
  }
}
