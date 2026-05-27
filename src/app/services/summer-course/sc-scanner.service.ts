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

  processPickupPass(token: string) {
    return this.http.post(`${this.apiUrl}/process-pickup-pass`, { token });
  }

  getPickupPassHistory() {
    return this.http.get(`${this.apiUrl}/get-pickup-pass-history`);
  }
}
