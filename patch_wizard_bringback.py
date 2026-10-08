import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    content = f.read()

replacement = """
          <!-- Cobro a Socios -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Cobro a Socios</label>
            <label class="mensajeria-option" [class.selected]="tiene_costo">
              <div>
                <div class="fw-semibold">¿Esta actividad tiene costo extra para el socio?</div>
                <small class="text-muted">Actívalo si la actividad requiere pago de inscripción o mensualidad por parte del socio.</small>
              </div>
              <div class="form-check form-switch ms-auto mb-0">
                <input class="form-check-input" type="checkbox" role="switch"
                       [(ngModel)]="tiene_costo" style="width:2.5rem;height:1.25rem;cursor:pointer">
              </div>
            </label>

            @if (tiene_costo) {
              <div class="mt-2">
                <label class="form-label small fw-semibold">Monto a cobrar al socio <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" placeholder="0.00"
                         min="0" step="0.01" [(ngModel)]="monto">
                </div>
              </div>
            }
          </div>

          <!-- Costo del Profesor -->
"""

content = content.replace('<!-- Costo del Profesor -->', replacement)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(content)
