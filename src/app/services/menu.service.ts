import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { MenuItem } from '../models/auth.model';
import { PermissionModule, SubmodulePermissions } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private authService: AuthService) {}

  /**
   * Genera el menú dinámicamente basado en los permisos del usuario
   * Solo incluye módulos y submódulos donde el usuario tiene al menos 1 permiso granted
   */
  generateMenu(): MenuItem[] {
    const permissions = this.authService.getPermissions();
    const menuItems: MenuItem[] = [];

    // Ordenar módulos por sort_order
    const sortedModules = permissions.sort((a, b) => a.sort_order - b.sort_order);

    for (const module of sortedModules) {
      const moduleItem = this.buildModuleItem(module);
      
      // Agregar el módulo si:
      // 1. Tiene submódulos visibles (children.length > 0)
      // 2. Es un item simple sin children (Dashboard, Reportes con 1 solo submódulo)
      if (moduleItem) {
        if (moduleItem.children && moduleItem.children.length > 0) {
          menuItems.push(moduleItem);
        } else if (!moduleItem.children && moduleItem.route) {
          menuItems.push(moduleItem);
        }
      }
    }

    return menuItems;
  }

  /**
   * Construir item de módulo con sus submódulos
   */
  private buildModuleItem(module: PermissionModule): MenuItem | null {
    const submoduleItems: MenuItem[] = [];
    
    // Rutas internas que no deben aparecer en el menú
    const excludedRoutes = ['/requisicion/confirmacion'];

    // Obtener submódulos y ordenarlos por sort_order
    const submodules = Object.values(module.submodules)
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const submodule of submodules) {
      // Verificar si el usuario tiene al menos 1 permiso granted en este submódulo
      // Y que la ruta no esté en la lista de exclusión
      if (this.hasAnyGrantedPermission(submodule) && !excludedRoutes.includes(submodule.route)) {
        const submoduleItem: MenuItem = {
          id: submodule.name,
          label: submodule.display_name,
          icon: submodule.icon,
          route: submodule.route,
          active: false
        };
        submoduleItems.push(submoduleItem);
      }
    }

    // Si no hay submódulos visibles, no crear el módulo
    if (submoduleItems.length === 0) {
      return null;
    }

    // Si solo hay 1 submódulo, retornarlo directamente (sin padre)
    if (submoduleItems.length === 1) {
      return {
        id: module.name,
        label: module.display_name,
        icon: module.icon,
        route: submoduleItems[0].route,
        active: false
      };
    }

    // Si hay múltiples submódulos, crear menú con dropdown
    return {
      id: module.name,
      label: module.display_name,
      icon: module.icon,
      isParent: true,
      isExpanded: false,
      children: submoduleItems,
      active: false
    };
  }

  /**
   * Verificar si un submódulo tiene al menos 1 permiso granted
   */
  private hasAnyGrantedPermission(submodule: SubmodulePermissions): boolean {
    const permissions = Object.values(submodule.permissions);
    return permissions.some(permission => permission.granted === true);
  }

  /**
   * Actualizar el estado activo de los items del menú según la ruta actual
   */
  updateActiveState(menuItems: MenuItem[], currentRoute: string): void {
    for (const item of menuItems) {
      // Resetear estado activo
      item.active = false;

      if (item.children) {
        // Es un padre, revisar hijos
        for (const child of item.children) {
          child.active = currentRoute.startsWith(child.route || '');
          
          // Si un hijo está activo, marcar el padre como activo pero NO expandirlo automáticamente
          if (child.active) {
            item.active = true;
          }
        }
      } else if (item.route) {
        // Es un item simple
        item.active = currentRoute.startsWith(item.route);
      }
    }
  }

  /**
   * Expandir/colapsar un item padre del menú
   */
  toggleExpanded(item: MenuItem): void {
    if (item.isParent) {
      item.isExpanded = !item.isExpanded;
    }
  }
}
