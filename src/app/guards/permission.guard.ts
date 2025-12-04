import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas basado en permisos del usuario
 * 
 * Uso en las rutas (app.routes.ts):
 * {
 *   path: 'requisition',
 *   component: RequisitionComponent,
 *   canActivate: [permissionGuard],
 *   data: { 
 *     submodule: 'requisition', 
 *     permission: 'create' 
 *   }
 * }
 * 
 * Para requerir múltiples permisos (ANY):
 * data: { 
 *   submodule: 'requisition', 
 *   permissions: ['create', 'update'] // Usuario necesita AL MENOS UNO
 * }
 * 
 * Para requerir todos los permisos (ALL):
 * data: { 
 *   submodule: 'requisition', 
 *   permissions: ['create', 'update'],
 *   requireAll: true // Usuario necesita TODOS
 * }
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    console.warn('🚫 Usuario no autenticado, redirigiendo a /login');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Obtener configuración de permisos de la ruta
  const submodule = route.data['submodule'] as string;
  const permission = route.data['permission'] as string;
  const permissions = route.data['permissions'] as string[];
  const requireAll = route.data['requireAll'] as boolean;

  // Si no se especificó submodule, permitir acceso (ruta no protegida por permisos)
  if (!submodule) {
    console.warn('⚠️ Ruta sin configuración de submodule, permitiendo acceso:', state.url);
    return true;
  }

  // Verificar permisos
  let hasPermission = false;

  if (permissions && permissions.length > 0) {
    // Múltiples permisos
    if (requireAll) {
      // Requiere TODOS los permisos
      hasPermission = authService.hasAllPermissions(submodule, permissions);
      console.log(`🔐 Verificando TODOS los permisos [${permissions.join(', ')}] en ${submodule}:`, hasPermission);
    } else {
      // Requiere AL MENOS UNO
      hasPermission = authService.hasAnyPermission(submodule, permissions);
      console.log(`🔐 Verificando AL MENOS UN permiso [${permissions.join(', ')}] en ${submodule}:`, hasPermission);
    }
  } else if (permission) {
    // Permiso único
    hasPermission = authService.hasPermission(submodule, permission);
    console.log(`🔐 Verificando permiso ${permission} en ${submodule}:`, hasPermission);
  } else {
    console.warn('⚠️ Ruta sin configuración de permission o permissions, denegando acceso:', state.url);
    hasPermission = false;
  }

  if (!hasPermission) {
    console.warn(`🚫 Acceso denegado a ${state.url} - Falta permiso en ${submodule}`);
    return router.createUrlTree(['/unauthorized']);
  }

  console.log(`✅ Acceso permitido a ${state.url}`);
  return true;
};
