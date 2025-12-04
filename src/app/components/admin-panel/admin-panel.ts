import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../models/auth.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-panel">
      <!-- Menú lateral simple para admin -->
      <nav class="admin-sidebar">
        <ul class="nav flex-column">
          <li class="nav-item" *ngFor="let item of adminMenuItems">
            <a 
              class="nav-link"
              [class.active]="activeSection === item.id"
              (click)="onSectionChange(item.id)"
              href="javascript:void(0)">
              <i [class]="'bi ' + item.icon"></i>
              <span>{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Contenido del panel -->
      <div class="admin-content">
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
    </div>
  `,
  styles: [`
    .admin-panel {
      display: flex;
      min-height: 100vh;
    }

    .admin-sidebar {
      width: 250px;
      background-color: #f8f9fa;
      border-right: 1px solid #dee2e6;
      padding: 1rem;
    }

    .admin-sidebar .nav-link {
      color: #495057;
      padding: 0.75rem 1rem;
      border-radius: 0.25rem;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .admin-sidebar .nav-link:hover {
      background-color: #e9ecef;
      color: #212529;
    }

    .admin-sidebar .nav-link.active {
      background-color: #0d6efd;
      color: white;
    }

    .admin-sidebar .nav-link i {
      font-size: 1.1rem;
    }

    .admin-content {
      flex: 1;
      padding: 2rem;
    }

    @media (max-width: 768px) {
      .admin-panel {
        flex-direction: column;
      }

      .admin-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #dee2e6;
      }
    }
  `]
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
