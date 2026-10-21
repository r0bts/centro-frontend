html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

import re

# Add to table header
html = html.replace('<th scope="col">Estado</th>', '<th scope="col">Acceso</th>\n                <th scope="col">Estado</th>')

# Add to table body
acceso_cell = """                  <td>
                    <div class="form-check form-switch mb-0 d-flex align-items-center gap-2" style="padding-left: 0;">
                      <input class="form-check-input m-0" type="checkbox" role="switch"
                             [checked]="act.elegible_para_socios !== false" 
                             (change)="toggleSocios(act)"
                             style="cursor: pointer; width: 2.2rem; height: 1.1rem;"
                             [class.bg-primary]="act.elegible_para_socios !== false"
                             [class.bg-info]="act.elegible_para_socios === false">
                      <label class="form-check-label small mb-0 fw-bold" style="cursor: pointer;" (click)="toggleSocios(act); $event.preventDefault()"
                             [class.text-primary]="act.elegible_para_socios !== false"
                             [class.text-info]="act.elegible_para_socios === false">
                        <i class="bi" [class.bi-person-check]="act.elegible_para_socios !== false" [class.bi-building]="act.elegible_para_socios === false"></i> 
                        {{ act.elegible_para_socios !== false ? 'Socios' : 'Staff' }}
                      </label>
                    </div>
                  </td>
                  <td>"""

html = html.replace('                  <td>\n                    @if (act.is_active) {', acceso_cell + '\n                    @if (act.is_active) {')

# Adjust colspan for empty state (4 -> 5)
html = html.replace('<td colspan="4" class="text-center py-5">', '<td colspan="5" class="text-center py-5">')

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML")
