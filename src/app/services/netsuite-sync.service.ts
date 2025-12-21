import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SyncResponse {
  success: boolean;
  message: string;
  data: {
    total_from_netsuite?: number;
    total?: number;
    created?: number;
    updated?: number;
    errors?: number;
    synced: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NetsuiteSyncService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Sincroniza usuarios desde NetSuite
   * POST /api/users/sync
   * Total: 824 registros (aprox)
   */
  syncUsers(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/users/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza productos desde NetSuite
   * POST /api/products/sync
   * Total: 1,000 registros
   */
  syncProducts(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/products/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza departamentos desde NetSuite
   * POST /api/departments/sync
   * Total: 42 registros
   */
  syncDepartments(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/departments/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza áreas desde NetSuite
   * POST /api/areas/sync
   * Total: 78 registros
   */
  syncAreas(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/areas/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza ubicaciones desde NetSuite
   * POST /api/locations/sync
   * Total: 11 registros
   */
  syncLocations(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/locations/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza proyectos desde NetSuite
   * POST /api/projects/sync
   * Total: 141 registros
   */
  syncProjects(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/projects/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza cuentas internas desde NetSuite
   * POST /api/accounti/sync
   * Total: 2 registros
   */
  syncAccountInternal(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/accounti/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza cuentas externas desde NetSuite
   * POST /api/accounte/sync
   * Total: 103 registros
   */
  syncAccountExternal(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/accounte/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza razones de ajuste desde NetSuite
   * POST /api/adjustment-reasons/sync
   * Total: 6 registros
   */
  syncAdjustmentReasons(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/adjustment-reasons/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza categorías desde NetSuite
   * POST /api/categories/sync
   * Total: 60 registros
   */
  syncCategories(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/categories/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza subcategorías desde NetSuite
   * POST /api/subcategories/sync
   * Total: 129 registros
   */
  syncSubcategories(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.apiUrl}/subcategories/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Sincroniza todos los recursos desde NetSuite
   * POST /api/netsuite/sync-all
   * Sincroniza: usuarios, categorías, subcategorías, departamentos, áreas, 
   * ubicaciones, proyectos, cuentas inventario, cuentas gastos, motivos ajuste, productos
   */
  syncAll(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/netsuite/sync-all`,
      { skipErrors: true },
      { headers: this.getHeaders() }
    );
  }
}
