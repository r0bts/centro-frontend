path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_select = """            <select class="form-select form-select-sm" [(ngModel)]="filterProfesorId">
              <option [ngValue]="null">Cualquier profesor</option>
              @for (p of formData()?.instructores; track p.id) {
                <option [ngValue]="p.id" style="text-transform: capitalize;">{{ p.full_name.toLowerCase() }}</option>
              }
            </select>"""

new_select = """            <ng-select [items]="formData()?.instructores || []"
                       bindLabel="full_name"
                       bindValue="id"
                       placeholder="Cualquier profesor"
                       [(ngModel)]="filterProfesorId"
                       class="custom-sm-select w-100">
              <ng-template ng-label-tmp let-item="item">
                <span style="text-transform: capitalize;">{{ item.full_name.toLowerCase() }}</span>
              </ng-template>
              <ng-template ng-option-tmp let-item="item">
                <span style="text-transform: capitalize;">{{ item.full_name.toLowerCase() }}</span>
              </ng-template>
            </ng-select>"""

html = html.replace(old_select, new_select)

with open(path, 'w') as f:
    f.write(html)
print("Replaced select with ng-select")
