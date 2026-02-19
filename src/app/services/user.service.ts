import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  role: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  nombre?: string;
  id_netsuite?: string;
  status?: boolean;
  rol_id?: string;
  departamento?: string;
  location_id?: string;
  permissions?: UserPermission[];
  products?: {
    product_id: string;
    limit_per_requisition: number;
    is_assigned: boolean;
  }[];
}

export interface UserRole {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

export interface UserPermission {
  submodule_id: number;
  permission_id: number;
  is_granted: boolean;
}

export interface UserProduct {
  product_id: string;
  product_code: string;
  product_name: string;
  limit_per_requisition: number;
  is_assigned: boolean;
}

export interface UserDetails {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    departmentId: number;
    departmentName: string;
    locationId: number;
    locationName: string;
    role: UserRole | null;
    isActive: boolean;
    createdAt: string;
    lastLogin: string;
  };
  permissions: UserPermission[];
  products: UserProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios
   */
  getAllUsers(limit: number = 1000, page: number = 1): Observable<User[]> {
    const params: any = { 
      limit: limit.toString(), 
      page: page.toString() 
    };

    return this.http.get<any>(`${this.API_URL}/users`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map((user: any) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            // ✅ CORRECCIÓN: Backend usa snake_case
            firstName: user.first_name || user.firstName,
            lastName: user.last_name || user.lastName,
            employeeNumber: user.number_employee || user.employeeNumber,
            locationId: user.location_id || user.locationId,
            locationName: user.location?.name || user.locationName,
            departmentId: user.department_id || user.departmentId,
            departmentName: user.department?.name || user.departmentName,
            // Extraer rol desde user_roles array
            role: user.user_roles && user.user_roles.length > 0 
              ? (user.user_roles[0].role?.display_name || user.user_roles[0].role?.name || 'Sin rol')
              : (user.role || 'Sin rol'),
            isActive: user.is_active !== undefined ? user.is_active : user.isActive,
            createdAt: new Date(user.created_at || user.createdAt),
            lastLogin: user.last_login_at || user.lastLogin && user.last_login_at !== null && user.lastLogin !== 'Sin información' 
              ? new Date(user.last_login_at || user.lastLogin) 
              : undefined
          }));
        }
        return [];
      }),
      catchError(this.handleError)
    );
  }

  /**
   * MOCK DATA - mantener comentado como respaldo
   */
  private getMockUsers(): Observable<User[]> {
    return of([
      {
        id: '1',
        username: 'admin',
        email: 'admin@centro.com',
        firstName: 'Administrador',
        lastName: 'Sistema',
        employeeNumber: 'EMP001',
        role: 'Administrador',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2025-11-18T10:30:00')
      },
      {
        id: '2',
        username: 'jperez',
        email: 'jperez@centro.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        employeeNumber: 'EMP002',
        role: 'Gerente',
        isActive: true,
        createdAt: new Date('2024-02-20'),
        lastLogin: new Date('2025-11-17T16:45:00')
      },
      {
        id: '3',
        username: 'mgarcia',
        email: 'mgarcia@centro.com',
        firstName: 'María',
        lastName: 'García',
        employeeNumber: 'EMP003',
        role: 'Supervisor',
        isActive: true,
        createdAt: new Date('2024-03-10'),
        lastLogin: new Date('2025-11-18T08:15:00')
      },
      {
        id: '4',
        username: 'clopez',
        email: 'clopez@centro.com',
        firstName: 'Carlos',
        lastName: 'López',
        employeeNumber: 'EMP004',
        role: 'Operador',
        isActive: true,
        createdAt: new Date('2024-04-05'),
        lastLogin: new Date('2025-11-16T14:20:00')
      },
      {
        id: '5',
        username: 'amartinez',
        email: 'amartinez@centro.com',
        firstName: 'Ana',
        lastName: 'Martínez',
        employeeNumber: 'EMP005',
        role: 'Operador',
        isActive: true,
        createdAt: new Date('2024-05-12'),
        lastLogin: new Date('2025-11-18T09:00:00')
      },
      {
        id: '6',
        username: 'rrodriguez',
        email: 'rrodriguez@centro.com',
        firstName: 'Roberto',
        lastName: 'Rodríguez',
        employeeNumber: 'EMP006',
        role: 'Supervisor',
        isActive: false,
        createdAt: new Date('2024-06-18'),
        lastLogin: new Date('2025-11-10T11:30:00')
      },
      {
        id: '7',
        username: 'lfernandez',
        email: 'lfernandez@centro.com',
        firstName: 'Laura',
        lastName: 'Fernández',
        employeeNumber: 'EMP007',
        role: 'Operador',
        isActive: true,
        createdAt: new Date('2024-07-22'),
        lastLogin: new Date('2025-11-18T07:45:00')
      },
      {
        id: '8',
        username: 'dgomez',
        email: 'dgomez@centro.com',
        firstName: 'David',
        lastName: 'Gómez',
        employeeNumber: 'EMP008',
        role: 'Gerente',
        isActive: true,
        createdAt: new Date('2024-08-30'),
        lastLogin: new Date('2025-11-17T18:00:00')
      },
      {
        id: '9',
        username: 'shernandez',
        email: 'shernandez@centro.com',
        firstName: 'Sandra',
        lastName: 'Hernández',
        employeeNumber: 'EMP009',
        role: 'Operador',
        isActive: true,
        createdAt: new Date('2024-09-15'),
        lastLogin: new Date('2025-11-18T06:30:00')
      },
      {
        id: '10',
        username: 'pdiaz',
        email: 'pdiaz@centro.com',
        firstName: 'Pedro',
        lastName: 'Díaz',
        employeeNumber: 'EMP010',
        role: 'Supervisor',
        isActive: false,
        createdAt: new Date('2024-10-20'),
        lastLogin: new Date('2025-11-05T15:00:00')
      }
    ]);
  }

  /**
   * Obtener usuario por ID con detalles completos (permisos y productos)
   */
  getUserById(id: string): Observable<UserDetails> {
    return this.http.get<any>(`${this.API_URL}/users/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Usuario no encontrado');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Crear nuevo usuario
   */
  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/users`, user)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar usuario con permisos y productos
   */
  updateUser(id: string, userData: UpdateUserRequest): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/users/${id}`, userData)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          }
          throw new Error(response.message || 'Error al actualizar usuario');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar usuario
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Cambiar estado de usuario (activar/desactivar)
   */
  toggleUserStatus(id: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${id}/toggle-status`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener roles disponibles
   */
  getAvailableRoles(): Observable<string[]> {
    return of(['Administrador', 'Gerente', 'Supervisor', 'Operador', 'Usuario']);
    
    // Implementación real con API:
    // return this.http.get<string[]>(`${this.API_URL}/roles`)
    //   .pipe(
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Sincronizar usuarios desde sistema externo
   */
  syncUsers(): Observable<User[]> {
    return this.http.post<User[]>(`${this.API_URL}/users/sync`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener datos del formulario de usuarios (roles, departamentos, locations)
   * Endpoint: GET /api/users/form-data
   * 
   * @returns Observable con roles activos, departamentos activos y locations activos
   */
  getUserFormData(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/users/form-data`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('No se pudieron cargar los datos del formulario');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Manejar errores de HTTP
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos de entrada inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 409:
          errorMessage = 'El usuario ya existe';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    console.error('Error en UserService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
