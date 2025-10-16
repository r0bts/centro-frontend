import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
  children?: MenuItem[];
  isParent?: boolean;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-content-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-menu.html',
  styleUrls: ['./content-menu.scss']
})
export class ContentMenu {
  @Input() menuItems: MenuItem[] = [];
  @Input() activeSection: string = '';
  @Output() sectionChange = new EventEmitter<string>();

  // Menú por defecto si no se proporciona uno externo
  private defaultMenuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'bi-speedometer2', 
      route: '/dashboard' 
    },
    { 
      id: 'requisicion', 
      label: 'Requisición', 
      icon: 'bi-clipboard-check',
      isParent: true,
      isExpanded: false,
      children: [
        { id: 'requisicion-crear', label: 'Crear Requisición', icon: 'bi-plus-circle', route: '/requisicion/crear' },
        { id: 'requisicion-lista', label: 'Lista de Requisiciones', icon: 'bi-list-ul', route: '/requisicion/lista' },
        { id: 'requisicion-surtir', label: 'Surtir Requisición', icon: 'bi-check-circle', route: '/requisicion/surtir' },
        { id: 'requisicion-recibir', label: 'Recibir Requisición', icon: 'bi-inbox', route: '/requisicion/recibir' }
      ]
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: 'bi-graph-up',
      isParent: true,
      isExpanded: false,
      children: [
        { id: 'reportes-historial', label: 'Historial de Requisiciones', icon: 'bi-clock-history', route: '/reportes/historial' },
        { id: 'reportes-consumo', label: 'Reportes de Consumo', icon: 'bi-bar-chart', route: '/reportes/consumo' },
        { id: 'reportes-inventario', label: 'Inventario', icon: 'bi-boxes', route: '/reportes/inventario' }
      ]
    },
    { 
      id: 'configuracion', 
      label: 'Configuración', 
      icon: 'bi-gear',
      isParent: true,
      isExpanded: false,
      children: [
        { id: 'configuracion-general', label: 'General', icon: 'bi-gear-fill', route: '/configuracion/general' },
        { id: 'configuracion-usuarios', label: 'Usuarios', icon: 'bi-people', route: '/configuracion/usuarios' },
        { id: 'configuracion-productos', label: 'Productos', icon: 'bi-box', route: '/configuracion/productos' },
        { id: 'configuracion-netsuite', label: 'Sincronización NetSuite', icon: 'bi-cloud-arrow-up', route: '/configuracion/netsuite' },
        { id: 'configuracion-roles', label: 'Roles y Permisos', icon: 'bi-shield-check', route: '/configuracion/roles' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si no se proporcionan menuItems, usar los por defecto
    if (this.menuItems.length === 0) {
      this.menuItems = this.defaultMenuItems;
    }
  }

  onSectionClick(sectionId: string, event: Event): void {
    event.preventDefault();
    
    const menuItem = this.findMenuItemById(sectionId);
    
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
    
    // Cerrar otros submenus
    this.menuItems.forEach(menuItem => {
      if (menuItem !== item && menuItem.isExpanded) {
        menuItem.isExpanded = false;
      }
    });
    
    // Toggle del submenu actual
    item.isExpanded = !item.isExpanded;
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
