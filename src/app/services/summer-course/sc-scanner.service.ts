import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummerCourseScannerService {
  private apiUrl = `${environment.apiUrl}/deportivo/summer-course`;

  constructor(private http: HttpClient) {}

  validatePickupPass(token: string) {
    return this.http.post(`${this.apiUrl}/validate-pickup-pass`, { token });
  }

  processPickupPass(payload: any) {
    return this.http.post(`${this.apiUrl}/process-pickup-pass`, payload);
  }

  processPickupPassMismatch(token: string) {
    return this.http.post(`${this.apiUrl}/process-pickup-pass-mismatch`, { token });
  }

  getPickupPassHistory(dateFilter: string = '') {
    let url = `${this.apiUrl}/get-pickup-pass-history`;
    if (dateFilter) {
      url += `?date=${dateFilter}`;
    }
    return this.http.get(url);
  }

  getCheckinHistory(dateFilter: string = '') {
    let url = `${this.apiUrl}/get-checkin-history`;
    if (dateFilter) {
      url += `?date=${dateFilter}`;
    }
    return this.http.get(url);
  }

  validateCheckin(token: string) {
    return this.http.post(`${this.apiUrl}/validate-checkin`, { token });
  }

  processCheckin(token: string) {
    return this.http.post(`${this.apiUrl}/process-checkin`, { token });
  }

  getInstructorChecklist(dateFilter: string = '') {
    let url = `${this.apiUrl}/get-instructor-checklist`;
    if (dateFilter) url += `?date=${dateFilter}`;
    return this.http.get(url);
  }

  lookupParticipant(token: string) {
    return this.http.post(`${this.apiUrl}/lookup-participant`, { token });
  }

  syncOnePayment(enrollmentId: number) {
    return this.http.post(
      `${environment.apiUrl}/summer-course/sync-payments/sync-one-payment`,
      { enrollment_id: enrollmentId }
    );
  }
}
