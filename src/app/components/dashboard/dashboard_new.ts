import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { ContentMenu, MenuItem } from '../content-menu/content-menu';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ContentMenu],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'dashboard';
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId;
    console.log('Sección seleccionada:', sectionId);
    // Aquí puedes agregar lógica para cambiar el contenido según la sección
    this.updateBreadcrumb(sectionId);
  }

  private updateBreadcrumb(section: string): void {
    // Actualizar el breadcrumb basado en la sección
    // Esta función se puede expandir para manejar breadcrumbs más complejos
  }

  private getSectionTitle(section: string): string {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      usuarios: 'Gestión de Usuarios',
      empleados: 'Gestión de Empleados',
      reportes: 'Reportes y Análisis',
      documentos: 'Gestión de Documentos',
      configuracion: 'Configuración del Sistema'
    };
    return titles[section] || 'Dashboard';
  }
}
