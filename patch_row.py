import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
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
            <div class="col-12 col-md-4">
              <label class="form-label fw-semibold">Club o Sede <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="club_id" [disabled]="isEditing()">
                <option [ngValue]="null" disabled>Selecciona una sede</option>
                @for (c of formData()?.acceso_clubes; track c.id) {
                  <option [ngValue]="c.id">{{ c.name }}</option>
                }
              </select>
              @if (isEditing()) {
                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">Sede fija.</small>
              }
            </div>

            <div class="col-12 col-md-8">
              <label class="form-label fw-semibold">Nombre <span class="text-danger">*</span></label>
              <input type="text" class="form-control" placeholder="Ej: Fútbol Sub-15"
                     [(ngModel)]="nombre" maxlength="100">
            </div>
          </div>"""

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success")
else:
    print("Could not find target")
