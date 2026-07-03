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

  generatePass(participantId: number, authorizedId: number, expirationMinutes: number = 15): Observable<any> {
    return this.http.post(`${this.baseUrl}/generate-pass`, { 
      participant_id: participantId, 
      authorized_id: authorizedId,
      expiration_minutes: expirationMinutes 
    });
  }

  getFamilyOptions(participantId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/family-options/${participantId}`);
  }

  generateExtraordinaryPass(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/generate-extraordinary-pass`, data);
  }

  updateParticipantProfile(participantId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/participant/${participantId}/profile`, data);
  }

  updateLeaveAlone(participantId: number, canLeaveAlone: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/update-leave-alone`, {
      participant_id: participantId,
      can_leave_alone: canLeaveAlone
    });
  }

  // --- Medical Questionnaires ---

  getMedicalFull(socioId: string | number): Observable<any> {
    // Assuming socioId is used; the API endpoint takes socio_id via query
    return this.http.get(`${environment.apiUrl}/medical-questionnaires/full?socio_id=${socioId}`);
  }

  saveMedicalFull(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/medical-questionnaires/full`, data);
  }

  getMedicalSimplified(guestId: string | number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/medical-questionnaires/simplified?guest_id=${guestId}`);
  }

  saveMedicalSimplified(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/medical-questionnaires/simplified`, data);
  }

  // --- Terms and Conditions ---
  getActiveTerms(modulo: string = 'Curso de Verano'): Observable<any> {
    return this.http.get(`${this.baseUrl}/terms/active?modulo=${encodeURIComponent(modulo)}`);
  }

  acceptTerms(termsId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/terms/accept`, { terms_id: termsId });
  }
}
