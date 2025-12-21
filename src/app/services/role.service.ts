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

// ==================== INTERFACES PARA CREAR/EDITAR ROLES ====================

export interface RolePermissionInput {
  submodule_id: number;
  permission_id: number;
  is_granted: boolean;
}

export interface RoleProductInput {
  product_id: string;
  limit_per_requisition: number;
  is_assigned: boolean;
}

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
  permissions: RolePermissionInput[];
  products: RoleProductInput[];
}

export interface CreateRoleResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    display_name: string;
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
   * 
   * @param roleData - Datos del rol a crear (nombre, permisos, productos)
   * @returns Observable con la respuesta del servidor
   * 
   * @example
   * ```typescript
   * const newRole: CreateRoleRequest = {
   *   name: "gerente_almacen",
   *   display_name: "Gerente de Almacén",
   *   description: "Gestión completa de almacén",
   *   is_default: false,
   *   is_active: true,
   *   permissions: [
   *     { submodule_id: 1, permission_id: 2, is_granted: true }
   *   ],
   *   products: [
   *     { product_id: "5223", limit_per_requisition: 100, is_assigned: true }
   *   ]
   * };
   * 
   * roleService.createRole(newRole).subscribe({
   *   next: (response) => {
   *     console.log('Rol creado:', response.data.id);
   *   },
   *   error: (err) => console.error('Error:', err)
   * });
   * ```
   */
  createRole(roleData: CreateRoleRequest): Observable<CreateRoleResponse> {
    return this.http.post<CreateRoleResponse>(`${this.API_URL}/roles`, roleData);
  }

  /**
   * Actualizar un rol existente (PUT /api/roles/{id})
   * 
   * **IMPORTANTE:** Esta operación REEMPLAZA completamente los permisos y productos.
   * - Elimina todos los permisos existentes y crea los nuevos
   * - Elimina todos los productos existentes y crea los nuevos
   * - Usa transacciones (rollback automático en caso de error)
   * 
   * @param id - ID del rol a actualizar
   * @param roleData - Datos completos del rol (incluye permisos y productos)
   * @returns Observable con la respuesta del servidor
   * 
   * @example
   * ```typescript
   * const updatedRole: CreateRoleRequest = {
   *   name: "gerente_almacen",
   *   display_name: "Gerente de Almacén Actualizado",
   *   description: "Descripción actualizada del rol",
   *   is_default: false,
   *   is_active: true,
   *   permissions: [
   *     { submodule_id: 1, permission_id: 2, is_granted: true },
   *     { submodule_id: 5, permission_id: 1, is_granted: true }
   *   ],
   *   products: [
   *     { product_id: "5223", limit_per_requisition: 150, is_assigned: true }
   *   ]
   * };
   * 
   * roleService.updateRole("4", updatedRole).subscribe({
   *   next: (response) => {
   *     console.log('Rol actualizado:', response.message);
   *   },
   *   error: (err) => {
   *     if (err.status === 403) {
   *       console.error('Sin permisos para actualizar');
   *     } else if (err.status === 404) {
   *       console.error('Rol no encontrado');
   *     } else {
   *       console.error('Error al actualizar:', err.error?.error);
   *     }
   *   }
   * });
   * ```
   */
  updateRole(id: string, roleData: CreateRoleRequest): Observable<CreateRoleResponse> {
    return this.http.put<CreateRoleResponse>(`${this.API_URL}/roles/${id}`, roleData);
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
