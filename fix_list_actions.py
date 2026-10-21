path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_actions = """                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>"""

new_actions = """                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Duplicar" (click)="duplicateActividad(act)">
                        <i class="bi bi-files" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>"""

html = html.replace(old_actions, new_actions)

with open(path, 'w') as f:
    f.write(html)
print("Updated list view actions")
