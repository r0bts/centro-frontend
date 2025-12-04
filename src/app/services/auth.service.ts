import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import { 
  LoginResponse, 
  LoginData, 
  UserInfo,
  PermissionModule,
  SubmodulePermissions,
  ModuleInfo,
  RoleInfo
} from '../models/auth.model';

// Mantener User para compatibilidad con código existente
export type User = UserInfo;

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
  private readonly PERMISSIONS_KEY = 'centro_permissions';
  private readonly MODULES_KEY = 'centro_modules';
  private readonly ROLES_KEY = 'centro_roles';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private permissionsSubject = new BehaviorSubject<PermissionModule[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  private modulesSubject = new BehaviorSubject<ModuleInfo[]>([]);
  public modules$ = this.modulesSubject.asObservable();

  private rolesSubject = new BehaviorSubject<RoleInfo[]>([]);
  public roles$ = this.rolesSubject.asObservable();

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
      const permissions = this.getPermissions();
      const modules = this.getModules();
      const roles = this.getRoles();

      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(isAuthenticated);
      this.permissionsSubject.next(permissions);
      this.modulesSubject.next(modules);
      this.rolesSubject.next(roles);
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
  private setSession(authData: LoginData): void {
    this.storage.setItem(this.TOKEN_KEY, authData.access_token);
    this.storage.setItem(this.REFRESH_TOKEN_KEY, authData.refresh_token);
    this.storage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    this.storage.setItem(this.PERMISSIONS_KEY, JSON.stringify(authData.permissions));
    this.storage.setItem(this.MODULES_KEY, JSON.stringify(authData.modules));
    this.storage.setItem(this.ROLES_KEY, JSON.stringify(authData.roles));
    
    this.currentUserSubject.next(authData.user);
    this.isAuthenticatedSubject.next(true);
    this.permissionsSubject.next(authData.permissions);
    this.modulesSubject.next(authData.modules);
    this.rolesSubject.next(authData.roles);
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
    this.storage.removeItem(this.PERMISSIONS_KEY);
    this.storage.removeItem(this.MODULES_KEY);
    this.storage.removeItem(this.ROLES_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.permissionsSubject.next([]);
    this.modulesSubject.next([]);
    this.rolesSubject.next([]);
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

  /**
   * Obtener permisos del usuario desde localStorage
   */
  getPermissions(): PermissionModule[] {
    try {
      const permissionsJson = this.storage.getItem(this.PERMISSIONS_KEY);
      return permissionsJson ? JSON.parse(permissionsJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * Obtener módulos del usuario desde localStorage
   */
  getModules(): ModuleInfo[] {
    try {
      const modulesJson = this.storage.getItem(this.MODULES_KEY);
      return modulesJson ? JSON.parse(modulesJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * Obtener roles del usuario desde localStorage
   */
  getRoles(): RoleInfo[] {
    try {
      const rolesJson = this.storage.getItem(this.ROLES_KEY);
      return rolesJson ? JSON.parse(rolesJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * Verificar si el usuario tiene un permiso específico en un submódulo
   * @param submoduleName Nombre del submódulo (ej: 'requisition', 'usuarios')
   * @param permissionName Nombre del permiso (ej: 'create', 'view', 'update', 'delete')
   * @returns true si el permiso está granted, false en caso contrario
   */
  hasPermission(submoduleName: string, permissionName: string): boolean {
    const permissions = this.permissionsSubject.getValue();
    
    // Buscar en todos los módulos
    for (const module of permissions) {
      const submodule = module.submodules[submoduleName];
      
      if (submodule && submodule.permissions) {
        const permission = submodule.permissions[permissionName];
        return permission?.granted === true;
      }
    }
    
    return false;
  }

  /**
   * Obtener todos los permisos de un submódulo específico
   * @param submoduleName Nombre del submódulo
   * @returns Objeto con los permisos del submódulo o null si no existe
   */
  getSubmodulePermissions(submoduleName: string): SubmodulePermissions | null {
    const permissions = this.permissionsSubject.getValue();
    
    for (const module of permissions) {
      const submodule = module.submodules[submoduleName];
      if (submodule) {
        return submodule;
      }
    }
    
    return null;
  }

  /**
   * Verificar si el usuario tiene al menos uno de los permisos especificados
   * @param submoduleName Nombre del submódulo
   * @param permissionNames Array de nombres de permisos a verificar
   * @returns true si tiene al menos uno de los permisos
   */
  hasAnyPermission(submoduleName: string, permissionNames: string[]): boolean {
    return permissionNames.some(permission => 
      this.hasPermission(submoduleName, permission)
    );
  }

  /**
   * Verificar si el usuario tiene todos los permisos especificados
   * @param submoduleName Nombre del submódulo
   * @param permissionNames Array de nombres de permisos a verificar
   * @returns true si tiene todos los permisos
   */
  hasAllPermissions(submoduleName: string, permissionNames: string[]): boolean {
    return permissionNames.every(permission => 
      this.hasPermission(submoduleName, permission)
    );
  }
}
