path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_block = """          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Zona (Área)</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterAreaId">
              <option [ngValue]="null">Todas las áreas</option>
              @for (a of formData()?.areas_mapeadas; track a.area_id) {
                <option [ngValue]="a.area_id">{{ a.area_name }}</option>
              }
            </select>
          </div>"""

new_block = """          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Acceso</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterAcceso">
              <option [ngValue]="null">Cualquiera</option>
              <option [ngValue]="true">Socios</option>
              <option [ngValue]="false">Staff</option>
            </select>
          </div>"""

html = html.replace(old_block, new_block)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML")
