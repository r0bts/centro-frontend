path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

# We need to extract the content inside @defer (on viewport) { ... } and remove @placeholder { ... }
# Let's just do a manual string replace or regex.

old_block = """                @for (session of day.sessions; track $index) {
                  @defer (on viewport) {
                    <div class="card border-0 shadow-sm session-card position-relative overflow-hidden mb-2" [style.border-left]="'4px solid ' + session.actColor" style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;"
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
                    <div class="card border-0 shadow-sm session-card mb-2" style="height: 100px;">
                      <div class="card-body placeholder-glow p-2">
                        <span class="placeholder col-8 mb-2"></span>
                        <span class="placeholder col-4 mb-2"></span>
                        <span class="placeholder col-10"></span>
                      </div>
                    </div>
                  }
                }"""

new_block = """                @for (session of day.sessions; track $index) {
                    <div class="card border-0 shadow-sm session-card position-relative overflow-hidden mb-2" [style.border-left]="'4px solid ' + session.actColor" style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;"
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
                }"""

html = html.replace(old_block, new_block)

with open(path, 'w') as f:
    f.write(html)
print("Removed @defer")
