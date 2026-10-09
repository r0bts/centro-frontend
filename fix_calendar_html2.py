path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

pattern = r"<!-- Day Events -->\s*<div class=\"p-2 d-flex flex-column gap-2 flex-grow-1\".*?</div>\s*</div>\s*}"

new_events = """<!-- Day Events -->
              <div class="p-2 d-flex flex-column gap-2 flex-grow-1" style="background-color: #f8f9fa; overflow-y: auto;">
                @for (session of day.sessions; track session.id) {
                  @defer (on viewport) {
                    <div class="card border-0 shadow-sm session-card position-relative overflow-hidden" [style.border-left]="'4px solid ' + session.actColor" style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;"
                         (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false"
                         (click)="openHorariosOffcanvas(session.actRef)">
                      <div class="card-body p-2" [class.bg-light]="session.hovered">
                        
                        <!-- Header: Time and Icon -->
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <span class="badge bg-dark bg-opacity-10 text-dark border border-secondary-subtle fw-bold" style="font-size: 0.7rem;">
                            <i class="bi bi-clock me-1"></i>{{ formatHora(session.start) }} - {{ formatHora(session.end) }}
                          </span>
                          <span class="badge bg-white text-dark px-1 py-0 shadow-sm" style="font-size: 0.75rem; border: 1px solid #dee2e6;">{{ session.actIcono }}</span>
                        </div>

                        <!-- Activity & Group -->
                        <div class="mb-2 pe-3">
                          <strong class="d-block text-dark text-truncate lh-sm" style="font-size: 0.85rem;" [title]="session.actNombre">{{ session.actNombre }}</strong>
                          <span class="text-muted text-truncate d-block mt-1" style="font-size: 0.7rem;" [title]="session.grupoNombre">
                            <span class="badge bg-light text-secondary border border-secondary-subtle fw-normal py-0">{{ session.grupoNombre }}</span>
                          </span>
                        </div>
                        
                        <!-- Meta: Professor & Location -->
                        <div class="d-flex flex-column gap-1 mt-2 pt-2 border-top border-light">
                          <div class="d-flex align-items-center text-secondary text-truncate" style="font-size: 0.7rem;" [title]="session.profesor">
                            <i class="bi bi-person me-1"></i>
                            <span class="text-truncate">{{ session.profesor }}</span>
                          </div>
                          <div class="d-flex align-items-center text-secondary text-truncate" style="font-size: 0.7rem;" [title]="session.ubicacion">
                            <i class="bi bi-geo-alt me-1"></i>
                            <span class="text-truncate">{{ session.ubicacion }}</span>
                          </div>
                        </div>

                        <!-- Actions Overlay (Hover) -->
                        @if (session.hovered) {
                          <div class="position-absolute bottom-0 end-0 p-1 rounded-start" style="z-index: 10;">
                             <button class="btn btn-sm btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" title="Editar Actividad" (click)="editActividad(session.actRef); $event.stopPropagation()">
                               <i class="bi bi-pencil" style="font-size: 0.7rem;"></i>
                             </button>
                          </div>
                        }

                        @if (!session.actRef.is_active) {
                          <div class="position-absolute top-0 start-0 w-100 h-100 bg-white" style="opacity: 0.6; pointer-events: none;"></div>
                        }
                      </div>
                    </div>
                  } @placeholder {
                    <div style="height: 120px; border-radius: 6px;" class="bg-white border-0 shadow-sm opacity-50 mb-2"></div>
                  }
                }
                
                @if (day.sessions.length === 0) {
                  <div class="text-center text-muted my-auto py-4 small">
                    <i class="bi bi-calendar-x mb-1 d-block" style="font-size: 1.2rem;"></i>
                    Sin actividades
                  </div>
                }
              </div>
            </div>
          }"""

html = re.sub(pattern, new_events, html, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML calendar view using Regex")
