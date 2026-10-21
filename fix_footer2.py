import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Using regex to replace the entire <div class="card-actions">...</div>
pattern = r'<!-- Acciones -->\s*<div class="card-actions">.*?</div>'

replacement = """<!-- Acciones -->
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
            </div>
            
            <div class="d-flex gap-1">
              <button class="card-action-btn card-action-btn--edit px-3"
                      title="Editar"
                      (click)="editActividad(act)">
                <span>Editar</span>
              </button>
              <button class="card-action-btn card-action-btn--delete px-2"
                      title="Eliminar"
                      (click)="confirmDelete(act)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>"""

html = re.sub(pattern, replacement, html, flags=re.DOTALL)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated footer!")
