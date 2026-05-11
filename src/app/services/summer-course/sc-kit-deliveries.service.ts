import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScKitStatusResponse,
  ScKitDeliverRequest,
  ScKitDeliverResponse,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScKitDeliveriesService {
  private readonly base = `${environment.apiUrl}/summer-course/kit-deliveries`;

  constructor(private http: HttpClient) {}

  /** GET /api/summer-course/kit-deliveries?course_id= */
  getStatus(courseId: number): Observable<ScKitStatusResponse> {
    const params = new HttpParams().set('course_id', courseId);
    return this.http.get<ScKitStatusResponse>(this.base, { params });
  }

  /**
   * POST /api/summer-course/kit-deliveries/deliver
   * Individual:  { enrollment_id, received_by_name, notes }
   * Masivo:      { titular_socio_id, course_id, received_by_name, notes }
   */
  deliver(payload: ScKitDeliverRequest): Observable<ScKitDeliverResponse> {
    return this.http.post<ScKitDeliverResponse>(`${this.base}/deliver`, payload);
  }
}
