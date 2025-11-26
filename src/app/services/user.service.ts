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
  email?: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  role?: string;
  isActive?: boolean;
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
  getAllUsers(): Observable<User[]> {
    // Datos mock para pruebas - reemplazar con llamada real a API
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

    // Implementación real con API:
    // return this.http.get<User[]>(`${this.API_URL}/users`)
    //   .pipe(
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`)
      .pipe(
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
   * Actualizar usuario
   */
  updateUser(id: string, user: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/users/${id}`, user)
      .pipe(
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
