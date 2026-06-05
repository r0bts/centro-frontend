import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorApiService {
  private baseUrl = `${environment.apiUrl}/tutor-portal`;

  constructor(private http: HttpClient) {}

  getChildren(): Observable<any> {
    return this.http.get(`${this.baseUrl}/children`);
  }

  getPickups(): Observable<any> {
    return this.http.get(`${this.baseUrl}/pickups`);
  }

  addPickup(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pickups/add`, data);
  }

  deletePickup(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/pickups/${id}`);
  }

  generatePass(participantId: number, authorizedId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/generate-pass`, { participant_id: participantId, authorized_id: authorizedId });
  }
}
