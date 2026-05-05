import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface Department {
  department_id: number;
  department_name: string;
  products_count: number;
}

export interface DepartmentsResponse {
  success: boolean;
  data: Department[];
}

export interface ProductLimit {
  id: number;
  product_id: number;
  product_code: string | null;
  product_name: string;
  unit: string | null;
  category_id: number | null;
  category: string; // nombre de la categoría
  max_quantity: number | null;
  is_active?: boolean;
}

export interface DeptProductsResponse {
  success: boolean;
  data: {
    department: { id: number; name: string };
    limits: ProductLimit[];
  };
}

export interface UserProductsResponse {
  success: boolean;
  data: {
    user: { id: number; username: string; full_name: string; department_id: number };
    limits: ProductLimit[];
  };
}

export interface SaveLimitItem {
  product_id: number;
  max_quantity: number | null;
}

export interface SaveDeptLimitsRequest {
  department_id: number;
  limits: SaveLimitItem[];
}

export interface SaveUserLimitsRequest {
  user_id: number;
  limits: SaveLimitItem[];
}

export interface SaveResponse {
  success: boolean;
  message: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  full_name: string;
  department_name: string;
}

export interface UsersSearchResponse {
  success: boolean;
  data: {
    users: UserSearchResult[];
  };
}

export interface ProductSearchResult {
  id: string; // el API devuelve string
  code: string;
  name: string;
  category_id: number | null;
  category_name: string;
  isInactive: boolean;
}

export interface ProductsSearchResponse {
  success: boolean;
  data: {
    products: ProductSearchResult[];
  };
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DepartmentLimitsService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Department endpoints ──────────────────────

  /** Lista todos los departamentos con conteo de productos asignados */
  getDepartments(): Observable<DepartmentsResponse> {
    return this.http.get<DepartmentsResponse>(`${this.base}/department-limits`);
  }

  /** Productos con límites para un departamento */
  getDeptProducts(department_id: number): Observable<DeptProductsResponse> {
    const params = new HttpParams().set('department_id', department_id);
    return this.http.get<DeptProductsResponse>(`${this.base}/department-limits/products`, { params });
  }

  /** Guardar/actualizar límites de departamento (upsert completo) */
  saveDeptLimits(payload: SaveDeptLimitsRequest): Observable<SaveResponse> {
    return this.http.post<SaveResponse>(`${this.base}/department-limits/save`, payload);
  }

  /** Desactivar (borrado lógico) un límite de departamento */
  removeDeptLimit(id: number): Observable<SaveResponse> {
    return this.http.delete<SaveResponse>(`${this.base}/department-limits/${id}`);
  }

  // ── User endpoints ────────────────────────────

  /** Productos con límites para un usuario */
  getUserProducts(user_id: number): Observable<UserProductsResponse> {
    const params = new HttpParams().set('user_id', user_id);
    return this.http.get<UserProductsResponse>(`${this.base}/user-limits/products`, { params });
  }

  /** Guardar/actualizar límites de usuario (upsert completo) */
  saveUserLimits(payload: SaveUserLimitsRequest): Observable<SaveResponse> {
    return this.http.post<SaveResponse>(`${this.base}/user-limits/save`, payload);
  }

  /** Desactivar (borrado lógico) un límite de usuario */
  removeUserLimit(id: number): Observable<SaveResponse> {
    return this.http.delete<SaveResponse>(`${this.base}/user-limits/${id}`);
  }

  // ── Helpers: buscar usuarios y productos ─────

  searchUsers(q: string): Observable<UsersSearchResponse> {
    const params = new HttpParams().set('q', q).set('limit', 20);
    return this.http.get<UsersSearchResponse>(`${this.base}/users`, { params });
  }

  searchProducts(q: string): Observable<ProductsSearchResponse> {
    const params = new HttpParams().set('limit', 5000).set('active', 'true');
    return this.http.get<ProductsSearchResponse>(`${this.base}/products`, { params });
  }
}
