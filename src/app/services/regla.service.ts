import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReglaFilterParams,
  ReglaListItem,
  ReglaListResponse,
  ReorderRequest,
  ReorderResponse,
  ToggleResponse,
  ApiResponse,
} from '../models/regla.model';

/**
 * Raw item shape as the PHP backend actually sends it (snake_case).
 * Used only internally to do the camelCase mapping.
 */
interface RawRule {
  id_regla: number;
  numero_regla: number;
  nombre: string;
  tipo: 'GENERAL' | 'PARTICULAR';
  accion: 'PERMITIR' | 'BLOQUEAR';
  activa: boolean;
  condiciones_count: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_creacion: string | null;
  creado_por: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReglaService {
  private readonly BASE = `${environment.apiUrl}/reglas-negocio`;

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/reglas-negocio
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Paginated, filtered list of business rules.
   * Maps snake_case backend fields to camelCase frontend interfaces.
   */
  getReglas(params: ReglaFilterParams = {}): Observable<ReglaListResponse> {
    let qp = new HttpParams();
    if (params.page !== undefined) qp = qp.set('page', params.page);
    if (params.limit !== undefined) qp = qp.set('limit', params.limit);
    if (params.tipo) qp = qp.set('tipo', params.tipo);
    if (params.accion) qp = qp.set('accion', params.accion);
    if (params.activa !== undefined && params.activa !== '')
      qp = qp.set('activa', params.activa);
    if (params.search) qp = qp.set('search', params.search);

    return this.http
      .get<{ success: boolean; message: string; data: { rules: RawRule[]; pagination: any } }>(
        this.BASE,
        { params: qp }
      )
      .pipe(
        map((res) => ({
          success: res.success,
          message: res.message,
          data: {
            rules: res.data.rules.map(this.mapRule),
            pagination: res.data.pagination,
          },
        }))
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/reglas-negocio/{id}
  // ─────────────────────────────────────────────────────────────────────────
  deleteRegla(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.BASE}/${id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/reglas-negocio/{id}/toggle
  // ─────────────────────────────────────────────────────────────────────────
  toggleRegla(id: number): Observable<ToggleResponse> {
    return this.http.patch<ToggleResponse>(`${this.BASE}/${id}/toggle`, {});
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/reglas-negocio/reorder
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Send the new order as an array of id_regla values.
   * The backend assigns numero_regla = (position + 1) * 10 atomically.
   */
  reorderReglas(ids: number[]): Observable<ReorderResponse> {
    const body: ReorderRequest = { ids };
    return this.http.patch<ReorderResponse>(`${this.BASE}/reorder`, body);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Map a single raw snake_case rule to camelCase ReglaListItem */
  private mapRule(raw: RawRule): ReglaListItem {
    return {
      id: raw.id_regla,
      numeroRegla: raw.numero_regla,
      nombre: raw.nombre,
      tipo: raw.tipo,
      accion: raw.accion,
      activa: raw.activa,
      condicionesCount: raw.condiciones_count,
      fechaInicio: raw.fecha_inicio,
      fechaFin: raw.fecha_fin,
      fechaCreacion: raw.fecha_creacion,
      creadoPor: raw.creado_por,
    };
  }
}
