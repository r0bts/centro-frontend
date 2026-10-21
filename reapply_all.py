path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# 1. Switch
old_switch = """                <input class="form-check-input m-0" type="checkbox" role="switch"
                       [checked]="act.elegible_para_socios !== false" 
                       (change)="toggleSocios(act)"
                       style="cursor: pointer; width: 1.8rem; height: 0.9rem;"
                       
                       
                       
                       >"""
new_switch = """                <input class="form-check-input m-0" type="checkbox" role="switch"
                       [checked]="act.elegible_para_socios !== false" 
                       (change)="toggleSocios(act)"
                       style="cursor: pointer; width: 2.2rem; height: 1.1rem;">"""
html = html.replace(old_switch, new_switch)

# 2. Duplicate button in list view
old_actions = """                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>"""
new_actions = """                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Duplicar" (click)="duplicateActividad(act)">
                        <i class="bi bi-files" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>"""
html = html.replace(old_actions, new_actions)

# 3. Filter Acceso
old_filter = """          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Zona (Área)</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterAreaId">
              <option [ngValue]="null">Todas las áreas</option>
              @for (a of formData()?.areas_mapeadas; track a.area_id) {
                <option [ngValue]="a.area_id">{{ a.area_name }}</option>
              }
            </select>
          </div>"""
new_filter = """          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Acceso</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterAcceso">
              <option [ngValue]="null">Cualquiera</option>
              <option [ngValue]="true">Socios</option>
              <option [ngValue]="false">Staff</option>
            </select>
          </div>"""
html = html.replace(old_filter, new_filter)

# 4. Calendar HTML
old_cal = """                @for (item of day.acts; track item.act.id) {
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

                        @if (!item.act.is_active) {
                          <div class="position-absolute top-0 start-0 w-100 h-100 bg-white" style="opacity: 0.7; pointer-events: none;"></div>
                        }
                      </div>
                    </div>
                  } @placeholder {
                    <div style="height: 100px; border-radius: 6px;" class="bg-white border-0 shadow-sm opacity-50 mb-2"></div>
                  }
                }
                
                @if (day.acts.length === 0) {"""

new_cal = """                @for (session of day.sessions; track session.id) {
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
                    <div style="height: 120px; border-radius: 6px;" class="bg-white border-0 shadow-sm opacity-50 mb-2"></div>
                  }
                }
                
                @if (day.sessions.length === 0) {"""

html = html.replace(old_cal, new_cal)

with open(path, 'w') as f:
    f.write(html)
print("Updated ALL HTML")
