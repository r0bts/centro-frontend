path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

# 1. Update the table head
old_thead = """            <thead class="table-light">
              <tr>
                <th scope="col" class="ps-4">Actividad</th>
                <th scope="col">Tipo</th>
                <th scope="col">Acceso</th>
                <th scope="col">Estado</th>
                <th scope="col" class="text-end pe-4">Acciones</th>
              </tr>
            </thead>"""

new_thead = """            <thead class="table-light">
              <tr>
                <th scope="col" class="ps-4">Actividad</th>
                <th scope="col">Tipo</th>
                <th scope="col">Acceso</th>
                <th scope="col">Profesores</th>
                <th scope="col">Ubicación</th>
                <th scope="col">Estado</th>
                <th scope="col" class="text-end pe-4">Acciones</th>
              </tr>
            </thead>"""
html = html.replace(old_thead, new_thead)

# 2. Update the table row
# I need to find the `<tr>` block and replace the content.
# Let's extract the inside of the tbody loop.
old_tr_start = """                  <td>
                    <div class="form-check form-switch mb-0 d-flex align-items-center gap-2" style="padding-left: 0;">"""

old_tr_end = """                      </label>
                    </div>
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
                  
                  <td class="text-end pe-4">
                    <div class="btn-group border rounded-pill bg-white shadow-sm" role="group">
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-start-pill text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start border-end text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" [title]="act.is_active ? 'Desactivar' : 'Activar'" (click)="toggleActive(act)">
                        <i class="bi" style="font-size: 1.6rem;" [class.bi-toggle-on]="act.is_active" [class.bi-toggle-off]="!act.is_active" [class.text-primary]="act.is_active"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>
                  </td>"""

# I need to make sure I don't break the Acceso column.
# The Acceso column ends with `</div></td>`.
new_middle = """                      </label>
                    </div>
                  </td>
                  
                  <!-- Profesores -->
                  <td style="max-width: 200px;">
                    @let profs = getInstructoresDeActividad(act);
                    @let isOpen = isDropdownOpen(act.id);
                    @if (profs.length > 0) {
                      <div class="d-flex flex-wrap gap-1 align-items-center">
                        @if (!isOpen) {
                          @for (profId of profs | slice:0:2; track profId) {
                            <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; font-weight: 500; background: #f8f9fa; text-transform: capitalize;" [title]="getInstructorName(profId)">
                              <i class="bi bi-person-fill text-muted"></i>
                              <span class="text-truncate" style="max-width: 85px;">{{ getInstructorName(profId).toLowerCase() }}</span>
                            </span>
                          }
                        }
                        
                        @if (profs.length > 2) {
                          <div class="dropdown d-inline-block" bsDropdownState (bsDropdownState)="setDropdownState(act.id, $event)">
                            <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center" 
                                  style="font-size: 0.7rem; font-weight: 500; background: #e9ecef; cursor: pointer; transition: all 0.2s;" 
                                  [class.bg-white]="isOpen" [class.shadow-sm]="isOpen"
                                  tabindex="0" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Ver todos" data-bs-boundary="window">
                              @if (isOpen) {
                                <i class="bi bi-people-fill text-muted me-1"></i> Profesores ({{ profs.length }}) <i class="bi bi-chevron-up ms-1" style="font-size: 0.55rem;"></i>
                              } @else {
                                +{{ profs.length - 2 }} <i class="bi bi-chevron-down ms-1" style="font-size: 0.55rem;"></i>
                              }
                            </span>
                            <ul class="dropdown-menu shadow border" style="font-size: 0.75rem; border-radius: 0.75rem; border-color: rgba(0,0,0,0.08) !important; padding: 0.5rem; min-width: 220px; z-index: 1050;">
                              <li class="dropdown-header d-flex justify-content-between align-items-center mb-1 px-2" style="font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;">
                                <span class="text-uppercase text-muted">Total de profesores</span>
                                <span class="badge bg-light text-secondary border rounded-pill px-2">{{ profs.length }}</span>
                              </li>
                              @for (profId of profs; track profId) {
                                <li>
                                  <span class="dropdown-item d-flex align-items-center gap-2 py-2 px-2 rounded" style="text-transform: capitalize;">
                                    <div class="bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;">
                                      <i class="bi bi-person-fill text-secondary" style="font-size: 0.85rem;"></i>
                                    </div>
                                    <span class="text-truncate fw-medium" style="max-width: 180px;">{{ getInstructorName(profId, true).toLowerCase() }}</span>
                                  </span>
                                </li>
                              }
                            </ul>
                          </div>
                        }
                      </div>
                    } @else {
                      <span class="text-muted small">Sin asignar</span>
                    }
                  </td>

                  <!-- Ubicación -->
                  <td>
                    <div class="d-flex align-items-center gap-1 text-muted" style="font-size: 0.85rem;">
                      <i class="bi bi-geo-alt"></i>
                      <span>{{ getClubName(act.club_id) }}</span>
                    </div>
                  </td>

                  <!-- Estado -->
                  <td>
                    <div class="form-check form-switch mb-0 d-flex align-items-center gap-2" style="padding-left: 0;">
                      <input class="form-check-input m-0" type="checkbox" role="switch"
                             [checked]="act.is_active" 
                             (change)="toggleActive(act)"
                             style="cursor: pointer; width: 2.2rem; height: 1.1rem;">
                      <label class="form-check-label small mb-0 fw-bold" style="cursor: pointer;" (click)="toggleActive(act); $event.preventDefault()"
                             [class.text-success]="act.is_active"
                             [class.text-secondary]="!act.is_active">
                        {{ act.is_active ? 'Activa' : 'Inactiva' }}
                      </label>
                      @if (act.tiene_costo) {
                        <span class="badge bg-warning-subtle text-warning ms-1" title="Tiene costo">💰</span>
                      }
                    </div>
                  </td>
                  
                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group border rounded-pill bg-white shadow-sm" role="group">
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-start-pill text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>
                  </td>"""

html = html.replace(old_tr_end, new_middle)

with open(path, 'w') as f:
    f.write(html)
print("Updated list view columns")
