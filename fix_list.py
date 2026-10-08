html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

import re

# 1. Remove table columns headers
html = re.sub(r'<th scope="col">Grupos</th>\s*<th scope="col">Estado</th>\s*<th scope="col">Modo Mensajería</th>', '<th scope="col">Estado</th>', html)

# 2. Remove description
html = re.sub(r'<small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">\s*\{\{ act\.descripcion \|\| \'Sin descripción\' \}\}\s*</small>', '', html)

# 3. Use formatTipo for tipo
html = re.sub(r'<span class="badge bg-light text-dark border"><i class="bi bi-shield-check me-1"></i>\{\{ act\.tipo \|\| \'—\' \}\}</span>', '<span class="badge bg-light text-dark border"><i class="bi bi-shield-check me-1"></i>{{ formatTipo(act.tipo) }}</span>', html)

# 4. Remove table cells for Grupos and Modo Mensajeria
# The row looks like this:
#                   <td>
#                     <span class="badge bg-light text-dark border"><i class="bi bi-shield-check me-1"></i>{{ formatTipo(act.tipo) }}</span>
#                   </td>
#                   <td>
#                     <span class="badge bg-light text-dark border"><i class="bi bi-people me-1"></i>{{ (act.grupos_categorias?.length ?? 0) }}</span>
#                   </td>
#                   <td>...Estado...</td>
#                   <td>
#                     <span class="badge bg-primary-subtle text-primary">{{ labelMensajeria(act.modo_mensajeria) }}</span>
#                   </td>

# Remove Grupos cell
html = re.sub(r'<td>\s*<span class="badge bg-light text-dark border"><i class="bi bi-people me-1"></i>\{\{ \(act\.grupos_categorias\?\.length \?\? 0\) \}\}</span>\s*</td>', '', html)

# Remove Modo Mensajeria cell
html = re.sub(r'<td>\s*<span class="badge bg-primary-subtle text-primary">\{\{ labelMensajeria\(act\.modo_mensajeria\) \}\}</span>\s*</td>', '', html)

# 5. Fix the Acciones buttons
old_actions = """<div class="btn-group">
                      <button class="btn btn-sm btn-outline-secondary" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" [title]="act.is_active ? 'Desactivar' : 'Activar'" (click)="toggleActive(act)">
                        <i class="bi" [class.bi-toggle-on]="act.is_active" [class.bi-toggle-off]="!act.is_active"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>"""

new_actions = """<div class="btn-group border rounded-pill bg-white shadow-sm" role="group">
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-start-pill text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start border-end text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" [title]="act.is_active ? 'Desactivar' : 'Activar'" (click)="toggleActive(act)">
                        <i class="bi" style="font-size: 1.1rem;" [class.bi-toggle-on]="act.is_active" [class.bi-toggle-off]="!act.is_active" [class.text-primary]="act.is_active"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>"""

html = html.replace(old_actions, new_actions)

with open(html_path, 'w') as f:
    f.write(html)
print("List view updated")
