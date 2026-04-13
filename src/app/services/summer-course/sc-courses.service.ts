import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScCourseFormDataResponse,
  ScCourseListResponse,
  ScCourseResponse,
  CreateScCourseRequest,
  UpdateScCourseRequest,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScCoursesService {
  private readonly base = `${environment.apiUrl}/summer-course/courses`;

  constructor(private http: HttpClient) {}

  getFormData(): Observable<ScCourseFormDataResponse> {
    return this.http.get<ScCourseFormDataResponse>(`${this.base}/form-data`);
  }

  getAll(filters: { status?: string } = {}): Observable<ScCourseListResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<ScCourseListResponse>(this.base, { params });
  }

  getById(id: number): Observable<ScCourseResponse> {
    return this.http.get<ScCourseResponse>(`${this.base}/${id}`);
  }

  create(data: CreateScCourseRequest): Observable<ScCourseResponse> {
    return this.http.post<ScCourseResponse>(this.base, data);
  }

  update(id: number, data: UpdateScCourseRequest): Observable<ScCourseResponse> {
    return this.http.put<ScCourseResponse>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }
}
