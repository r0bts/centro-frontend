import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScInstructorListResponse,
  ScInstructorResponse,
  CreateScInstructorRequest,
  UpdateScInstructorRequest,
  ScInstructorCredentialPreviewResponse,
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

  // ── Credencial ─────────────────────────────────────────────────────────────

  /** GET /api/summer-course/instructors/{id}/credential-preview?course_id= */
  getCredentialPreview(instructorId: number, courseId: number): Observable<ScInstructorCredentialPreviewResponse> {
    const params = new HttpParams()
      .set('course_id', courseId)
      .set('_t', Date.now().toString());
    return this.http.get<ScInstructorCredentialPreviewResponse>(
      `${this.base}/${instructorId}/credential-preview`, { params }
    );
  }

  /** POST /api/summer-course/instructors/{id}/photo */
  uploadInstructorPhoto(instructorId: number, courseId: number, photoBase64: string): Observable<{ success: boolean; data: { photo_url: string } }> {
    return this.http.post<{ success: boolean; data: { photo_url: string } }>(
      `${this.base}/${instructorId}/photo`,
      { photo_base64: photoBase64, course_id: courseId }
    );
  }

  /** PATCH /api/summer-course/instructors/{id}/assign-group */
  assignGroup(instructorId: number, groupId: number | null): Observable<ScInstructorResponse> {
    return this.http.patch<ScInstructorResponse>(
      `${this.base}/${instructorId}/assign-group`,
      { group_id: groupId }
    );
  }

  /** POST /api/summer-course/instructors/{id}/deliver-credential */
  deliverCredential(instructorId: number, courseId: number, notes?: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.base}/${instructorId}/deliver-credential`,
      { course_id: courseId, notes: notes ?? undefined }
    );
  }
}
