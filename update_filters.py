import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

profesor_block = r"""          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Profesor</label>"""

area_profesor = """          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Área / Salón</label>
            <ng-select [items]="uniqueAreas()" 
                       [ngModel]="filterArea()" 
                       (ngModelChange)="filterArea.set($event)"
                       bindLabel="" bindValue=""
                       placeholder="Cualquier área"
                       [clearable]="true"
                       class="custom-sm-select w-100">
            </ng-select>
          </div>
          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Profesor</label>"""

html = html.replace(profesor_block, area_profesor)

with open(path, 'w') as f:
    f.write(html)
