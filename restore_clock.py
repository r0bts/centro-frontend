path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_actions = """                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group border rounded-pill bg-white shadow-sm" role="group">
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-start-pill text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>
                  </td>"""

new_actions = """                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group border rounded-pill bg-white shadow-sm" role="group">
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-start-pill text-primary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Horarios" (click)="openHorariosOffcanvas(act)">
                        <i class="bi bi-clock" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>
                  </td>"""

html = html.replace(old_actions, new_actions)

with open(path, 'w') as f:
    f.write(html)
print("Restored clock button")
