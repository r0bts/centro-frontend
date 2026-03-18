import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deportivo-comunicados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="py-5 text-center">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <i class="bi bi-megaphone display-1 text-primary mb-4 d-block"></i>
          <h2 class="fw-bold text-muted">Comunicados y Eventos</h2>
          <p class="text-muted">Publicación de comunicados oficiales y gestión de eventos del club.</p>
          <span class="badge bg-warning text-dark">En desarrollo — Fase 1</span>
        </div>
      </div>
    </div>
  `
})
export class DeportivoComunicadosComponent {}
