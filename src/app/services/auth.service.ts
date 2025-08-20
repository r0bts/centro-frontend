import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  number_employee: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'centro_access_token';
  private readonly REFRESH_TOKEN_KEY = 'centro_refresh_token';
  private readonly USER_KEY = 'centro_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    // Inicializar el estado inmediatamente si estamos en el navegador
    if (typeof window !== 'undefined') {
      this.initializeAuthState();
    }
  }

  /**
   * Inicializar el estado de autenticación
   */
  private initializeAuthState(): void {
    // Solo inicializar si estamos en el navegador
    if (this.storage && this.storage.isBrowser()) {
      const user = this.getCurrentUser();
      const isAuthenticated = this.hasValidToken();

      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(isAuthenticated);
    }
  }

  /**
   * Autenticar usuario
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setSession(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<any> {
    const token = this.getAccessToken();
    
    // Si no hay token, solo limpiar la sesión local
    if (!token) {
      this.clearSession();
      this.router.navigate(['/login']);
      return new Observable(observer => {
        observer.next({ success: true, message: 'Local logout completed' });
        observer.complete();
      });
    }

    // Hacer llamada a la API para logout con JWT
    return this.http.post<any>(`${this.API_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      tap(response => {
        // Limpiar sesión local independientemente de la respuesta
        this.clearSession();
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        // Si hay error en la API, igual limpiar la sesión local
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refrescar token
   */
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.logoutImmediately();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>(`${this.API_URL}/auth/refresh`, {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        if (response.success) {
          // Solo actualizar el access token, mantener el refresh token
          this.storage.setItem(this.TOKEN_KEY, response.data.access_token);
        }
      }),
      catchError(error => {
        this.logoutImmediately();
        return throwError(() => error);
      })
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    try {
      const userJson = this.storage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Obtener token de acceso
   */
  getAccessToken(): string | null {
    return this.storage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken(): string | null {
    return this.storage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Configurar sesión del usuario
   */
  private setSession(authData: LoginResponse['data']): void {
    this.storage.setItem(this.TOKEN_KEY, authData.access_token);
    this.storage.setItem(this.REFRESH_TOKEN_KEY, authData.refresh_token);
    this.storage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    
    this.currentUserSubject.next(authData.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Limpiar sesión inmediatamente (sin llamada a API)
   */
  private logoutImmediately(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Limpiar sesión
   */
  private clearSession(): void {
    this.storage.removeItem(this.TOKEN_KEY);
    this.storage.removeItem(this.REFRESH_TOKEN_KEY);
    this.storage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Verificar si hay un token válido
   */
  private hasValidToken(): boolean {
    // En SSR, no hay tokens disponibles
    if (typeof window === 'undefined' || !this.storage) {
      return false;
    }

    if (!this.storage.isBrowser()) {
      return false;
    }

    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Decodificar el JWT para verificar la expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now;
    } catch {
      return false;
    }
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
          errorMessage = 'Datos de entrada inválidos';
          break;
        case 401:
          errorMessage = 'Credenciales inválidas';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Servicio no encontrado';
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

    return throwError(() => new Error(errorMessage));
  };
}
