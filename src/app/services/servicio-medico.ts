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
   * Actualiza los datos generales del perfil médico
   */
  updateMedicalProfile(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-medical-profile`, payload);
  }

  /**
   * Crea una nueva consulta médica (Interna/Externa)
   */
  createConsulta(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultas`, payload);
  }

  /**
   * Obtiene el historial de consultas de un paciente
   */
  getConsultas(token: string, filters?: any): Observable<any> {
    let params = [];
    if (token) params.push(`token=${token}`);
    
    if (filters) {
      if (filters.fecha_inicio) params.push(`fecha_inicio=${filters.fecha_inicio}`);
      if (filters.fecha_fin) params.push(`fecha_fin=${filters.fecha_fin}`);
      if (filters.ubicacion) params.push(`ubicacion=${filters.ubicacion}`);
      if (filters.medico) params.push(`medico=${filters.medico}`);
      if (filters.search) params.push(`search=${filters.search}`);
    }

    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get(`${this.apiUrl}/consultas${queryString}`);
  }

  /**
   * Obtiene la lista de médicos disponibles
   */
  getMedicos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/medicos`);
  }

  /**
   * Obtiene la lista de enfermeras disponibles
   */
  getEnfermeras(): Observable<any> {
    return this.http.get(`${this.apiUrl}/enfermeras`);
  }

  /**
   * Actualiza una consulta médica existente
   */
  updateConsulta(id: string | number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateConsulta/${id}`, payload);
  }

  /**
   * Elimina una consulta médica existente
   */
  deleteConsulta(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteConsulta/${id}`);
  }

  /**
   * Envía una notificación de WhatsApp al administrador de cursos de verano
   */
  notificarAdminCursos(payload: { name: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/notificar-admin-cursos`, payload);
  }

  /**
   * Obtiene la lista de productos (insumos médicos) desde NetSuite
   */
  getProducts(search: string = ''): Observable<any> {
    return this.http.get(`${environment.apiUrl}/products?limit=1000&search=${search}&active=true`);
  }

  /**
   * Obtiene la lista de ubicaciones
   */
  getLocations(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/acceso-clubes`);
  }
}
