import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScLevelGroupListResponse,
  ScLevelGroupResponse,
  ScLevelGroupFormDataResponse,
  CreateScLevelGroupRequest,
  UpdateScLevelGroupRequest,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScLevelGroupsService {
  private readonly base = `${environment.apiUrl}/summer-course/level-groups`;

  constructor(private http: HttpClient) {}

  /** GET /level-groups/form-data — usuarios del departamento deportivo */
  getFormData(): Observable<ScLevelGroupFormDataResponse> {
    return this.http.get<ScLevelGroupFormDataResponse>(`${this.base}/form-data`);
  }

  getByCourse(courseId: number): Observable<ScLevelGroupListResponse> {
    const params = new HttpParams().set('course_id', courseId);
    return this.http.get<ScLevelGroupListResponse>(this.base, { params });
  }

  /** GET /level-groups — V2: grupos globales sin filtro de curso */
  getAll(): Observable<ScLevelGroupListResponse> {
    return this.http.get<ScLevelGroupListResponse>(this.base);
  }

  create(data: CreateScLevelGroupRequest): Observable<ScLevelGroupResponse> {
    return this.http.post<ScLevelGroupResponse>(this.base, data);
  }

  update(id: number, data: UpdateScLevelGroupRequest): Observable<ScLevelGroupResponse> {
    return this.http.put<ScLevelGroupResponse>(`${this.base}/${id}`, data);
  }

  remove(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }
}
