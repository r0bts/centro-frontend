import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces para el response del backend

/**
 * Producto del catálogo
 * Nota: La unidad ya viene definida desde el backend
 * Unidades posibles: PIEZA, KILO, LITRO, METRO
 */
export interface RequisitionProduct {
  id: string;
  code: string;
  name: string;
  unit: string; // La unidad viene del backend, no es editable
}

/**
 * Departamento organizacional
 */
export interface Department {
  id: string;
  name: string;
}

/**
 * Locación física (GLACIAR, HERMES)
 */
export interface Location {
  id: string;
  name: string;
}

/**
 * Proyecto/Evento especial
 */
export interface Project {
  id: string;
  name: string;
  date: string; // Formato: "YYYY-MM-DD"
}

/**
 * Usuario del sistema (empleado)
 */
export interface RequisitionUser {
  id: string;
  username: string;
  full_name: string;
  employee_number: string;
}

/**
 * Área física del centro
 */
export interface RequisitionArea {
  id: string;
  name: string;
}

/**
 * Opción de estado de requisición
 */
export interface StatusOption {
  value: string;
  label: string;
}

/**
 * Datos del formulario de requisiciones
 */
export interface RequisitionFormData {
  products: RequisitionProduct[];
  departments: Department[];
  locations: Location[];
  projects: Project[];
  users: RequisitionUser[];
  areas: RequisitionArea[];
  status_options: StatusOption[];
}

/**
 * Response del endpoint /api/requisitions/form-data
 */
export interface RequisitionFormDataResponse {
  success: boolean;
  data: RequisitionFormData;
}

/**
 * Item de requisición para crear
 */
export interface RequisitionItemPayload {
  product_id: number;
  requested_quantity: number;
  area_id: number;
  unit: string;
  notes?: string;
}

/**
 * Payload para crear una requisición
 */
export interface CreateRequisitionPayload {
  requester_id: number; // ID del usuario logueado (quien crea)
  pickup_user_id?: number; // ID del empleado que recogerá la requisición
  delivery_date: string; // REQUERIDO - Formato YYYY-MM-DD
  delivery_time: string; // REQUERIDO - Formato HH:MM:SS
  location_id: number; // REQUERIDO - ID del almacén (1=HERMES, 9=GLACIAR)
  department_id?: number;
  project_id?: number;
  awaiting_return: boolean;
  notes?: string;
  items: RequisitionItemPayload[];
}

/**
 * Response de crear requisición
 */
export interface CreateRequisitionResponse {
  success: boolean;
  message: string;
  data: {
    requisition_id: string;
    requisition_number?: string;
    pin: string; // ⭐ PIN de 4 dígitos para seguridad de entrega
    status: string; // 'solicitado' o 'autorizado'
    auto_authorized: boolean; // ⭐ true si fue autorizada automáticamente
    authorized_by?: {
      id: string;
      username: string;
      full_name: string;
    } | null;
    authorization_date?: string | null;
    request_date: string;
    created_at: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RequisitionService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Manejo de errores HTTP
   * El token se agrega automáticamente por el authInterceptor
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    console.error('❌ Error en RequisitionService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Obtiene los datos necesarios para el formulario de requisiciones
   * Endpoint: GET /api/requisitions/form-data
   * 
   * Retorna: 651 productos, 560 usuarios, 78 áreas, 141 proyectos, etc.
   */
  getFormData(): Observable<RequisitionFormDataResponse> {
    return this.http.get<RequisitionFormDataResponse>(`${this.API_URL}/requisitions/form-data`).pipe(
      tap(response => console.log('✅ Form data cargado:', {
        products: response.data.products.length,
        users: response.data.users.length,
        departments: response.data.departments.length,
        locations: response.data.locations.length,
        projects: response.data.projects.length,
        areas: response.data.areas.length,
        statusOptions: response.data.status_options.length
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Crear una nueva requisición
   * Endpoint: POST /api/requisitions
   */
  createRequisition(requisitionData: CreateRequisitionPayload): Observable<CreateRequisitionResponse> {
    return this.http.post<CreateRequisitionResponse>(`${this.API_URL}/requisitions`, requisitionData).pipe(
      tap(response => console.log('✅ Requisición creada:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener lista de requisiciones
   * Endpoint: GET /api/requisitions
   */
  getRequisitions(params?: any): Observable<any> {
    return this.http.get(`${this.API_URL}/requisitions`, { params }).pipe(
      tap(response => console.log('✅ Requisiciones obtenidas:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener detalles de una requisición específica
   * Endpoint: GET /api/requisitions/{id}
   */
  getRequisitionById(id: string): Observable<any> {
    const url = `${this.API_URL}/requisitions/${id}`;
    console.log('🌐 GET Request a:', url);
    return this.http.get(url).pipe(
      tap(response => console.log('✅ Requisición obtenida:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar una requisición
   * Endpoint: PUT /api/requisitions/{id}
   */
  updateRequisition(id: string, requisitionData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/requisitions/${id}`, requisitionData).pipe(
      tap(response => console.log('✅ Requisición actualizada:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Autorizar una requisición
   * Endpoint: POST /api/requisitions/{id}/authorize
   */
  authorizeRequisition(id: string): Observable<any> {
    return this.http.post(`${this.API_URL}/requisitions/${id}/authorize`, {}).pipe(
      tap(response => console.log('✅ Requisición autorizada:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Cancelar una requisición
   * Endpoint: POST /api/requisitions/{id}/cancel
   */
  cancelRequisition(id: string, reason?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/requisitions/${id}/cancel`, { reason }).pipe(
      tap(response => console.log('✅ Requisición cancelada:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Marcar requisición como lista para recoger
   * Endpoint: POST /api/requisitions/{id}/mark-ready
   */
  markReady(id: string, items: Array<{item_id: number, delivered_quantity: number}>): Observable<any> {
    return this.http.post(`${this.API_URL}/requisitions/${id}/mark-ready`, { items }).pipe(
      tap(response => console.log('✅ Requisición marcada como lista:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Entregar requisición con PIN
   * Endpoint: POST /api/requisitions/{id}/deliver
   */
  deliver(id: string, pin: string, items?: Array<{item_id: number, delivered_quantity: number}>): Observable<any> {
    const body: any = { pin };
    if (items && items.length > 0) {
      body.items = items;
    }
    return this.http.post(`${this.API_URL}/requisitions/${id}/deliver`, body).pipe(
      tap(response => console.log('✅ Requisición entregada:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Procesar devolución de productos
   * Endpoint: POST /api/requisitions/{id}/process-return
   */
  processReturn(id: string, items: Array<{item_id: number, returned_quantity: number}>, notes?: string): Observable<any> {
    const body: any = { items };
    if (notes) {
      body.notes = notes;
    }
    return this.http.post(`${this.API_URL}/requisitions/${id}/process-return`, body).pipe(
      tap(response => console.log('✅ Devolución procesada:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Marcar en espera de devolución
   * Endpoint: POST /api/requisitions/{id}/await-return
   */
  awaitReturn(id: string, notes?: string): Observable<any> {
    const body: any = {};
    if (notes) {
      body.notes = notes;
    }
    return this.http.post(`${this.API_URL}/requisitions/${id}/await-return`, body).pipe(
      tap(response => console.log('✅ Marcada en espera de devolución:', response)),
      catchError(this.handleError)
    );
  }
}
