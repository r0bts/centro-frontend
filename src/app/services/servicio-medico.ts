import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServicioMedicoService {
  private apiUrl = `${environment.apiUrl}/expedientes`;
  private sociosMedicalUrl = `${environment.apiUrl}/socios-medical`;
  private preregistrosUrl = `${environment.apiUrl}/preregistros`;
  private publicCuestionarioUrl = `${environment.apiUrl}/public/cuestionario`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la información médica de un socio
   * @param socioId El ID del socio
   */
  getSocioMedicalProfile(socioId: string | number): Observable<any> {
    return this.http.get(`${this.sociosMedicalUrl}/profile?id=${socioId}`);
  }

  /**
   * Actualiza los datos generales del perfil médico de un socio
   */
  updateSocioMedicalProfile(payload: any): Observable<any> {
    return this.http.post(`${this.sociosMedicalUrl}/profile`, payload);
  }

  /**
   * Sincroniza el perfil de salud de un solo socio con NetSuite
   */
  syncSocioHealth(socioId: string | number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/socios/sync-health/${socioId}`, {});
  }

  /**
   * Obtiene la información médica asociada a un QR del curso de verano, colaborador u otra entidad.
   * @param qrToken El token leído desde el código QR o número de empleado
   * @param type Tipo opcional ('empleado', 'externo', etc.)
   */
  getMedicalProfileByQr(qrToken: string, type?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-medical-profile`, { token: qrToken, type });
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
      if (filters.patient_type) params.push(`patient_type=${filters.patient_type}`);
      if (filters.limit) params.push(`limit=${filters.limit}`);
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
  getProducts(search: string = '', locationId: string = ''): Observable<any> {
    const encodedSearch = encodeURIComponent(search);
    const encodedCategory = encodeURIComponent('Servicio Médico,Material Medico');
    let url = `${environment.apiUrl}/products?limit=1000&search=${encodedSearch}&active=true&category_name=${encodedCategory}`;
    if (locationId) {
      url += `&location_id=${locationId}`;
    }
    return this.http.get(url);
  }

  /**
   * Obtiene la lista de ubicaciones
   */
  getLocations(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/locations?limit=1000&search=medico`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREREGISTROS Y CUESTIONARIOS MÉDICOS (ADMIN + PÚBLICO)
  // ═══════════════════════════════════════════════════════════════════════════

  getPreregistros(estado?: string, search?: string): Observable<any> {
    const params: string[] = [];
    if (estado) params.push(`estado=${encodeURIComponent(estado)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    const qs = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get(`${this.preregistrosUrl}${qs}`);
  }

  generatePreregistro(payload: any): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/generate`, payload);
  }

  approvePreregistro(id: number | string, payload: { notas_revision?: string } = {}): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/${id}/approve`, payload);
  }

  rejectPreregistro(id: number | string, payload: { notas_revision: string }): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/${id}/reject`, payload);
  }

  cancelPreregistro(id: number | string, payload: { notas_revision?: string } = {}): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/${id}/cancel`, payload);
  }

  reopenPreregistro(id: number | string, payload: { notas_revision?: string } = {}): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/${id}/reopen`, payload);
  }

  resendPreregistroEmail(id: number | string): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/${id}/resend-email`, {});
  }

  linkProspectoPreregistro(id: number | string, payload: { socio_id?: number; empleado_id?: number }): Observable<any> {
    return this.http.post(`${this.preregistrosUrl}/${id}/link-prospecto`, payload);
  }

  getProspectosExternos(search: string = ''): Observable<any> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get(`${this.preregistrosUrl}/prospectos-externos${qs}`);
  }

  getPublicCuestionario(token: string): Observable<any> {
    return this.http.get(`${this.publicCuestionarioUrl}/${encodeURIComponent(token)}`);
  }

  savePublicConsent(
    token: string,
    payload: {
      consent_step?: 'privacy' | 'sensitive' | 'all';
      consent_status: 'accepted' | 'privacy_accepted' | 'rejected';
      privacy_notice_accepted?: boolean;
      sensitive_consent_accepted?: boolean;
      source_url?: string;
    }
  ): Observable<any> {
    return this.http.post(`${this.publicCuestionarioUrl}/${encodeURIComponent(token)}/consent`, payload);
  }

  savePublicDraft(token: string, respuestas: any): Observable<any> {
    return this.http.post(`${this.publicCuestionarioUrl}/${encodeURIComponent(token)}/draft`, { respuestas });
  }

  submitPublicCuestionario(token: string, respuestas: any): Observable<any> {
    return this.http.post(`${this.publicCuestionarioUrl}/${encodeURIComponent(token)}/submit`, { respuestas });
  }

  getQuestionnaireSettings(): Observable<any> {
    return this.http.get(`${this.preregistrosUrl}/settings`);
  }

  updateQuestionnaireSettings(payload: any): Observable<any> {
    return this.http.put(`${this.preregistrosUrl}/settings`, payload);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIGILANCIA MÉDICA MUSCULOESQUELÉTICA (NOM-036-1-STPS-2018 · PVME)
  // Anexos A, B y C para Colaboradores
  // ═══════════════════════════════════════════════════════════════════════════

  getPvmeEvaluations(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/pvme?token=${encodeURIComponent(token)}`);
  }

  savePvmeEvaluation(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pvme`, payload);
  }

  deletePvmeEvaluation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pvme/${id}`);
  }

  getPvmeConfig(token?: string): Observable<any> {
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return this.http.get(`${this.apiUrl}/pvme-config${qs}`);
  }

  savePvmePuestoConfig(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pvme-config/puesto`, payload);
  }

  deletePvmePuestoConfig(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pvme-config/puesto/${id}`);
  }

  savePvmeEmpleadoConfig(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pvme-config/empleado`, payload);
  }
}
