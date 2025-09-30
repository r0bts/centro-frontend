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
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard' },
    { id: 'usuarios', label: 'Usuarios', icon: 'bi-people', route: '/usuarios' },
    { id: 'empleados', label: 'Empleados', icon: 'bi-person-badge', route: '/empleados' },
    { id: 'requisicion', label: 'Requisición', icon: 'bi-clipboard-check', route: '/requisicion' },
    { id: 'reportes', label: 'Reportes', icon: 'bi-graph-up', route: '/reportes' },
    { id: 'documentos', label: 'Documentos', icon: 'bi-file-earmark-text', route: '/documentos' },
    { id: 'configuracion', label: 'Configuración', icon: 'bi-gear', route: '/configuracion' }
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
    console.log('🔍 Click en sección:', sectionId);
    
    const menuItem = this.menuItems.find(item => item.id === sectionId);
    console.log('🔍 Menu item encontrado:', menuItem);
    
    if (menuItem?.route) {
      console.log('🚀 Navegando a ruta:', menuItem.route);
      console.log('🔍 Router disponible:', !!this.router);
      
      // Navegar usando el router
      this.router.navigate([menuItem.route]).then((success) => {
        console.log(`✅ Navegación ${success ? 'exitosa' : 'fallida'} a: ${menuItem.route}`);
        if (success) {
          console.log('🔍 URL actual después de navegación:', this.router.url);
        } else {
          console.error('❌ La navegación falló para la ruta:', menuItem.route);
        }
      }).catch(error => {
        console.error('❌ Error en navegación:', error);
      });
    } else {
      console.log('⚠️ Emitiendo evento para sección sin ruta:', sectionId);
      // Para secciones sin ruta, emitir evento
      this.activeSection = sectionId;
      this.sectionChange.emit(sectionId);
    }
  }

  isActive(sectionId: string): boolean {
    const menuItem = this.menuItems.find(item => item.id === sectionId);
    if (menuItem?.route && this.router) {
      try {
        const currentUrl = this.router.url;
        const isActive = currentUrl === menuItem.route;
        console.log(`Checking if ${sectionId} is active: currentUrl=${currentUrl}, route=${menuItem.route}, active=${isActive}`);
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
