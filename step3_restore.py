import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

target = """                  <!-- Cupo del grupo -->
                  <div class="mb-3">
                    <label class="mensajeria-option" [class.selected]="grupos()[gi].tiene_cupo">"""

replacement = """                  <!-- Instructor del grupo -->
                  <div class="row g-2 mb-3">
                    <div class="col-12 col-md-8">
                      <label class="form-label small fw-semibold">Instructor titular</label>
                      <select class="form-select form-select-sm"
                              [(ngModel)]="grupos()[gi].instructor_id">
                        <option [ngValue]="null">Sin instructor titular</option>
                        @for (inst of formData()?.instructores; track inst.id) {
                          <option [ngValue]="inst.id">{{ inst.full_name }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-12 col-md-4">
                      <label class="form-label small fw-semibold">Costo base</label>
                      <div class="input-group input-group-sm">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" min="0" step="0.01"
                               placeholder="0.00"
                               [(ngModel)]="grupos()[gi].costo_interno">
                      </div>
                    </div>
                    <div class="col-12">
                      <small class="text-muted" style="font-size: 0.75rem;">Este profesor y costo se asignarán automáticamente a todos los horarios de este grupo.</small>
                    </div>
                  </div>

                  <!-- Cupo del grupo -->
                  <div class="mb-3">
                    <label class="mensajeria-option" [class.selected]="grupos()[gi].tiene_cupo">"""

html = html.replace(target, replacement)

with open(html_path, 'w') as f:
    f.write(html)
print("Restored Step 3 inputs!")
