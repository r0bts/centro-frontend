import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id: number;
  name: string;
  script_id: string;
  record_id: string;
  is_inactive: boolean;
  account_inventario: {
    id: number;
    account_number: string;
    full_name: string;
  } | string | null;
  account_gasto: {
    id: number;
    account_number: string;
    full_name: string;
  } | string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriesListResponse {
  success: boolean;
  message: string;
  data: {
    categories: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    counts: {
      total: number;
      active: number;
      inactive: number;
    };
  };
}

export interface CategoryDetailResponse {
  success: boolean;
  message: string;
  data: {
    category: Category;
  };
}

export interface UpdateCategoryRequest {
  account_type: 'inventario' | 'gasto' | null;
  account_id: number | null;
}

export interface UpdateCategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface Account {
  id: number;
  account_number: string;
  full_name: string;
}

export interface AccountsResponse {
  success: boolean;
  message: string;
  data: {
    inventario: Account[];
    gasto: Account[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las categorías con paginación
   */
  getCategories(page: number = 1, limit: number = 100): Observable<CategoriesListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CategoriesListResponse>(`${this.API_URL}/categories`, { params });
  }

  /**
   * Obtener una categoría específica por ID
   */
  getCategoryById(id: number): Observable<CategoryDetailResponse> {
    return this.http.get<CategoryDetailResponse>(`${this.API_URL}/categories/${id}`);
  }

  /**
   * Obtener todas las cuentas disponibles (inventario y gasto)
   */
  getAccounts(): Observable<AccountsResponse> {
    return this.http.get<AccountsResponse>(`${this.API_URL}/categories/accounts`);
  }

  /**
   * Actualizar una categoría existente
   */
  updateCategory(id: number, categoryData: UpdateCategoryRequest): Observable<UpdateCategoryResponse> {
    return this.http.put<UpdateCategoryResponse>(`${this.API_URL}/categories/${id}`, categoryData);
  }
}
