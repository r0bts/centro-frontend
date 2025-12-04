import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Role {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

export interface RolesListResponse {
  success: boolean;
  message: string;
  data: {
    roles: Role[];
    total: number;
    active: number;
    inactive: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los roles
   */
  getRoles(): Observable<RolesListResponse> {
    return this.http.get<RolesListResponse>(`${this.API_URL}/roles`);
  }

  /**
   * Obtener un rol específico por ID
   */
  getRoleById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/roles/${id}`);
  }

  /**
   * Crear un nuevo rol
   */
  createRole(roleData: Partial<Role>): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/roles`, roleData);
  }

  /**
   * Actualizar un rol existente
   */
  updateRole(id: string, roleData: Partial<Role>): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/roles/${id}`, roleData);
  }

  /**
   * Eliminar un rol
   */
  deleteRole(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/roles/${id}`);
  }

  /**
   * Cambiar el estado activo/inactivo de un rol
   */
  toggleRoleStatus(id: string): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/roles/${id}/toggle-status`, {});
  }
}
