import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

bad_area = """          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Área / Salón</label>
            <ng-select [items]="uniqueAreas()" 
                       [ngModel]="filterArea()" 
                       (ngModelChange)="filterArea.set($event)"
                       bindLabel="" bindValue=""
                       placeholder="Cualquier área"
                       [clearable]="true"
                       class="custom-sm-select w-100">
            </ng-select>
          </div>\n"""

# Replace double occurrences with single
html = html.replace(bad_area + bad_area, bad_area)
# Check if there is still a duplicate
html = html.replace(bad_area + bad_area, bad_area)

with open(path, 'w') as f:
    f.write(html)
