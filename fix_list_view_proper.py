path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

# Find everything between `{{ act.elegible_para_socios !== false ? 'Socios' : 'Staff' }}` and the end of the Acciones td.
pattern = r"(                        \{\{ act\.elegible_para_socios !== false \? 'Socios' : 'Staff' \}\}\n                      </label>\n                    </div>\n                  </td>\n)([\s\S]*?)(\n                  <td class=\"text-end pe-4\">\n                    <div class=\"btn-group border rounded-pill bg-white shadow-sm\" role=\"group\">\n                      <button type=\"button\" class=\"btn btn-sm btn-light border-0 rounded-start-pill text-secondary d-flex align-items-center justify-content-center\" style=\"width: 36px; height: 32px;\" title=\"Editar\" \(click\)=\"editActividad\(act\)\">\n                        <i class=\"bi bi-pencil\" style=\"font-size: 0\.85rem;\"></i>\n                      </button>\n                      <button type=\"button\" class=\"btn btn-sm btn-light border-0 border-start border-end text-secondary d-flex align-items-center justify-content-center\" style=\"width: 36px; height: 32px;\" \[title\]=\"act\.is_active \? 'Desactivar' : 'Activar'\" \(click\)=\"toggleActive\(act\)\">\n                        <i class=\"bi\" style=\"font-size: 1\.6rem;\" \[class\.bi-toggle-on\]=\"act\.is_active\" \[class\.bi-toggle-off\]=\"!act\.is_active\" \[class\.text-primary\]=\"act\.is_active\"></i>\n                      </button>\n                      <button type=\"button\" class=\"btn btn-sm btn-light border-0 rounded-end-pill text-danger d-flex align-items-center justify-content-center\" style=\"width: 36px; height: 32px;\" title=\"Eliminar\" \(click\)=\"confirmDelete\(act\)\">\n                        <i class=\"bi bi-trash\" style=\"font-size: 0\.85rem;\"></i>\n                      </button>\n                    </div>\n                  </td>)"

new_middle = r"""\1                  
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
                      <button type="button" class="btn btn-sm btn-light border-0 border-start rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>
                  </td>"""

new_html, num_subs = re.subn(pattern, new_middle, html)
if num_subs == 0:
    print("FAILED TO REPLACE!")
else:
    # Also fix the colspan in the empty state placeholder from 5 to 7
    new_html = new_html.replace('<td colspan="5" class="text-center py-5">', '<td colspan="7" class="text-center py-5">')
    with open(path, 'w') as f:
        f.write(new_html)
    print("SUCCESSFULLY REPLACED")

