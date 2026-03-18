import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-deportivo-finanzas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="py-5 text-center">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <i class="bi bi-cash-coin display-1 text-primary mb-4 d-block"></i>
          <h2 class="fw-bold text-muted">Finanzas Deportivas</h2>
          <p class="text-muted">Conceptos de pago, registro de pagos y reportes financieros.</p>
          <span class="badge bg-warning text-dark">En desarrollo — Fase 1</span>
        </div>
      </div>
    </div>
  `
})
export class DeportivoFinanzasComponent {}
