import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <i class="bi bi-shield-x unauthorized-icon"></i>
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p class="text-muted">Si crees que esto es un error, contacta al administrador del sistema.</p>
        <div class="actions">
          <button class="btn btn-primary" (click)="goToDashboard()">
            <i class="bi bi-house-door"></i>
            Ir al Dashboard
          </button>
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="bi bi-arrow-left"></i>
            Volver
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .unauthorized-content {
      background: white;
      border-radius: 10px;
      padding: 60px 40px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .unauthorized-icon {
      font-size: 80px;
      color: #dc3545;
      margin-bottom: 20px;
    }

    h1 {
      color: #333;
      margin-bottom: 15px;
      font-size: 28px;
      font-weight: 600;
    }

    p {
      color: #666;
      margin-bottom: 10px;
      font-size: 16px;
    }

    .text-muted {
      color: #999 !important;
      font-size: 14px;
      margin-bottom: 30px;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 30px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background-color: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background-color: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}
