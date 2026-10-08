import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Add Toggle button next to "Nueva actividad"
btn_target = """    <button class="btn btn-primary d-flex align-items-center gap-2" (click)="openWizard()">
      <i class="bi bi-plus-lg"></i>
      <span>Nueva actividad</span>
    </button>"""
btn_replacement = """    <div class="d-flex align-items-center gap-2">
      <div class="btn-group" role="group">
        <button type="button" class="btn btn-outline-secondary" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Vista de cuadrícula">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button type="button" class="btn btn-outline-secondary" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" title="Vista de lista">
          <i class="bi bi-list-ul"></i>
        </button>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2" (click)="openWizard()">
        <i class="bi bi-plus-lg"></i>
        <span>Nueva actividad</span>
      </button>
    </div>"""
if btn_target in html:
    html = html.replace(btn_target, btn_replacement)

# Only replace the SECOND activities-grid!
# Wait, let's just do it cleanly by searching for <!-- ── Grid de actividades ── -->
grid_block_match = re.search(r'(<!-- ── Grid de actividades ── -->\n  @if \(!loading\(\)\) \{\n.*?<div class="activities-grid">)', html, re.DOTALL)
if grid_block_match:
    grid_block = grid_block_match.group(1)
    new_grid_block = grid_block.replace('<div class="activities-grid">', '@if (viewMode() === \'grid\') {\n      <div class="activities-grid">')
    html = html.replace(grid_block, new_grid_block)

end_grid_target = """  <!-- ── Confirmación de eliminación ── -->"""
end_grid_replacement = """    }
    
    @if (viewMode() === 'list') {
      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th scope="col" class="ps-4">Actividad</th>
                <th scope="col">Tipo</th>
                <th scope="col">Grupos</th>
                <th scope="col">Estado</th>
                <th scope="col">Modo Mensajería</th>
                <th scope="col" class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (act of filteredActividades(); track act.id) {
                <tr [class.text-muted]="!act.is_active">
                  <td class="ps-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="activity-icon-wrap" [style.background]="act.color || '#6366f1'" style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
                        <span>{{ act.icono || '🏆' }}</span>
                      </div>
                      <div>
                        <h6 class="mb-0 fw-semibold">{{ act.nombre }}</h6>
                        <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">
                          {{ act.descripcion || 'Sin descripción' }}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border"><i class="bi bi-shield-check me-1"></i>{{ act.tipo || '—' }}</span>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border"><i class="bi bi-people me-1"></i>{{ (act.grupos_categorias?.length ?? 0) }}</span>
                  </td>
                  <td>
                    @if (act.is_active) {
                      <span class="badge bg-success-subtle text-success">Activa</span>
                    } @else {
                      <span class="badge bg-secondary-subtle text-secondary">Inactiva</span>
                    }
                    @if (act.tiene_costo) {
                      <span class="badge bg-warning-subtle text-warning ms-1">💰</span>
                    }
                  </td>
                  <td>
                    <span class="badge bg-primary-subtle text-primary">{{ labelMensajeria(act.modo_mensajeria) }}</span>
                  </td>
                  <td class="text-end pe-4">
                    <div class="btn-group">
                      <button class="btn btn-sm btn-outline-secondary" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" [title]="act.is_active ? 'Desactivar' : 'Activar'" (click)="toggleActive(act)">
                        <i class="bi" [class.bi-toggle-on]="act.is_active" [class.bi-toggle-off]="!act.is_active"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (filteredActividades().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-5">
                    <i class="bi bi-trophy display-4 text-muted d-block mb-3"></i>
                    <h5 class="text-muted">No hay actividades</h5>
                    <p class="text-muted small mb-0">Crea la primera actividad o ajusta los filtros.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

  <!-- ── Confirmación de eliminación ── -->"""
if end_grid_target in html:
    html = html.replace(end_grid_target, end_grid_replacement)

with open(html_path, 'w') as f:
    f.write(html)
print("Added List View Safely!")
