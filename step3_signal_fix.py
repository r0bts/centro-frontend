import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

target = """                      <select class="form-select form-select-sm"
                              [(ngModel)]="grupos()[gi].instructor_id">"""

replacement = """                      <select class="form-select form-select-sm"
                              [ngModel]="grupos()[gi].instructor_id"
                              (ngModelChange)="setGrupoInstructor(gi, $event)">"""

html = html.replace(target, replacement)

target2 = """                        <input type="number" class="form-control" min="0" step="0.01"
                               placeholder="0.00"
                               [(ngModel)]="grupos()[gi].costo_interno">"""

replacement2 = """                        <input type="number" class="form-control" min="0" step="0.01"
                               placeholder="0.00"
                               [ngModel]="grupos()[gi].costo_interno"
                               (ngModelChange)="setGrupoCosto(gi, $event)">"""

html = html.replace(target2, replacement2)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated ngModel bindings!")
