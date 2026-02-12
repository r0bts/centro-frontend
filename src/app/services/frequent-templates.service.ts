import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// ==================================================================================
// INTERFACES
// ==================================================================================

export interface TemplateArea {
  id: number | null;
  area: string;
}

export interface TemplateCreator {
  id: number;
  username: string;
  full_name: string;
}

export interface Template {
  id: number;
  name: string;
  description: string | null;
  created_by: TemplateCreator;
  created_from: string | null;
  created_date: string;
  is_public: boolean;
  use_count: number;
  last_used_at: string | null;
  areas: TemplateArea[];
  total_areas: number;
  total_products: number;
  can_edit: boolean;
  is_owner: boolean;
  shared_with_me: boolean;
}

export interface TemplateProduct {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface TemplateAreaDetail {
  area: string;
  products: TemplateProduct[];
}

export interface ConsolidatedProduct {
  name: string;
  total_quantity: number;
  unit: string;
}

export interface TemplateDetail {
  id: number;
  name: string;
  description: string | null;
  created_by: TemplateCreator;
  created_from: string | null;
  created_date: string;
  is_public: boolean;
  location: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  awaiting_return: boolean;
  notes: string | null;
  use_count: number;
  last_used_at: string | null;
  areas: TemplateAreaDetail[];
  consolidated_products: ConsolidatedProduct[];
}

export interface GetTemplatesResponse {
  success: boolean;
  data: {
    templates: Template[];
    total: number;
    filters_applied: {
      filter: string;
      search: string;
      order_by: string;
    };
  };
}

export interface CreateTemplateRequest {
  requisition_id: string;
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface CreateTemplateResponse {
  success: boolean;
  message: string;
  data: {
    template_id: number;
    name: string;
    description: string | null;
    created_from: string;
    is_public: boolean;
    created_by: TemplateCreator;
    items_count: number;
    created_at: string;
  };
}

export interface ShareTemplateRequest {
  user_ids: number[];
  can_edit: boolean;
}

export interface ShareTemplateResponse {
  success: boolean;
  message: string;
  data: {
    template_id: number;
    shared_with: Array<{
      user_id: number;
      username: string;
      full_name: string;
      can_edit: boolean;
      shared_at: string;
    }>;
    already_shared: Array<{
      user_id: number;
      username: string;
      full_name: string;
    }>;
    errors: any[];
  };
}

export interface DeleteTemplateResponse {
  success: boolean;
  message: string;
  data: {
    template_id: number;
    deleted_at: string;
  };
}

// ==================================================================================
// SERVICE
// ==================================================================================

@Injectable({
  providedIn: 'root'
})
export class FrequentTemplatesService {
  private apiUrl = `${environment.apiUrl}/requisition-templates`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtener headers con autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * GET /api/requisition-templates
   * Listar plantillas disponibles para el usuario
   * 
   * @param filter 'my' | 'shared' | 'public' | 'all' (default: 'all')
   * @param search Término de búsqueda en nombre/descripción
   * @param orderBy 'recent' | 'popular' | 'name' (default: 'recent')
   */
  getTemplates(
    filter: string = 'all',
    search: string = '',
    orderBy: string = 'recent'
  ): Observable<GetTemplatesResponse> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (filter && filter !== 'all') params.push(`filter=${filter}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (orderBy && orderBy !== 'recent') params.push(`order_by=${orderBy}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    console.log('🌐 [FrequentTemplatesService] GET Request a:', url);
    console.log('🔑 [FrequentTemplatesService] Headers:', this.getHeaders());

    return this.http.get<GetTemplatesResponse>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * GET /api/requisition-templates/{id}
   * Obtener detalles completos de una plantilla
   */
  getTemplateDetails(id: number): Observable<{ success: boolean; data: { template: TemplateDetail } }> {
    return this.http.get<{ success: boolean; data: { template: TemplateDetail } }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /api/requisition-templates
   * Crear plantilla desde una requisición existente
   */
  createTemplate(request: CreateTemplateRequest): Observable<CreateTemplateResponse> {
    return this.http.post<CreateTemplateResponse>(
      this.apiUrl,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * PUT /api/requisition-templates/{id}
   * Editar plantilla (nombre, descripción, is_public)
   */
  updateTemplate(
    id: number,
    data: { name?: string; description?: string; is_public?: boolean }
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/requisition-templates/{id}
   * Eliminar plantilla (soft delete)
   */
  deleteTemplate(id: number): Observable<DeleteTemplateResponse> {
    return this.http.delete<DeleteTemplateResponse>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /api/requisition-templates/{id}/share
   * Compartir plantilla con usuarios
   */
  shareTemplate(id: number, request: ShareTemplateRequest): Observable<ShareTemplateResponse> {
    return this.http.post<ShareTemplateResponse>(
      `${this.apiUrl}/${id}/share`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /api/requisition-templates/{id}/duplicate
   * Duplicar una plantilla existente
   */
  duplicateTemplate(id: number, newName?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/duplicate`,
      { new_name: newName },
      { headers: this.getHeaders() }
    );
  }
}
