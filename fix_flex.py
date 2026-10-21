import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

target = """          <!-- Acciones -->
          <div class="card-actions d-flex justify-content-between align-items-center w-100">
            <!-- Switch -->
            <div class="form-check form-switch mb-0 d-flex align-items-center gap-2" [title]="act.is_active ? 'Desactivar actividad' : 'Activar actividad'">
              <input class="form-check-input mt-0 m-0" type="checkbox" role="switch"
                     [checked]="act.is_active" 
                     (change)="toggleActive(act)"
                     style="cursor: pointer;">
              <label class="form-check-label small text-muted mb-0" style="cursor: pointer;" (click)="toggleActive(act); $event.preventDefault()">
                {{ act.is_active ? 'Activa' : 'Inactiva' }}
              </label>
            </div>"""

replacement = """          <!-- Acciones -->
          <div class="card-actions" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <!-- Switch -->
            <div class="form-check form-switch mb-0" style="padding-left: 2.5em; margin: 0;" [title]="act.is_active ? 'Desactivar actividad' : 'Activar actividad'">
              <input class="form-check-input" type="checkbox" role="switch"
                     [checked]="act.is_active" 
                     (change)="toggleActive(act)"
                     style="cursor: pointer; margin-top: 0.15rem; margin-left: -2.5em;">
              <label class="form-check-label small text-muted mb-0 fw-medium" style="cursor: pointer;" (click)="toggleActive(act); $event.preventDefault()">
                {{ act.is_active ? 'Activa' : 'Inactiva' }}
              </label>
            </div>"""

if target in html:
    html = html.replace(target, replacement)
    
with open(html_path, 'w') as f:
    f.write(html)
print("Updated flex container!")
