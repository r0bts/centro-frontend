path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

# 1. Add the Horarios button to the Actions column
old_actions = """                  <!-- Acciones -->
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

new_actions = """                  <!-- Acciones -->
                  <td class="text-end pe-4">
                    <div class="btn-group border rounded-pill bg-white shadow-sm" role="group">
                      <button type="button" class="btn btn-sm btn-light border-0 rounded-start-pill text-primary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px; background-color: #f0f4ff;" title="Horarios" (click)="openHorariosOffcanvas(act)">
                        <i class="bi bi-clock" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start text-secondary d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Editar" (click)="editActividad(act)">
                        <i class="bi bi-pencil" style="font-size: 0.85rem;"></i>
                      </button>
                      <button type="button" class="btn btn-sm btn-light border-0 border-start rounded-end-pill text-danger d-flex align-items-center justify-content-center" style="width: 36px; height: 32px;" title="Eliminar" (click)="confirmDelete(act)">
                        <i class="bi bi-trash" style="font-size: 0.85rem;"></i>
                      </button>
                    </div>
                  </td>"""
html = html.replace(old_actions, new_actions)

# 2. Add Offcanvas container at the end of the file
offcanvas_html = """

  <!-- ── Offcanvas para Horarios ── -->
  @if (isOffcanvasOpen() && selectedActividadForHorarios()) {
    <div class="modal-backdrop fade show" style="z-index: 1040;" (click)="closeHorariosOffcanvas()"></div>
    <div class="offcanvas offcanvas-end show" tabindex="-1" style="z-index: 1045; width: 450px; visibility: visible;" aria-labelledby="offcanvasHorariosLabel">
      <div class="offcanvas-header bg-light border-bottom">
        <div>
          <h5 class="offcanvas-title fw-bold" id="offcanvasHorariosLabel">
            <i class="bi bi-clock text-primary me-2"></i>Horarios Rápidos
          </h5>
          <span class="text-muted small text-uppercase">{{ selectedActividadForHorarios()!.nombre }}</span>
        </div>
        <button type="button" class="btn-close" (click)="closeHorariosOffcanvas()" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body p-0" style="background-color: #f8f9fa;">
        @for (g of selectedActividadForHorarios()!.grupos_categorias || []; track g.id) {
          @for (e of g.equipos || []; track e.id) {
            <div class="card border-0 shadow-sm mx-3 mt-3 mb-3">
              <div class="card-header bg-white border-bottom-0 pt-3 pb-1">
                <h6 class="mb-0 fw-bold text-dark d-flex align-items-center">
                  <i class="bi bi-diagram-3 text-secondary me-2"></i>
                  {{ g.nombre }} <span class="text-muted fw-normal ms-1">/ {{ e.nombre }}</span>
                </h6>
              </div>
              <div class="card-body pt-2">
                <!-- Lista de horarios existentes -->
                @if (e.horarios && e.horarios.length > 0) {
                  <div class="d-flex flex-column gap-2 mb-3">
                    @for (h of e.horarios; track h.id) {
                      <div class="d-flex align-items-center justify-content-between p-2 border rounded" style="background: #fff;">
                        <div>
                          <div class="fw-semibold text-dark" style="font-size: 0.85rem;">
                            {{ daysMapping[h.dia_semana] || 'Día' }}
                          </div>
                          <div class="text-muted" style="font-size: 0.75rem;">
                            {{ formatHora(h.hora_inicio) }} - {{ formatHora(h.hora_fin) }}
                          </div>
                          @if (h.profesor_id) {
                            <div class="text-primary mt-1" style="font-size: 0.7rem; text-transform: capitalize;">
                              <i class="bi bi-person-fill"></i> {{ getInstructorName(h.profesor_id) }}
                            </div>
                          }
                        </div>
                        <button class="btn btn-sm text-danger border-0 p-1" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center text-muted small py-2 mb-3 bg-light rounded border border-dashed">
                    No hay horarios registrados.
                  </div>
                }

                <!-- Formulario rápido para agregar nuevo -->
                <div class="p-2 bg-light rounded border">
                  <div class="text-secondary small fw-bold mb-2"><i class="bi bi-plus-circle me-1"></i>Añadir horario</div>
                  <div class="row g-2 mb-2">
                    <div class="col-12">
                      <select class="form-select form-select-sm" [(ngModel)]="horarioForm.dia_semana">
                        <option [value]="1">Lunes</option>
                        <option [value]="2">Martes</option>
                        <option [value]="3">Miércoles</option>
                        <option [value]="4">Jueves</option>
                        <option [value]="5">Viernes</option>
                        <option [value]="6">Sábado</option>
                        <option [value]="7">Domingo</option>
                      </select>
                    </div>
                    <div class="col-6">
                      <input type="time" class="form-control form-control-sm" [(ngModel)]="horarioForm.hora_inicio">
                    </div>
                    <div class="col-6">
                      <input type="time" class="form-control form-control-sm" [(ngModel)]="horarioForm.hora_fin">
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm w-100" (click)="addHorarioRapido(e.id)">
                    Agregar a {{ e.nombre }}
                  </button>
                </div>

              </div>
            </div>
          }
        }
        
        @if (!selectedActividadForHorarios()!.grupos_categorias || selectedActividadForHorarios()!.grupos_categorias?.length === 0) {
          <div class="text-center text-muted py-5 mx-3">
            <i class="bi bi-info-circle display-4 d-block mb-3 opacity-50"></i>
            Esta actividad no tiene grupos. <br>Edítala para agregar grupos primero.
          </div>
        }
      </div>
    </div>
  }
"""

html = html + offcanvas_html

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML with offcanvas")
