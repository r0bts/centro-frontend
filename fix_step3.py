import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

target = """                  <!-- Instructor del grupo -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold">Instructor asignado</label>
                    <select class="form-select form-select-sm"
                            [ngModel]="grupos()[gi].instructor_id"
                            (ngModelChange)="setGrupoInstructor(gi, $event)">
                      <option [ngValue]="null">Sin instructor asignado</option>
                      @for (inst of formData()?.instructores; track inst.id) {
                        <option [ngValue]="inst.id">
                          {{ inst.full_name }}
                        </option>
                      }
                    </select>
                  </div>"""

html = html.replace(target, "")

with open(html_path, 'w') as f:
    f.write(html)
print("Removed Instructor from Step 3!")
