/**
 * ==================================================================================
 * SERVICIO: RequisitionService
 * ==================================================================================
 * 
 * Gestiona todas las operaciones de requisiciones incluyendo sincronización automática
 * con NetSuite en operaciones de entrega y devolución.
 * 
 * MÉTODOS CLAVE PARA SURTIDO (warehouse-supply.component):
 * ========================================================
 * 
 * 1. markReady(id, items)
 *    POST /api/requisitions/{id}/mark-ready
 *    Registra cantidades entregadas (delivered_quantity) y genera PIN
 *    ✅ Guarda en BD
 *    ❌ No sincroniza NetSuite
 * 
 * 2. deliver(id, pin)
 *    POST /api/requisitions/{id}/deliver
 *    Valida PIN y completa entrega
 *    ✅ Sincroniza NetSuite si awaiting_return = false
 *    ❌ No sincroniza NetSuite si awaiting_return = true (diferido)
 *    
 *    Sincronización NetSuite:
 *    - Sin devolución: Ajuste -(delivered - 0)
 *    - Con devolución: Sin ajuste (diferido a process-return)
 * 
 * 3. processReturn(id, items, notes)
 *    POST /api/requisitions/{id}/process-return
 *    Registra devolución y cierra requisición
 *    ✅ Sincroniza NetSuite siempre
 *    
 *    Sincronización NetSuite:
 *    - Ajuste: -(delivered - returned)
 *    - Si returned = delivered: Sin ajuste (filtrado)
 *    - ⚠️  SOLO SE PUEDE EJECUTAR UNA VEZ
 * 
 * ==================================================================================
 * FLUJO COMPLETO CON NETSUITE
 * ==================================================================================
 * 
 * CASO 1: Entrega Normal (sin devolución)
 * 1. markReady(id, items)     → BD: delivered_quantity = [10, 5]
 * 2. deliver(id, pin)          → NetSuite: -(10-0)=-10, -(5-0)=-5 ✅ Sincronizado
 *    Estado: entregado (CERRADA)
 * 
 * CASO 2: Entrega con Devolución Parcial
 * 1. markReady(id, items)     → BD: delivered_quantity = [10, 5]
 * 2. deliver(id, pin)          → ⏳ NetSuite: Sin cambios (devolución pendiente)
 *    Estado: espera_devolucion (ABIERTA)
 * 3. processReturn(id, items)  → NetSuite: -(10-4)=-6, -(5-2)=-3 ✅ Sincronizado
 *    BD: returned_quantity = [4, 2]
 *    Estado: entregado (CERRADA)
 * 
 * CASO 3: Entrega con Devolución Total
 * 1. markReady(id, items)     → BD: delivered_quantity = [10, 5]
 * 2. deliver(id, pin)          → ⏳ NetSuite: Sin cambios (devolución pendiente)
 *    Estado: espera_devolucion (ABIERTA)
 * 3. processReturn(id, items)  → NetSuite: -(10-10)=0, -(5-5)=0 (sin ajuste, filtrado)
 *    BD: returned_quantity = [10, 5]
 *    Estado: entregado (CERRADA)
 * 
 * ==================================================================================
 * MANEJO DE ERRORES NETSUITE
 * ==================================================================================
 * 
 * ✅ No bloqueante: Si NetSuite falla, la operación local se completa
 * 📊 Campo netsuite_sync en response contiene:
 *    - success: true/false
 *    - adjustments_created: número de ajustes creados
 *    - items_synced: número de items procesados
 *    - error: mensaje de error (null si exitoso)
 * 
 * ⚠️  Verificar siempre netsuite_sync.success en la UI
 * 
 * ==================================================================================
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

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
  max_quantity: number | null; // null = sin límite
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

/**
 * Response de NetSuite sync info
 */
export interface NetsuiteSyncInfo {
  success: boolean;
  adjustments_created: number;
  items_synced: number;
  error: string | null;
}

/**
 * Response del endpoint deliver
 */
export interface DeliverResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: string;
    delivered_at: string;
    awaiting_return: boolean;
    pickup_person?: {
      id: string;
      full_name: string;
    } | null;
    netsuite_sync?: NetsuiteSyncInfo;
    items_delivered?: Array<{
      item_id: number;
      delivered: number;
      requested: number;
    }>;
  };
}

/**
 * Response del endpoint process-return
 */
export interface ProcessReturnResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    previous_status: string;
    current_status: string;
    processed_at: string;
    awaiting_return: boolean;
    items_returned?: Array<{
      item_id: number;
      delivered: number;
      returned_quantity: number;
    }>;
    return_notes?: string | null;
    netsuite_sync?: NetsuiteSyncInfo;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RequisitionService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) { }

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
   * Endpoint: GET /api/requisitions/form-data?location_id={location_id}
   * 
   * Obtiene el location_id del usuario guardado en localStorage.
   * 
   * Comportamiento de filtrado:
   * - location_id = 0: Todos los usuarios (483) y ambas ubicaciones
   * - location_id = 1: Solo usuarios de HERMES (147) y ubicación HERMES
   * - location_id = 9: Solo usuarios de GLACIAR y ubicación GLACIAR
   */
  getFormData(): Observable<RequisitionFormDataResponse> {
    // Obtener location_id del usuario guardado en localStorage
    const userJson = this.storageService.getItem('centro_user');
    let locationId = 0;
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        locationId = user.location_id || 0;
      } catch {
        locationId = 0;
      }
    }    
    const params = { location_id: locationId.toString() };
    return this.http.get<RequisitionFormDataResponse>(`${this.API_URL}/requisitions/form-data`, { params }).pipe(
      tap(response => console.log('✅ Form data cargado:', {
        locationId,
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
   * Eliminar una requisición (soft-delete)
   * Endpoint: DELETE /api/requisitions/{id}
   */
  deleteRequisition(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/requisitions/${id}`).pipe(
      tap(response => console.log('✅ Requisición eliminada:', response)),
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
   * =========================================
   * Endpoint: POST /api/requisitions/{id}/mark-ready
   * 
   * DESCRIPCIÓN:
   * Registra las cantidades surtidas (delivered_quantity) y marca como "listo_recoger".
   * Genera un PIN de 4 dígitos para validar la entrega posterior.
   * 
   * NO SINCRONIZA CON NETSUITE en este paso.
   * La sincronización ocurre cuando se ejecuta deliver().
   * 
   * BODY:
   * {
   *   "items": [
   *     {"item_id": 15, "delivered_quantity": 10.00},
   *     {"item_id": 16, "delivered_quantity": 5.50}
   *   ]
   * }
   * 
   * RESPONSE (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "REQ-0004",
   *     "current_status": "Listo para Recoger",
   *     "ready_at": "2026-01-05T14:23:45-06:00",
   *     "pin": "1234",  // ← PIN de 4 dígitos para deliver()
   *     "pickup_person": {...},
   *     "items_ready": [...]
   *   }
   * }
   */
  markReady(id: string, items: Array<{item_id: number, delivered_quantity: number}>): Observable<any> {
    return this.http.post(`${this.API_URL}/requisitions/${id}/mark-ready`, { items }).pipe(
      tap(response => console.log('✅ Requisición marcada como lista (BD actualizada, NetSuite: pendiente):', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Entregar requisición validando PIN y sincronizando NetSuite
   * ===========================================================
   * Endpoint: POST /api/requisitions/{id}/deliver
   * 
   * DESCRIPCIÓN:
   * Valida el PIN de 4 dígitos y completa la entrega.
   * Las cantidades ya fueron registradas en markReady().
   * 
   * SINCRONIZACIÓN CON NETSUITE (Automática):
   * 
   * SI awaiting_return = false (entrega normal):
   *   ✅ Se ejecuta sincronización automática
   *   ✅ Se crean Inventory Adjustments
   *   ✅ Fórmula: -(delivered_quantity - 0)
   *   ✅ Response incluye campo netsuite_sync con:
   *      {
   *        "success": boolean,
   *        "adjustments_created": number,
   *        "items_synced": number,
   *        "error": string|null
   *      }
   * 
   * SI awaiting_return = true (en espera de devolución):
   *   ❌ NO se sincroniza con NetSuite
   *   ❌ Response NO incluye campo netsuite_sync
   *   ℹ️  Sincronización ocurre cuando se llame processReturn()
   * 
   * BODY:
   * {
   *   "pin": "1234"  // El mismo PIN generado en markReady()
   * }
   * 
   * RESPONSE - SIN DEVOLUCIÓN (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "REQ-0004",
   *     "status": "Entregado",
   *     "delivered_at": "2026-01-05T15:30:22-06:00",
   *     "awaiting_return": false,
   *     "pickup_person": {...},
   *     "netsuite_sync": {
   *       "success": true,
   *       "adjustments_created": 2,
   *       "items_synced": 5,
   *       "error": null
   *     }
   *   }
   * }
   * 
   * RESPONSE - CON DEVOLUCIÓN PENDIENTE (200 OK):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "REQ-0004",
   *     "status": "Espera Devolución",
   *     "delivered_at": "2026-01-05T15:30:22-06:00",
   *     "awaiting_return": true,
   *     "pickup_person": {...}
   *     // ⚠️ NO incluye netsuite_sync
   *   }
   * }
   * 
   * ERRORES POSIBLES:
   * - 400: PIN incorrecto (code: INVALID_PIN)
   * - 400: Estado no válido (code: INVALID_STATUS)
   * - 404: Requisición no encontrada
   */
  deliver(id: string, pin: string): Observable<DeliverResponse> {
    return this.http.post<DeliverResponse>(`${this.API_URL}/requisitions/${id}/deliver`, { pin }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Procesar devolución de productos y sincronizar NetSuite
   * ======================================================
   * Endpoint: POST /api/requisitions/{id}/process-return
   * 
   * ⚠️  IMPORTANTE - ACCIÓN IRREVERSIBLE:
   * Esta operación solo puede ejecutarse UNA SOLA VEZ por requisición.
   * Después de procesar, la requisición se cierra (estado "entregado").
   * No se permiten devoluciones adicionales.
   * 
   * DESCRIPCIÓN:
   * Registra los productos devueltos y sincroniza con NetSuite.
   * 
   * SINCRONIZACIÓN CON NETSUITE (Automática):
   * ✅ Se ejecuta sincronización automática
   * ✅ Se crean Inventory Adjustments
   * ✅ Fórmula: -(delivered_quantity - returned_quantity)
   * 
   * Ejemplos de cálculo:
   * - 10 entregados, 10 devueltos: -(10 - 10) = 0 → Sin ajuste
   * - 10 entregados, 4 devueltos:  -(10 - 4) = -6 → Reduce 6 unidades
   * - 10 entregados, 0 devueltos:  -(10 - 0) = -10 → Reduce 10 unidades
   * 
   * BODY:
   * {
   *   "items": [
   *     {"item_id": 15, "returned_quantity": 4.00},
   *     {"item_id": 16, "returned_quantity": 2.00}
   *   ],
   *   "notes": "Devolución parcial - productos dañados"  // opcional
   * }
   * 
   * RESPONSE (200 OK):
   * {
   *   "success": true,
   *   "message": "Devolución procesada exitosamente - Requisición cerrada",
   *   "data": {
   *     "id": "REQ-0004",
   *     "previous_status": "Espera Devolución",
   *     "current_status": "Entregado",  // ← CERRADA
   *     "processed_at": "2026-01-05T16:45:12-06:00",
   *     "awaiting_return": false,
   *     "items_returned": [
   *       {
   *         "item_id": 15,
   *         "delivered": 10.00,
   *         "returned": 4.00
   *       },
   *       {
   *         "item_id": 16,
   *         "delivered": 5.50,
   *         "returned": 2.00
   *       }
   *     ],
   *     "return_notes": "...",
   *     "netsuite_sync": {
   *       "success": true,
   *       "adjustments_created": 2,
   *       "items_synced": 2,
   *       "error": null
   *     }
   *   }
   * }
   * 
   * ERRORES POSIBLES:
   * - 400: Estado no válido - ya fue devuelto (code: INVALID_STATUS, current_status: "Entregado")
   * - 400: Estado no válido - no está en espera de devolución
   * - 400: Cantidad devuelta excede lo entregado
   * - 404: Requisición no encontrada
   * 
   * DESPUÉS DE PROCESAR:
   * - Estado cambia a "Entregado" (CERRADA)
   * - awaiting_return = false
   * - Próximos intentos de devolución serán rechazados con error 400
   */
  processReturn(id: string, items: Array<{item_id: number, returned_quantity: number}>, notes?: string): Observable<ProcessReturnResponse> {
    const body: any = { items };
    if (notes) {
      body.notes = notes;
    }
    return this.http.post<ProcessReturnResponse>(`${this.API_URL}/requisitions/${id}/process-return`, body).pipe(
      tap(response => {
        const netsuiteStat = response.data.netsuite_sync;
        if (netsuiteStat?.success) {
          console.log('✅ Devolución procesada + NetSuite sincronizado exitosamente:', response);
        } else if (netsuiteStat?.error) {
          console.warn('⚠️  Devolución procesada pero NetSuite falló:', netsuiteStat.error);
        } else {
          console.log('✅ Devolución procesada:', response);
        }
      }),
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

  /**
   * Cerrar entrega parcial — cambia entrega_parcial → entregado sin PIN ni NetSuite.
   * Requiere permiso close_partial (submodule_id=7, permission_id=45).
   * Endpoint: POST /api/requisitions/{id}/close-partial
   */
  closePartial(id: string): Observable<any> {
    return this.http.post(`${this.API_URL}/requisitions/${id}/close-partial`, {}).pipe(
      tap(response => console.log('✅ Entrega parcial cerrada:', response)),
      catchError(this.handleError)
    );
  }
}
