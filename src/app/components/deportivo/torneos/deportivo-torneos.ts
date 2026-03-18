import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deportivo-torneos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="py-5 text-center">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <i class="bi bi-award display-1 text-primary mb-4 d-block"></i>
          <h2 class="fw-bold text-muted">Torneos</h2>
          <p class="text-muted">Gestión de torneos y calendario de partidos.</p>
          <span class="badge bg-warning text-dark">En desarrollo — Fase 1</span>
        </div>
      </div>
    </div>
  `
})
export class DeportivoTorneosComponent {}
