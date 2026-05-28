import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScCredentialStatusResponse,
  ScCredentialPreviewResponse,
  ScCredentialDeliverRequest,
  ScCredentialDeliverResponse,
  ScPhotoUploadResponse,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScCredentialDeliveriesService {
  private readonly base     = `${environment.apiUrl}/summer-course/credential-deliveries`;
  private readonly baseDepo = `${environment.apiUrl}/deportivo/summer-course`;

  constructor(private http: HttpClient) {}

  /** GET /api/summer-course/credential-deliveries?course_id= */
  getStatus(courseId: number): Observable<ScCredentialStatusResponse> {
    const params = new HttpParams().set('course_id', courseId);
    return this.http.get<ScCredentialStatusResponse>(this.base, { params });
  }

  /** GET /api/deportivo/summer-course/participants/{id}/credential-preview?course_id= */
  getPreview(participantId: number, courseId: number): Observable<ScCredentialPreviewResponse> {
    const params = new HttpParams()
      .set('course_id', courseId)
      .set('_t', Date.now().toString());
    return this.http.get<ScCredentialPreviewResponse>(
      `${this.baseDepo}/participants/${participantId}/credential-preview`, { params }
    );
  }

  /**
   * POST /api/summer-course/credential-deliveries/deliver
   * Individual: { enrollment_id, notes }
   * Masivo:     { titular_socio_id, course_id, notes }
   */
  deliver(payload: ScCredentialDeliverRequest): Observable<ScCredentialDeliverResponse> {
    return this.http.post<ScCredentialDeliverResponse>(`${this.base}/deliver`, payload);
  }

  /**
   * POST /api/deportivo/summer-course/participants/{id}/photo
   * Body JSON: { photo_base64: "data:image/jpeg;base64,..." }
   */
  uploadPhoto(participantId: number, photoBase64: string): Observable<ScPhotoUploadResponse> {
    return this.http.post<ScPhotoUploadResponse>(
      `${this.baseDepo}/participants/${participantId}/photo`,
      { photo_base64: photoBase64 }
    );
  }
}
