import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# 1. We must remove the Instructor asignado block from Step 3
step3_instructor_block = """                  <!-- Instructor del grupo -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold">Instructor asignado</label>
                    <select class="form-select form-select-sm"
                            [ngModel]="grupos()[gi].instructor_id"
                            (ngModelChange)="setGrupoInstructor(gi, $event)">
                      <option [ngValue]="null">Sin instructor asignado</option>
                      @for (inst of formData()?.instructores; track inst.id) {
                        <option [ngValue]="inst.id">
                          {{ inst.full_name }}{{ inst.specialty ? ' — ' + inst.specialty : '' }}
                        </option>
                      }
                    </select>
                    @if (formData()?.instructores?.length === 0) {
                      <small class="text-muted">No hay instructores registrados aún.</small>
                    }
                  </div>"""

if step3_instructor_block in html:
    html = html.replace(step3_instructor_block, "")
else:
    print("WARNING: Step 3 instructor block not found")

# 2. We must insert a new Profesor asignado block in Step 2, near Costo del Profesor.
# Let's find:
costo_profesor_section = """            <!-- Costo del Profesor -->
            <div class="mb-3">
              <label class="form-label fw-semibold text-primary d-flex align-items-center gap-2">
                <i class="bi bi-briefcase"></i> Costo del Profesor (Nómina / Honorarios)
              </label>"""

new_profesor_block = """            <!-- Profesor Asignado -->
            <div class="mb-4">
              <label class="form-label fw-semibold">Profesor asignado a la actividad</label>
              <select class="form-select" [(ngModel)]="profesor_id">
                <option [ngValue]="null">Sin profesor asignado</option>
                @for (inst of formData()?.instructores; track inst.id) {
                  <option [ngValue]="inst.id">
                    {{ inst.full_name }}{{ inst.specialty ? ' — ' + inst.specialty : '' }}
                  </option>
                }
              </select>
              @if (formData()?.instructores?.length === 0) {
                <small class="text-muted">No hay instructores registrados aún.</small>
              }
            </div>

            <!-- Costo del Profesor -->
            <div class="mb-3">
              <label class="form-label fw-semibold text-primary d-flex align-items-center gap-2">
                <i class="bi bi-briefcase"></i> Costo del Profesor (Nómina / Honorarios)
              </label>"""

if costo_profesor_section in html:
    html = html.replace(costo_profesor_section, new_profesor_block)
else:
    print("WARNING: Costo profesor section not found")

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
print("Patched HTML")
