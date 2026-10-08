path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_html = """          <!-- Instructores Chips -->
          @let profs = getInstructoresDeActividad(act);
          @if (profs.length > 0) {
            <div class="d-flex flex-wrap gap-1 mb-auto mt-1 pb-1">
              @for (profId of profs | slice:0:2; track profId) {
                <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; font-weight: 500; background: #f8f9fa; text-transform: capitalize;" [title]="getInstructorName(profId)">
                  <i class="bi bi-person-fill text-muted"></i>
                  <span class="text-truncate" style="max-width: 85px;">{{ getInstructorName(profId).toLowerCase() }}</span>
                </span>
              }
              @if (profs.length > 2) {
                <div class="dropdown d-inline-block">
                  <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center" 
                        style="font-size: 0.7rem; font-weight: 500; background: #e9ecef; cursor: pointer; transition: all 0.2s;" 
                        data-bs-toggle="dropdown" aria-expanded="false" title="Ver todos">
                    +{{ profs.length - 2 }} <i class="bi bi-chevron-down ms-1" style="font-size: 0.55rem;"></i>
                  </span>
                  <ul class="dropdown-menu shadow border" style="font-size: 0.75rem; border-radius: 0.75rem; border-color: rgba(0,0,0,0.08) !important; padding: 0.5rem; min-width: 200px; z-index: 1050;">
                    <li class="dropdown-header d-flex justify-content-between align-items-center mb-1 px-2" style="font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;">
                      <span class="text-uppercase text-muted">Resto de profesores</span>
                      <span class="badge bg-light text-secondary border rounded-pill px-2">{{ profs.length }}</span>
                    </li>
                    @for (profId of profs | slice:2; track profId) {
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
          } @else {"""

new_html = """          <!-- Instructores Chips -->
          @let profs = getInstructoresDeActividad(act);
          @let isOpen = isDropdownOpen(act.id);
          @if (profs.length > 0) {
            <div class="d-flex flex-wrap gap-1 mb-auto mt-1 pb-1">
              @if (!isOpen) {
                @for (profId of profs | slice:0:2; track profId) {
                  <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; font-weight: 500; background: #f8f9fa; text-transform: capitalize;" [title]="getInstructorName(profId)">
                    <i class="bi bi-person-fill text-muted"></i>
                    <span class="text-truncate" style="max-width: 85px;">{{ getInstructorName(profId).toLowerCase() }}</span>
                  </span>
                }
              }
              
              @if (profs.length > 2) {
                <div class="dropdown d-inline-block" (bsDropdownState)="setDropdownState(act.id, $event)">
                  <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center" 
                        style="font-size: 0.7rem; font-weight: 500; background: #e9ecef; cursor: pointer; transition: all 0.2s;" 
                        [class.bg-white]="isOpen" [class.shadow-sm]="isOpen"
                        data-bs-toggle="dropdown" aria-expanded="false" title="Ver todos">
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
                    @for (profId of (isOpen ? profs : (profs | slice:2)); track profId) {
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
          } @else {"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated interactive logic")
