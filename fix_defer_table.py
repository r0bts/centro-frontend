path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_row = """              @for (row of timeTableHours(); track row.hour) {
                <tr>
                  <!-- Time Axis -->
                  <td class="bg-white text-center align-middle fw-semibold text-secondary sticky-top border-end shadow-sm" style="position: sticky; left: 0; z-index: 1010; font-size: 0.85rem;">
                    {{ row.label }}
                  </td>
                  
                  <!-- Day Cells -->
                  @for (day of calendarDays(); track day.dia) {
                    <td class="p-2 align-top bg-white" style="vertical-align: top;">
                      <div class="d-flex flex-column gap-2">
                        @for (session of row.days[day.dia]; track session.id) {
                          <div class="card border-0 shadow-sm session-card position-relative flex-shrink-0" [style.border-left]="'4px solid ' + session.actColor" style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;"
                               (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false"
                               (click)="openHorariosOffcanvas(session.actRef)">
                            <div class="card-body p-2" [class.bg-light]="session.hovered">
                              
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="badge bg-dark bg-opacity-10 text-dark border border-secondary-subtle fw-bold" style="font-size: 0.7rem;">
                                  {{ formatHora(session.start) }} - {{ formatHora(session.end) }}
                                </span>
                              </div>
      
                              <div class="mb-2">
                                <strong class="d-block text-dark text-truncate lh-sm" style="font-size: 0.8rem;" [title]="session.actNombre">{{ session.actNombre }}</strong>
                                <span class="text-muted text-truncate d-block mt-1" style="font-size: 0.65rem;" [title]="session.grupoNombre">
                                  <span class="badge bg-light text-secondary border border-secondary-subtle fw-normal py-0">{{ session.grupoNombre }}</span>
                                </span>
                              </div>
                              
                              <div class="d-flex flex-column gap-1 mt-2 pt-2 border-top border-light">
                                <div class="d-flex align-items-center text-secondary text-truncate" style="font-size: 0.65rem;" [title]="session.profesor">
                                  <i class="bi bi-person me-1"></i>
                                  <span class="text-truncate">{{ session.profesor }}</span>
                                </div>
                                <div class="d-flex align-items-center text-secondary text-truncate" style="font-size: 0.65rem;" [title]="session.ubicacion">
                                  <i class="bi bi-geo-alt me-1"></i>
                                  <span class="text-truncate">{{ session.ubicacion }}</span>
                                </div>
                              </div>
      
                              @if (session.hovered) {
                                <div class="position-absolute bottom-0 end-0 p-1 rounded-start" style="z-index: 10;">
                                   <button class="btn btn-sm btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;" title="Editar Actividad" (click)="editActividad(session.actRef); $event.stopPropagation()">
                                     <i class="bi bi-pencil" style="font-size: 0.6rem;"></i>
                                   </button>
                                </div>
                              }
      
                              @if (!session.actRef.is_active) {
                                <div class="position-absolute top-0 start-0 w-100 h-100 bg-white" style="opacity: 0.6; pointer-events: none;"></div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }"""

new_row = """              @for (row of timeTableHours(); track row.hour) {
                @defer (on viewport) {
                  <tr>
                    <!-- Time Axis -->
                    <td class="bg-white text-center align-middle fw-semibold text-secondary sticky-top border-end shadow-sm" style="position: sticky; left: 0; z-index: 1010; font-size: 0.85rem;">
                      {{ row.label }}
                    </td>
                    
                    <!-- Day Cells -->
                    @for (day of calendarDays(); track day.dia) {
                      <td class="p-2 align-top bg-white" style="vertical-align: top;">
                        <div class="d-flex flex-column gap-2">
                          @for (session of row.days[day.dia]; track session.id) {
                            <div class="card border-0 shadow-sm session-card position-relative flex-shrink-0" [style.border-left]="'4px solid ' + session.actColor" style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;"
                                 (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false"
                                 (click)="openHorariosOffcanvas(session.actRef)">
                              <div class="card-body p-2" [class.bg-light]="session.hovered">
                                
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                  <span class="badge bg-dark bg-opacity-10 text-dark border border-secondary-subtle fw-bold" style="font-size: 0.7rem;">
                                    {{ formatHora(session.start) }} - {{ formatHora(session.end) }}
                                  </span>
                                </div>
        
                                <div class="mb-2">
                                  <strong class="d-block text-dark text-truncate lh-sm" style="font-size: 0.8rem;" [title]="session.actNombre">{{ session.actNombre }}</strong>
                                  <span class="text-muted text-truncate d-block mt-1" style="font-size: 0.65rem;" [title]="session.grupoNombre">
                                    <span class="badge bg-light text-secondary border border-secondary-subtle fw-normal py-0">{{ session.grupoNombre }}</span>
                                  </span>
                                </div>
                                
                                <div class="d-flex flex-column gap-1 mt-2 pt-2 border-top border-light">
                                  <div class="d-flex align-items-center text-secondary text-truncate" style="font-size: 0.65rem;" [title]="session.profesor">
                                    <i class="bi bi-person me-1"></i>
                                    <span class="text-truncate">{{ session.profesor }}</span>
                                  </div>
                                  <div class="d-flex align-items-center text-secondary text-truncate" style="font-size: 0.65rem;" [title]="session.ubicacion">
                                    <i class="bi bi-geo-alt me-1"></i>
                                    <span class="text-truncate">{{ session.ubicacion }}</span>
                                  </div>
                                </div>
        
                                @if (session.hovered) {
                                  <div class="position-absolute bottom-0 end-0 p-1 rounded-start" style="z-index: 10;">
                                     <button class="btn btn-sm btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;" title="Editar Actividad" (click)="editActividad(session.actRef); $event.stopPropagation()">
                                       <i class="bi bi-pencil" style="font-size: 0.6rem;"></i>
                                     </button>
                                  </div>
                                }
        
                                @if (!session.actRef.is_active) {
                                  <div class="position-absolute top-0 start-0 w-100 h-100 bg-white" style="opacity: 0.6; pointer-events: none;"></div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                } @placeholder {
                  <tr style="height: 120px;">
                    <td class="bg-white text-center align-middle fw-semibold text-secondary sticky-top border-end shadow-sm placeholder-glow" style="position: sticky; left: 0; z-index: 1010;">
                      <span class="placeholder col-6"></span>
                    </td>
                    <td colspan="7" class="bg-white align-middle text-center text-muted opacity-50">
                      <div class="spinner-border spinner-border-sm text-secondary me-2" role="status"></div>
                      Cargando horarios...
                    </td>
                  </tr>
                }
              }"""

html = html.replace(old_row, new_row)

with open(path, 'w') as f:
    f.write(html)
print("Added @defer to rows")
