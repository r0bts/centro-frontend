import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# 1. Remove Cobro from Step 2
cobro_match = re.search(r'(<!-- Cobro -->.*?</div>\s*</div>)', html, re.DOTALL)
if cobro_match:
    html = html.replace(cobro_match.group(1), '')

# 2. Inject Profesor and Costo into the Horario row in Step 4
horario_row = """                                  <span class="d-none d-sm-inline">Replicar</span>
                                </button>
                              }"""

new_fields = """
                          <!-- Asignación de Profesor y Costo por Horario -->
                          @for (h of getHorariosByDia(gIdx, d.num); track h.hora_inicio; let idx = $index) {
                            <div class="mt-3 p-3 bg-light rounded border border-secondary-subtle">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-semibold text-primary">
                                  <i class="bi bi-clock me-1"></i> {{ h.hora_inicio }} - {{ h.hora_fin }}
                                </span>
                                <button class="btn btn-sm btn-outline-danger border-0" (click)="removeHorario(gIdx, d.num, idx)">
                                  <i class="bi bi-trash"></i>
                                </button>
                              </div>
                              <div class="row g-2">
                                <div class="col-md-6">
                                  <label class="form-label small mb-1">Profesor asignado (Opcional)</label>
                                  <select class="form-select form-select-sm" [(ngModel)]="h.profesor_id">
                                    <option [ngValue]="null">-- Sin profesor --</option>
                                    @for (p of $any(formData())?.profesores; track p.id) {
                                      <option [ngValue]="p.id">{{ p.name }}</option>
                                    }
                                  </select>
                                </div>
                                <div class="col-md-6">
                                  <label class="form-label small mb-1">Costo ($)</label>
                                  <input type="number" class="form-control form-control-sm" placeholder="0.00" min="0" step="0.01" [(ngModel)]="h.costo_interno">
                                </div>
                              </div>
                            </div>
                          }
"""

# We need to replace the old Horario Row list
# The old one had:
# @for (h of getHorariosByDia(gIdx, d.num); track h; let idx = $index) {
#   <div class="horario-row mt-2 d-flex align-items-center gap-2">
#     ...
#   </div>
# }
old_horario_loop = re.search(r'(@for \(h of getHorariosByDia\(gIdx, d.num\); track h; let idx = \$index\) \{.*?\n\s*\})', html, re.DOTALL)
if old_horario_loop:
    html = html.replace(old_horario_loop.group(1), new_fields)

with open(html_path, 'w') as f:
    f.write(html)
print("Moved Profesor and Costo to Horarios successfully!")
