import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ScCatalogIndexResponse,
  ScCatalogItemResponse,
  ScCatalogCategoryWithTypes,
  ScCatalogActivityTypeDetail,
  CreateScCatalogCategoryRequest,
  UpdateScCatalogCategoryRequest,
  CreateScCatalogActivityTypeRequest,
  UpdateScCatalogActivityTypeRequest,
} from '../../models/summer-course/summer-course.model';

@Injectable({ providedIn: 'root' })
export class ScCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/summer-course/catalog`;

  /** GET /catalog/ — todas las categorías con sus tipos */
  getAll(): Observable<ScCatalogIndexResponse> {
    return this.http.get<ScCatalogIndexResponse>(`${this.base}/`);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  addCategory(body: CreateScCatalogCategoryRequest): Observable<ScCatalogItemResponse<ScCatalogCategoryWithTypes>> {
    return this.http.post<ScCatalogItemResponse<ScCatalogCategoryWithTypes>>(`${this.base}/categories`, body);
  }

  editCategory(id: string, body: UpdateScCatalogCategoryRequest): Observable<ScCatalogItemResponse<ScCatalogCategoryWithTypes>> {
    return this.http.put<ScCatalogItemResponse<ScCatalogCategoryWithTypes>>(`${this.base}/categories/${id}`, body);
  }

  deleteCategory(id: string): Observable<ScCatalogItemResponse<null>> {
    return this.http.delete<ScCatalogItemResponse<null>>(`${this.base}/categories/${id}`);
  }

  // ── Activity Types ────────────────────────────────────────────────────────

  addType(body: CreateScCatalogActivityTypeRequest): Observable<ScCatalogItemResponse<ScCatalogActivityTypeDetail>> {
    return this.http.post<ScCatalogItemResponse<ScCatalogActivityTypeDetail>>(`${this.base}/types`, body);
  }

  editType(id: string, body: UpdateScCatalogActivityTypeRequest): Observable<ScCatalogItemResponse<ScCatalogActivityTypeDetail>> {
    return this.http.put<ScCatalogItemResponse<ScCatalogActivityTypeDetail>>(`${this.base}/types/${id}`, body);
  }

  deleteType(id: string): Observable<ScCatalogItemResponse<null>> {
    return this.http.delete<ScCatalogItemResponse<null>>(`${this.base}/types/${id}`);
  }
}
