import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ─── Interfaces ─────────────────────────────────────────────
export interface ClubAsignado {
  area_club_id: number;
  acceso_club_id: number;
  club_name: string;
}

export interface AreaLayout {
  id: number;
  nombre: string;
  filas: number;
  columnas: number;
  is_active: boolean;
}

export interface AreaConClubes {
  id: number;
  name: string;
  clubes: ClubAsignado[];
  has_layout: boolean;
  layout: AreaLayout | null;
}

export interface Club {
  id: number;
  name: string;
}

export interface AreaClubesResponse {
  success: boolean;
  message: string;
  data: {
    areas: AreaConClubes[];
    clubes: Club[];
    total: number;
  };
}

export interface AssignResponse {
  success: boolean;
  message: string;
  data?: {
    action: 'assigned' | 'removed';
    id?: number;
    area_id: number;
    acceso_club_id: number;
  };
}

// Posición individual en el grid
export interface LayoutPosition {
  id?: number;
  fila_index: number;
  columna_index: number;
  etiqueta: string;
  tipo: 'instructor' | 'lugar' | 'vacio';
  is_active: boolean;
}

export interface AreaLayoutDetail {
  layout: {
    id: number;
    area_id: number;
    nombre: string;
    filas: number;
    columnas: number;
    is_active: boolean;
  } | null;
  positions: LayoutPosition[];
}

export interface LayoutResponse {
  success: boolean;
  message: string;
  data: AreaLayoutDetail & { area_id?: number };
}

export interface SaveLayoutRequest {
  area_id: number;
  nombre: string;
  filas: number;
  columnas: number;
  positions: LayoutPosition[];
}

export interface SaveLayoutResponse {
  success: boolean;
  message: string;
  data?: {
    layout_id: number;
    area_id: number;
    filas: number;
    columnas: number;
    total_positions: number;
    lugares_activos: number;
  };
}

// ─── Service ─────────────────────────────────────────────────
@Injectable({
  providedIn: 'root'
})
export class AreaClubService {
  private apiUrl = `${environment.apiUrl}/area-clubes`;
  private layoutUrl = `${environment.apiUrl}/area-layouts`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/area-clubes
   * Obtiene todas las áreas activas con sus clubs asignados y si tienen plano
   */
  getAreas(): Observable<AreaClubesResponse> {
    return this.http.get<AreaClubesResponse>(`${this.apiUrl}/`);
  }

  /**
   * POST /api/area-clubes/assign
   * Toggle: asigna o desasigna un área a un club
   */
  assignClub(areaId: number, accesoClubId: number): Observable<AssignResponse> {
    return this.http.post<AssignResponse>(`${this.apiUrl}/assign`, {
      area_id: areaId,
      acceso_club_id: accesoClubId
    });
  }

  /**
   * DELETE /api/area-clubes/{id}
   * Elimina una asignación por su ID
   */
  removeAssignment(areaClubId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${areaClubId}`);
  }

  /**
   * GET /api/area-layouts/{areaId}
   * Obtiene el plano de un área (layout + posiciones)
   */
  getLayout(areaId: number): Observable<LayoutResponse> {
    return this.http.get<LayoutResponse>(`${this.layoutUrl}/${areaId}`);
  }

  /**
   * POST /api/area-layouts/save
   * Crea o actualiza el plano de un área
   */
  saveLayout(payload: SaveLayoutRequest): Observable<SaveLayoutResponse> {
    return this.http.post<SaveLayoutResponse>(`${this.layoutUrl}/save`, payload);
  }

  /**
   * DELETE /api/area-layouts/{id}
   * Elimina el plano de un área por su layout ID
   */
  deleteLayout(layoutId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.layoutUrl}/${layoutId}`);
  }
}
