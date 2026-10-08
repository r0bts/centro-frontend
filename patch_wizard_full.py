import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    content = f.read()

# Replace the Cobro section with Clasificación + Costo Interno
replacement = """
          <!-- Clasificación (Socios vs Staff) -->
          <div class="mb-3">
            <label class="form-label fw-semibold">Elegibilidad</label>
            <label class="mensajeria-option" [class.selected]="elegible_para_socios">
              <div>
                <div class="fw-semibold">¿Elegible para socios?</div>
                <small class="text-muted">Si se desactiva, esta actividad será de uso exclusivo para staff y no aparecerá en el portal de socios.</small>
              </div>
              <div class="form-check form-switch ms-auto mb-0">
                <input class="form-check-input" type="checkbox" role="switch"
                       [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer">
              </div>
            </label>
          </div>

          <!-- Costo del Profesor -->
          <div class="mb-3 p-3 bg-light border rounded">
            <label class="form-label fw-semibold text-primary d-flex align-items-center gap-2">
              <i class="bi bi-briefcase"></i> Costo del Profesor (Nómina / Honorarios)
            </label>
            <p class="small text-muted mb-3">
              Captura el <strong>costo actual vigente</strong> por clase/hora que se le paga al profesor. El sistema guardará automáticamente el historial de cambios. No corresponde al costo para el socio.
            </p>
            
            <div class="input-group mb-3">
              <span class="input-group-text">$</span>
              <input type="number" class="form-control" placeholder="0.00"
                     min="0" step="0.01" [(ngModel)]="costo_interno">
            </div>

            @if (historial_costos && historial_costos.length > 0) {
              <div class="mt-3">
                <h6 class="small fw-bold text-muted mb-2">Historial de Costos</h6>
                <div class="table-responsive">
                  <table class="table table-sm table-bordered mb-0" style="font-size: 0.85rem;">
                    <thead class="table-light">
                      <tr>
                        <th>Monto</th>
                        <th>Fecha de Inicio</th>
                        <th>Fecha de Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (hist of historial_costos; track hist.id) {
                        <tr>
                          <td>${{ hist.costo | number:'1.2-2' }}</td>
                          <td>{{ hist.fecha_inicio | date:'dd/MMM/yyyy' }}</td>
                          <td>
                            @if (hist.fecha_fin) {
                              {{ hist.fecha_fin | date:'dd/MMM/yyyy' }}
                            } @else {
                              <span class="badge bg-success-subtle text-success">Vigente</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
"""

# Find the Cobro section and replace it
content = re.sub(r'<!-- Cobro -->.*?</div>\s*</div>\s*}', replacement + '\n        </div>\n      }', content, flags=re.DOTALL)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(content)
