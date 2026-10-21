import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

target = """          <div class="mb-3">
            <label class="form-label fw-semibold">Club o Sede <span class="text-danger">*</span></label>
            <select class="form-select" [(ngModel)]="club_id" [disabled]="isEditing()">
              <option [ngValue]="null" disabled>Selecciona una sede</option>
              @for (c of formData()?.acceso_clubes; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
            @if (isEditing()) {
              <small class="text-muted d-block mt-1">La sede no se puede cambiar una vez creada la actividad.</small>
            }
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
            <input type="text" class="form-control" placeholder="Ej: Fútbol Sub-15"
                   [(ngModel)]="nombre" maxlength="100">
          </div>"""

replacement = """          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Club o Sede <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="club_id" [disabled]="isEditing()">
                <option [ngValue]="null" disabled>Selecciona una sede</option>
                @for (c of formData()?.acceso_clubes; track c.id) {
                  <option [ngValue]="c.id">{{ c.name }}</option>
                }
              </select>
              @if (isEditing()) {
                <small class="text-muted d-block mt-1">La sede no se puede cambiar una vez creada la actividad.</small>
              }
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="Ej: Fútbol Sub-15"
                     [(ngModel)]="nombre" maxlength="100">
            </div>
          </div>"""

html = html.replace(target, replacement)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated rows!")
