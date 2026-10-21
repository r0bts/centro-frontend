import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Revert icon wrap
icon_target = """          <!-- Ícono y Switch -->
          <div class="d-flex justify-content-between align-items-start">
            <div class="activity-icon-wrap" [style.background]="act.color || '#6366f1'">
              <span class="activity-emoji">{{ act.icono || '🏆' }}</span>
            </div>
            <div class="form-check form-switch mb-0" title="Activar/Desactivar">
              <input class="form-check-input fs-5 mt-0" type="checkbox" role="switch"
                     [checked]="act.is_active" 
                     (change)="toggleActive(act)"
                     style="cursor: pointer;">
            </div>
          </div>"""

icon_replacement = """          <!-- Ícono / color -->
          <div class="activity-icon-wrap" [style.background]="act.color || '#6366f1'">
            <span class="activity-emoji">{{ act.icono || '🏆' }}</span>
          </div>"""
html = html.replace(icon_target, icon_replacement)

# Update card actions
actions_target = """          <!-- Acciones -->
          <div class="card-actions">
            <button class="card-action-btn card-action-btn--edit"
                    title="Editar"
                    (click)="editActividad(act)">
              <span>Editar</span>
            </button>
            <button class="card-action-btn card-action-btn--delete"
                    title="Eliminar"
                    (click)="confirmDelete(act)">
              <span>Eliminar</span>
            </button>
          </div>"""

actions_replacement = """          <!-- Acciones -->
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
html = html.replace(actions_target, actions_replacement)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated footer!")
