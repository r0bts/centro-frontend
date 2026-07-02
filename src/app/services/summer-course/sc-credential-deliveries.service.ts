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
  ScCredentialReplacementResponse,
  ScCredentialReplacementResult,
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

  /**
   * POST /api/summer-course/credential-replacement
   * Genera una SO en NetSuite por reposición de credencial perdida/dañada.
   */
  requestReplacement(enrollmentId: number, notes?: string): Observable<ScCredentialReplacementResponse> {
    return this.http.post<ScCredentialReplacementResponse>(
      `${environment.apiUrl}/summer-course/credential-replacement`,
      { enrollment_id: enrollmentId, notes: notes ?? undefined }
    );
  }

  /**
   * GET /api/summer-course/credential-replacement?enrollment_id=
   * Consulta el estado de la reposición de credencial para una inscripción.
   */
  getReplacementStatus(enrollmentId: number): Observable<{ success: boolean; message: string; data: { replacement: ScCredentialReplacementResult | null } }> {
    return this.http.get<{ success: boolean; message: string; data: { replacement: ScCredentialReplacementResult | null } }>(
      `${environment.apiUrl}/summer-course/credential-replacement`,
      { params: { enrollment_id: enrollmentId.toString() } }
    );
  }

  /**
   * POST /api/summer-course/sync-payments/sync-credentials
   * Dispara manualmente el sync de reposiciones contra NetSuite.
   */
  syncCredentialReplacements(replacementId?: number): Observable<{ success: boolean; message: string; data: unknown }> {
    const body = replacementId ? { replacement_id: replacementId } : {};
    return this.http.post<{ success: boolean; message: string; data: unknown }>(
      `${environment.apiUrl}/summer-course/sync-payments/sync-credentials`,
      body
    );
  }
}

