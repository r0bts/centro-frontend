import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu, MenuItem } from '../content-menu/content-menu';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  template: `
    <div class="admin-panel">
      <!-- Menú específico para el panel de administración -->
      <app-content-menu 
        [menuItems]="adminMenuItems"
        [activeSection]="activeSection"
        (sectionChange)="onSectionChange($event)">
      </app-content-menu>

      <!-- Contenido del panel -->
      <div class="container-fluid mt-4">
        <h2>{{ getSectionTitle(activeSection) }}</h2>
        <div [ngSwitch]="activeSection">
          <div *ngSwitchCase="'system'">
            <p>Configuración del sistema...</p>
          </div>
          <div *ngSwitchCase="'users'">
            <p>Administración de usuarios...</p>
          </div>
          <div *ngSwitchCase="'logs'">
            <p>Logs del sistema...</p>
          </div>
          <div *ngSwitchCase="'backup'">
            <p>Gestión de respaldos...</p>
          </div>
          <div *ngSwitchDefault>
            <p>Panel de administración principal</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminPanel {
  activeSection: string = 'system';
  
  adminMenuItems: MenuItem[] = [
    { id: 'system', label: 'Sistema', icon: 'bi-gear-fill' },
    { id: 'users', label: 'Usuarios Admin', icon: 'bi-person-gear' },
    { id: 'logs', label: 'Logs', icon: 'bi-journal-text' },
    { id: 'backup', label: 'Respaldos', icon: 'bi-cloud-arrow-up' }
  ];

  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId;
    console.log('Admin sección seleccionada:', sectionId);
  }

  getSectionTitle(section: string): string {
    const titles: { [key: string]: string } = {
      system: 'Configuración del Sistema',
      users: 'Administración de Usuarios',
      logs: 'Logs del Sistema',
      backup: 'Gestión de Respaldos'
    };
    return titles[section] || 'Panel de Administración';
  }
}
