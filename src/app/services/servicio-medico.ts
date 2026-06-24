import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServicioMedicoService {
  private apiUrl = `${environment.apiUrl}/expedientes`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la información médica asociada a un QR del curso de verano (u otra entidad).
   * @param qrToken El token leído desde el código QR
   */
  getMedicalProfileByQr(qrToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-medical-profile`, { token: qrToken });
  }

  /**
   * Crea una nueva consulta médica
   */
  createConsulta(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/createConsulta`, payload);
  }

  /**
   * Actualiza una consulta médica existente
   */
  updateConsulta(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateConsulta/${id}`, payload);
  }
}
