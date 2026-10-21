import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace icon wrap with a flex container holding the icon and the switch
icon_target = """          <!-- Ícono / color -->
          <div class="activity-icon-wrap" [style.background]="act.color || '#6366f1'">
            <span class="activity-emoji">{{ act.icono || '🏆' }}</span>
          </div>"""

icon_replacement = """          <!-- Ícono y Switch -->
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

html = html.replace(icon_target, icon_replacement)

# Remove the Activa badge
badge_target = """            @if (act.is_active) {
              <span class="badge bg-success-subtle text-success">Activa</span>
            } @else {
              <span class="badge bg-secondary-subtle text-secondary">Inactiva</span>
            }"""
html = html.replace(badge_target, "")

# Remove the Desactivar action button
btn_target = """            <button class="card-action-btn card-action-btn--toggle"
                    [title]="act.is_active ? 'Desactivar' : 'Activar'"
                    (click)="toggleActive(act)">
              <span>{{ act.is_active ? 'Desactivar' : 'Activar' }}</span>
            </button>"""
html = html.replace(btn_target, "")

with open(html_path, 'w') as f:
    f.write(html)
print("Updated Card HTML!")
