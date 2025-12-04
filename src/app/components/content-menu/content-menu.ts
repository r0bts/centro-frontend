import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { MenuItem } from '../../models/auth.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-content-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-menu.html',
  styleUrls: ['./content-menu.scss']
})
export class ContentMenu implements OnInit {
  @Input() activeSection: string = '';
  @Output() sectionChange = new EventEmitter<string>();

  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private menuService: MenuService,
    private router: Router
  ) {
    // Suscribirse a cambios en permisos para regenerar menú
    this.authService.permissions$.subscribe(() => {
      this.loadMenu();
    });

    // Actualizar estado activo cuando cambie la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveStates();
    });
  }

  ngOnInit(): void {
    this.loadMenu();
    this.updateActiveStates();
  }

  /**
   * Cargar menú dinámico desde permisos del usuario
   */
  private loadMenu(): void {
    this.menuItems = this.menuService.generateMenu();
  }

  /**
   * Actualizar estados activos según ruta actual
   */
  private updateActiveStates(): void {
    const currentRoute = this.router.url;
    this.menuService.updateActiveState(this.menuItems, currentRoute);
  }

  onSectionClick(sectionId: string, event: Event): void {
    event.preventDefault();
    
    const menuItem = this.findMenuItemById(sectionId);
    
    // Cerrar todos los dropdowns cuando se selecciona una opción
    this.closeAllDropdowns();
    
    if (menuItem?.route) {
      // Navegar usando el router
      this.router.navigate([menuItem.route]).then((success) => {
        if (success) {
          console.log('🔍 URL actual después de navegación:', this.router.url);
        } else {
          console.error('❌ La navegación falló para la ruta:', menuItem.route);
        }
      }).catch(error => {
        console.error('❌ Error en navegación:', error);
      });
    } else {
      // Para secciones sin ruta, emitir evento
      this.activeSection = sectionId;
      this.sectionChange.emit(sectionId);
    }
  }

  toggleSubmenu(item: MenuItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle del submenu actual usando el MenuService
    this.menuService.toggleExpanded(item);
  }

  /**
   * Cerrar todos los dropdowns abiertos
   */
  private closeAllDropdowns(): void {
    this.menuItems.forEach(item => {
      if (item.isExpanded) {
        item.isExpanded = false;
      }
    });
  }

  findMenuItemById(id: string): MenuItem | null {
    for (const item of this.menuItems) {
      if (item.id === id) {
        return item;
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.id === id) {
            return child;
          }
        }
      }
    }
    return null;
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActive(child.id));
  }

  isActive(sectionId: string): boolean {
    const menuItem = this.findMenuItemById(sectionId);
    if (menuItem?.route && this.router) {
      try {
        const currentUrl = this.router.url;
        const isActive = currentUrl === menuItem.route || currentUrl.startsWith(menuItem.route + '/');
        return isActive;
      } catch (error) {
        console.warn('Error accessing router.url:', error);
      }
    }
    // Fallback para secciones sin ruta
    return this.activeSection === sectionId;
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('Logout successful:', response.message);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // El router.navigate ya se ejecuta en el servicio
      }
    });
  }
}
