path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

pattern = r"    @if \(viewMode\(\) === 'calendar'\) \{.*?    \}(?=\s*<!-- ── Confirmación de eliminación ── -->)"

new_html = """    @if (viewMode() === 'calendar') {
      <div class="card shadow-sm border-0 mb-4 overflow-hidden" style="border-radius: 12px; height: 75vh; display: flex; flex-direction: column;">
        <div class="table-responsive flex-grow-1" style="background-color: #f8f9fa;">
          <table class="table table-bordered mb-0" style="min-width: max-content; table-layout: fixed;">
            <thead class="sticky-top shadow-sm" style="z-index: 1030;">
              <tr>
                <th class="bg-white border-bottom-0 text-center align-middle sticky-start shadow-sm" style="width: 120px; left: 0; z-index: 1031;">
                  <i class="bi bi-clock text-muted" style="font-size: 1.2rem;"></i>
                </th>
                <th class="p-0 border-0 bg-white">
                  <div style="display: grid; grid-template-columns: repeat(24, 120px);">
                    @for (h of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]; track h) {
                      <div class="border-end border-bottom text-center text-muted fw-bold py-2 bg-light" style="font-size: 0.85rem;">
                         {{ h.toString().padStart(2, '0') }}:00
                      </div>
                    }
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (day of calendarDays(); track day.dia) {
                @defer (on viewport) {
                  <tr>
                    <!-- Left Axis (Day Name) -->
                    <td class="bg-white text-center align-middle sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; width: 120px;">
                      <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                      <small class="text-muted">{{ day.total }} ses.</small>
                    </td>
                    
                    <!-- Timeline Grid for this Day -->
                    <td class="p-0 bg-white position-relative" style="vertical-align: top;">
                      <!-- Background Guides -->
                      <div class="position-absolute top-0 bottom-0 start-0" style="display: grid; grid-template-columns: repeat(24, 120px); pointer-events: none;">
                        @for (h of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]; track h) {
                          <div class="border-end h-100"></div>
                        }
                      </div>
                      
                      <!-- Events Grid -->
                      <div class="p-2 position-relative" style="display: grid; grid-template-columns: repeat(48, 60px); grid-auto-rows: min-content; gap: 6px; min-height: 100px;">
                        @for (session of day.sessions; track session.id) {
                          <div class="card border-0 shadow-sm session-card flex-shrink-0 overflow-hidden" 
                               [style.grid-column]="getGridColumn(session.start, session.end)"
                               [style.border-left]="'4px solid ' + session.actColor"
                               style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; min-width: 0;"
                               (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false"
                               (click)="openHorariosOffcanvas(session.actRef)">
                             <div class="card-body p-2 d-flex flex-column" [class.bg-light]="session.hovered" style="min-width: 0;">
                                
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                  <span class="badge bg-dark bg-opacity-10 text-dark border border-secondary-subtle fw-bold text-truncate" style="font-size: 0.65rem;">
                                    {{ formatHora(session.start) }}-{{ formatHora(session.end) }}
                                  </span>
                                </div>
                                
                                <strong class="d-block text-dark text-truncate lh-sm mb-1" style="font-size: 0.75rem;" [title]="session.actNombre">
                                   {{ session.actNombre }}
                                </strong>
                                
                                <div class="text-muted text-truncate mt-auto border-top border-light pt-1" style="font-size: 0.65rem;" [title]="session.profesor">
                                   <i class="bi bi-person me-1"></i>{{ session.profesor }}
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
                  </tr>
                } @placeholder {
                  <tr style="height: 120px;">
                    <td class="bg-white text-center align-middle sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; width: 120px;">
                      <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                    </td>
                    <td class="bg-white align-middle text-center text-muted opacity-50">
                      <div class="spinner-border spinner-border-sm text-secondary me-2" role="status"></div>
                      Cargando horarios...
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    }"""

html = re.sub(pattern, new_html, html, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML to Gantt Timeline View")
