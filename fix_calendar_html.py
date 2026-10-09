path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_events = """              <!-- Day Events -->
              <div class="p-2 d-flex flex-column gap-2 flex-grow-1" style="background-color: #f8f9fa; overflow-y: auto;">
                @for (item of day.acts; track item.act.id) {
                  @defer (on viewport) {
                    <div class="card border-0 shadow-sm" [style.border-left]="'4px solid ' + (item.act.color || '#6366f1')">
                      <div class="card-body p-2 position-relative">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                          <strong class="small text-truncate d-inline-block" style="max-width: 80%;" [title]="item.act.nombre">{{ item.act.nombre }}</strong>
                          <span class="badge bg-light text-dark px-1 py-0 border" style="font-size: 0.65rem;">{{ item.act.icono || '🏆' }}</span>
                        </div>
                        
                        <div class="text-muted mb-2" style="font-size: 0.7rem;">
                          <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-1">{{ item.totalSesiones }} sesiones</span>
                        </div>
                        
                        <div class="d-flex flex-column gap-1">
                          @for (slot of item.slots; track slot.start + '-' + slot.end) {
                            <div class="d-flex align-items-center justify-content-between" style="font-size: 0.7rem;">
                              <span class="text-muted"><i class="bi bi-clock me-1"></i>{{ formatHora(slot.start) }} - {{ formatHora(slot.end) }}</span>
                              <span class="text-secondary fw-semibold">x{{ slot.count }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  } placeholder {
                    <div class="card border-0 shadow-sm mb-2" style="height: 100px;">
                      <div class="card-body placeholder-glow p-2">
                        <span class="placeholder col-8 mb-2"></span>
                        <span class="placeholder col-4 mb-2"></span>
                        <span class="placeholder col-10"></span>
                      </div>
                    </div>
                  }
                }
                @if (day.acts.length === 0) {
                  <div class="text-center text-muted my-auto py-4" style="font-size: 0.8rem;">
                    <i class="bi bi-calendar-x mb-1 d-block" style="font-size: 1.2rem;"></i>
                    Libre
                  </div>
                }
              </div>"""

new_events = """              <!-- Day Events -->
              <div class="p-2 d-flex flex-column gap-2 flex-grow-1" style="background-color: #f8f9fa; overflow-y: auto;">
                @for (session of day.sessions; track session.id) {
                  @defer (on viewport) {
                    <div class="card border-0 shadow-sm session-card" [style.border-left]="'4px solid ' + session.actColor" style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;"
                         (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false">
                      <div class="card-body p-2 position-relative" [class.bg-light]="session.hovered">
                        
                        <!-- Header: Time and Icon -->
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <span class="badge bg-dark bg-opacity-10 text-dark border border-secondary-subtle fw-bold" style="font-size: 0.7rem;">
                            <i class="bi bi-clock me-1"></i>{{ formatHora(session.start) }} - {{ formatHora(session.end) }}
                          </span>
                          <span class="badge bg-white text-dark px-1 py-0 shadow-sm" style="font-size: 0.75rem; border: 1px solid #dee2e6;">{{ session.actIcono }}</span>
                        </div>

                        <!-- Activity & Group -->
                        <div class="mb-2">
                          <strong class="d-block text-dark text-truncate lh-sm" style="font-size: 0.85rem;" [title]="session.actNombre">{{ session.actNombre }}</strong>
                          <span class="text-muted text-truncate d-block" style="font-size: 0.7rem;" [title]="session.grupoNombre">{{ session.grupoNombre }}</span>
                        </div>
                        
                        <!-- Meta: Professor & Location -->
                        <div class="d-flex flex-column gap-1">
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
                          <div class="position-absolute bottom-0 end-0 p-1 bg-white rounded-start border shadow-sm" style="transform: translateY(20%); z-index: 10;">
                             <button class="btn btn-sm btn-light border-0 py-0 px-1 text-primary" title="Horarios" (click)="openHorariosOffcanvas(session.actRef); $event.stopPropagation()">
                               <i class="bi bi-calendar-range" style="font-size: 0.8rem;"></i>
                             </button>
                             <button class="btn btn-sm btn-light border-0 py-0 px-1 text-secondary" title="Editar Actividad" (click)="editActividad(session.actRef); $event.stopPropagation()">
                               <i class="bi bi-pencil" style="font-size: 0.8rem;"></i>
                             </button>
                          </div>
                        }
                      </div>
                    </div>
                  } placeholder {
                    <div class="card border-0 shadow-sm mb-2" style="height: 120px;">
                      <div class="card-body placeholder-glow p-2">
                        <span class="placeholder col-4 mb-2"></span>
                        <span class="placeholder col-8 mb-2"></span>
                        <span class="placeholder col-10 mb-1"></span>
                        <span class="placeholder col-6"></span>
                      </div>
                    </div>
                  }
                }
                @if (day.sessions.length === 0) {
                  <div class="text-center text-muted my-auto py-4" style="font-size: 0.8rem;">
                    <i class="bi bi-calendar-x mb-1 d-block" style="font-size: 1.2rem;"></i>
                    Libre
                  </div>
                }
              </div>"""

html = html.replace(old_events, new_events)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML calendar view")
