import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScActivityFormDataResponse,
  ScActivityListResponse,
  ScActivityResponse,
  ScScheduleResponse,
  ScScheduleSavePayload,
  CreateScActivityRequest,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScActivitiesService {
  private readonly base = `${environment.apiUrl}/summer-course/activities`;

  constructor(private http: HttpClient) {}

  getFormData(): Observable<ScActivityFormDataResponse> {
    return this.http.get<ScActivityFormDataResponse>(`${this.base}/form-data`);
  }

  getAll(filters: { week_id?: number; course_id?: number } = {}): Observable<ScActivityListResponse> {
    let params = new HttpParams();
    if (filters.week_id)   params = params.set('week_id',   filters.week_id);
    if (filters.course_id) params = params.set('course_id', filters.course_id);
    return this.http.get<ScActivityListResponse>(this.base, { params });
  }

  getById(id: number): Observable<ScActivityResponse> {
    return this.http.get<ScActivityResponse>(`${this.base}/${id}`);
  }

  create(data: CreateScActivityRequest): Observable<ScActivityResponse> {
    return this.http.post<ScActivityResponse>(this.base, data);
  }

  update(id: number, data: Partial<CreateScActivityRequest>): Observable<ScActivityResponse> {
    return this.http.put<ScActivityResponse>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }

  // ── Schedule ──────────────────────────────────────────────────────

  getSchedule(week_id: number): Observable<ScScheduleResponse> {
    const params = new HttpParams().set('week_id', week_id);
    return this.http.get<ScScheduleResponse>(`${this.base}/schedule`, { params });
  }

  saveSchedule(payload: ScScheduleSavePayload): Observable<{ success: boolean; message: string; saved: number }> {
    return this.http.post<{ success: boolean; message: string; saved: number }>(`${this.base}/schedule`, payload);
  }
}
