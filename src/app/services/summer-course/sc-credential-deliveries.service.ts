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
  ScCredentialReplacementSummary,
} from '../../models/summer-course/summer-course.model';

export interface ScReplacementListResponse {
  success:  boolean;
  message:  string;
  data: {
    replacements: ScCredentialReplacementResult[];
    summary:      ScCredentialReplacementSummary;
  };
}

@Injectable({ providedIn: 'root' })
export class ScCredentialDeliveriesService {
  private readonly base     = `${environment.apiUrl}/summer-course/credential-deliveries`;
  private readonly baseDepo = `${environment.apiUrl}/deportivo/summer-course`;
  private readonly baseRep  = `${environment.apiUrl}/summer-course/credential-replacement`;

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

  /** POST /api/summer-course/credential-deliveries/deliver */
  deliver(payload: ScCredentialDeliverRequest): Observable<ScCredentialDeliverResponse> {
    return this.http.post<ScCredentialDeliverResponse>(`${this.base}/deliver`, payload);
  }

  /** POST /api/deportivo/summer-course/participants/{id}/photo */
  uploadPhoto(participantId: number, photoBase64: string): Observable<ScPhotoUploadResponse> {
    return this.http.post<ScPhotoUploadResponse>(
      `${this.baseDepo}/participants/${participantId}/photo`,
      { photo_base64: photoBase64 }
    );
  }

  /** POST /api/summer-course/credential-replacement — Solicitar nueva reposición */
  requestReplacement(enrollmentId: number, notes?: string): Observable<ScCredentialReplacementResponse> {
    return this.http.post<ScCredentialReplacementResponse>(
      this.baseRep,
      { enrollment_id: enrollmentId, notes: notes ?? undefined }
    );
  }

  /** GET /api/summer-course/credential-replacement?enrollment_id= — Lista de reposiciones */
  getReplacementList(enrollmentId: number): Observable<ScReplacementListResponse> {
    return this.http.get<ScReplacementListResponse>(
      this.baseRep,
      { params: { enrollment_id: enrollmentId.toString() } }
    );
  }

  /** POST /api/summer-course/credential-replacement/deliver — Entregar credencial pagada */
  deliverReplacement(replacementId: number): Observable<{ success: boolean; message: string; data: ScCredentialReplacementResult }> {
    return this.http.post<{ success: boolean; message: string; data: ScCredentialReplacementResult }>(
      `${this.baseRep}/deliver`,
      { replacement_id: replacementId }
    );
  }

  /** POST /api/summer-course/sync-payments/sync-credentials — Sync manual */
  syncCredentialReplacements(replacementId?: number): Observable<{ success: boolean; message: string; data: unknown }> {
    const body = replacementId ? { replacement_id: replacementId } : {};
    return this.http.post<{ success: boolean; message: string; data: unknown }>(
      `${environment.apiUrl}/summer-course/sync-payments/sync-credentials`,
      body
    );
  }
}

