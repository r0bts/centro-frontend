import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
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
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { id: 'usuarios', label: 'Usuarios', icon: 'bi-people' },
    { id: 'empleados', label: 'Empleados', icon: 'bi-person-badge' },
    { id: 'reportes', label: 'Reportes', icon: 'bi-graph-up' },
    { id: 'documentos', label: 'Documentos', icon: 'bi-file-earmark-text' },
    { id: 'configuracion', label: 'Configuración', icon: 'bi-gear' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Si no se proporcionan menuItems, usar los por defecto
    if (this.menuItems.length === 0) {
      this.menuItems = this.defaultMenuItems;
    }
  }

  onSectionClick(sectionId: string, event: Event): void {
    event.preventDefault();
    this.activeSection = sectionId;
    this.sectionChange.emit(sectionId);
  }

  isActive(sectionId: string): boolean {
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
