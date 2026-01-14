import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category_id: number;
  category_name: string;
  category_is_inactive: boolean;
  subcategory_id: number;
  subcategory_name: string;
  subcategory_is_inactive: boolean;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  lastSync?: Date;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    total: number;
    active: number;
    inactive: number;
    categories: { [key: string]: number };
    lastSyncDate: string;
  };
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  isActive?: boolean;
}

// Mapeo de IDs de categorías a nombres
export const CATEGORY_MAP: { [key: string]: string } = {
  '1': 'Papelería',
  '3': 'Cafetería',
  '6': 'Limpieza',
  '7': 'Mantenimiento',
  '13': 'Electrónica',
  '15': 'Consumibles',
  '34': 'Varios'
};

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los productos desde la API
   * @param limit - Límite de productos a traer (default: 1000, máximo permitido por el backend)
   * @param page - Página a consultar (default: 1)
   * @param search - Término de búsqueda opcional
   * @param active - Filtrar por activos (true) o inactivos (false), undefined para todos
   */
  getAllProducts(
    limit: number = 1000, 
    page: number = 1, 
    search?: string, 
    active?: boolean
  ): Observable<Product[]> {
    let params: any = { limit: limit.toString(), page: page.toString() };
    
    if (search) {
      params.search = search;
    }
    
    // El parámetro active se envía como booleano:
    // active=true → productos activos (is_inactive=0)
    // active=false → productos inactivos (is_inactive=1)
    if (active !== undefined) {
      params.active = active;
    }

    return this.http.get<ProductsResponse>(`${this.API_URL}/products`, { params }).pipe(
      map(response => {
        if (response.success && response.data && response.data.products) {
          // Transformar productos: mantener los campos de categoría/subcategoría del backend
          return response.data.products.map((product: any) => ({
            ...product,
            isActive: !product.isInactive, // Backend: isInactive=false → Frontend: isActive=true
            createdAt: new Date(product.createdAt),
            lastSync: product.lastSync ? new Date(product.lastSync) : undefined
          }));
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener productos con paginación
   * @param page - Número de página
   * @param limit - Productos por página
   * @param search - Término de búsqueda
   * @param active - Filtrar por activos (true) o inactivos (false), undefined para todos
   */
  getProductsPaginated(
    page: number = 1,
    limit: number = 50,
    search?: string,
    active?: boolean
  ): Observable<ProductsResponse> {
    let params: any = { limit: limit.toString(), page: page.toString() };
    
    if (search) {
      params.search = search;
    }
    
    // El parámetro active se envía como booleano:
    // active=true → productos activos (is_inactive=0)
    // active=false → productos inactivos (is_inactive=1)
    if (active !== undefined) {
      params.active = active;
    }

    return this.http.get<ProductsResponse>(`${this.API_URL}/products`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Transformar productos: convertir isInactive a isActive
          response.data.products = response.data.products.map((product: any) => ({
            ...product,
            isActive: !product.isInactive, // Backend: isInactive=false → Frontend: isActive=true
            createdAt: new Date(product.createdAt),
            lastSync: product.lastSync ? new Date(product.lastSync) : undefined
          }));
          
          // Mantener las categorías como vienen del backend (ya no necesitamos mapear)
          const categoriesWithNames: { [key: string]: number } = response.data.categories || {};
          response.data.categories = categoriesWithNames;
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener estadísticas de productos (sin traer todos los productos)
   */
  getProductsStats(): Observable<ProductsResponse['data']> {
    // Solo necesitamos la primera página para obtener las estadísticas
    return this.http.get<ProductsResponse>(`${this.API_URL}/products`, { 
      params: { limit: '1', page: '1' } 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Transformar nombres de categorías en el objeto categories
          const categoriesWithNames: { [key: string]: number } = {};
          Object.keys(response.data.categories).forEach(catId => {
            const categoryName = CATEGORY_MAP[catId] || `Categoría ${catId}`;
            categoriesWithNames[categoryName] = response.data.categories[catId];
          });
          
          return {
            ...response.data,
            categories: categoriesWithNames,
            products: [] // No necesitamos los productos aquí
          };
        }
        throw new Error('Respuesta inválida del servidor');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener producto por ID
   */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar producto
   */
  updateProduct(id: string, product: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/products/${id}`, product)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar producto
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/products/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Cambiar estado de producto (activar/desactivar)
   */
  toggleProductStatus(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.API_URL}/products/${id}/toggle-status`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sincronizar productos desde NetSuite
   */
  syncProducts(): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/products/sync`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener categorías disponibles con contadores
   */
  getAvailableCategories(): Observable<string[]> {
    return of(Object.values(CATEGORY_MAP));
  }

  /**
   * Manejar errores de HTTP
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Datos de entrada inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor inicia sesión nuevamente';
          break;
        case 403:
          errorMessage = error.error?.message || 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = error.error?.message || 'Producto no encontrado';
          break;
        case 409:
          errorMessage = error.error?.message || 'El producto ya existe';
          break;
        case 500:
          errorMessage = error.error?.message || 'Error interno del servidor';
          if (error.error?.error?.details) {
            console.error('Detalles del error:', error.error.error.details);
          }
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }
    return throwError(() => new Error(errorMessage));
  };
}
