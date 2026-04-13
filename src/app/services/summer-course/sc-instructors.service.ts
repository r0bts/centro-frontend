import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScInstructorListResponse,
  ScInstructorResponse,
  CreateScInstructorRequest,
  UpdateScInstructorRequest,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScInstructorsService {
  private readonly base = `${environment.apiUrl}/summer-course/instructors`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ScInstructorListResponse> {
    return this.http.get<ScInstructorListResponse>(this.base);
  }

  getById(id: number): Observable<ScInstructorResponse> {
    return this.http.get<ScInstructorResponse>(`${this.base}/${id}`);
  }

  create(data: CreateScInstructorRequest): Observable<ScInstructorResponse> {
    return this.http.post<ScInstructorResponse>(this.base, data);
  }

  update(id: number, data: UpdateScInstructorRequest): Observable<ScInstructorResponse> {
    return this.http.put<ScInstructorResponse>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/${id}`);
  }
}
