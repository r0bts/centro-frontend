import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

target = """            <!-- Switch -->
            <div class="form-check form-switch mb-0" style="padding-left: 2.5em; margin: 0;" [title]="act.is_active ? 'Desactivar actividad' : 'Activar actividad'">
              <input class="form-check-input" type="checkbox" role="switch"
                     [checked]="act.is_active" 
                     (change)="toggleActive(act)"
                     style="cursor: pointer; margin-top: 0.15rem; margin-left: -2.5em;">
              <label class="form-check-label small text-muted mb-0 fw-medium" style="cursor: pointer;" (click)="toggleActive(act); $event.preventDefault()">
                {{ act.is_active ? 'Activa' : 'Inactiva' }}
              </label>
            </div>"""

replacement = """            <!-- Switch -->
            <div class="form-check form-switch mb-0" style="padding-left: 0; margin: 0; display: flex; align-items: center; gap: 0.5rem;" [title]="act.is_active ? 'Desactivar actividad' : 'Activar actividad'">
              <input class="form-check-input m-0" type="checkbox" role="switch"
                     [checked]="act.is_active" 
                     (change)="toggleActive(act)"
                     style="cursor: pointer;">
              <label class="form-check-label small text-muted mb-0 fw-medium" style="cursor: pointer; line-height: 1;" (click)="toggleActive(act); $event.preventDefault()">
                {{ act.is_active ? 'Activa' : 'Inactiva' }}
              </label>
            </div>"""

if target in html:
    html = html.replace(target, replacement)
else:
    print("TARGET NOT FOUND. Let's try regex.")
    
    # regex fallback
    pattern = r'<!-- Switch -->.*?</div>\s*</div>\s*<!-- ── Confirmación'
    # we don't want to replace that far.

with open(html_path, 'w') as f:
    f.write(html)
print("Aligned switch!")
