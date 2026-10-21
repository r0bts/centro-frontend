path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

old_select = """<select class="form-select form-select-sm"
                              [ngModel]="grupos()[gi].instructor_id"
                              (ngModelChange)="setGrupoInstructor(gi, $event)">
                        <option [ngValue]="null">Sin instructor titular</option>
                        @for (inst of formData()?.instructores; track inst.id) {
                          <option [ngValue]="inst.id">{{ inst.full_name }}</option>
                        }
                      </select>"""

new_select = """<ng-select
                        [items]="formData()?.instructores || []"
                        bindLabel="full_name"
                        bindValue="id"
                        placeholder="Sin instructor titular"
                        [ngModel]="grupos()[gi].instructor_id"
                        (ngModelChange)="setGrupoInstructor(gi, $event)"
                        [clearable]="true"
                        [searchable]="true"
                        appendTo="body">
                      </ng-select>"""

html = html.replace(old_select, new_select)

with open(path, 'w') as f:
    f.write(html)
print("Updated to ng-select")
