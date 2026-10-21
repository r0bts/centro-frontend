path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_loop = re.search(r'(@for \(g of selectedActividadForHorarios\(\)!\.grupos_categorias \|\| \[\]; track g\.id\) \{.*?)\s*</div>\s*</div>\s*</div>\s*}', html, re.DOTALL)

if old_loop:
    new_loop = """@for (g of selectedActividadForHorarios()!.grupos_categorias || []; track g.id) {
          @for (e of g.equipos || []; track e.id) {
            
            <!-- SEPARADOR DE EQUIPO (Nivel 1) -->
            <div class="bg-dark text-white px-3 py-2 sticky-top d-flex justify-content-between align-items-center shadow-sm" style="z-index: 10;">
              <div class="fw-medium" style="font-size: 0.85rem; letter-spacing: 0.5px;">
                <i class="bi bi-diagram-3 me-2 opacity-75"></i>
                <span class="opacity-75">{{ g.nombre }}</span> <i class="bi bi-chevron-right mx-1" style="font-size: 0.6rem;"></i> <strong>{{ e.nombre }}</strong>
              </div>
            </div>

            <div class="pb-4">
              @if (e.horarios && e.horarios.length > 0) {
                <div class="d-flex flex-column pt-2">
                  @for (grupoDia of agruparPorDia(e.horarios); track grupoDia.dia) {
                    
                    <!-- SEPARADOR DE DÍA (Nivel 2) -->
                    <div class="mt-3 mb-2 px-3 d-flex align-items-center">
                      <div class="text-primary fw-bold text-uppercase" style="font-size: 0.75rem; letter-spacing: 1px;">
                        <i class="bi bi-calendar-event me-2"></i>{{ daysMapping[grupoDia.dia] || 'Día' }}
                      </div>
                      <div class="ms-3 flex-grow-1 border-top border-primary border-opacity-25"></div>
                    </div>
                    
                    <div class="d-flex flex-column gap-3 px-3">
                      @for (profGroup of grupoDia.profesores; track profGroup.profesor_id) {
                        
                        <!-- TARJETA DE PROFESOR (Nivel 3) -->
                        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                          <!-- Header de Profesor -->
                          <div class="card-header bg-white border-bottom-0 py-2 d-flex justify-content-between align-items-center" style="background: linear-gradient(to right, rgba(99,102,241,0.05), transparent);">
                            <div class="d-flex align-items-center gap-2">
                              <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style="width: 28px; height: 28px; font-size: 0.75rem;">
                                {{ profGroup.profesor_nombre.charAt(0).toUpperCase() }}
                              </div>
                              <span class="fw-semibold text-dark" style="font-size: 0.85rem; text-transform: capitalize;">
                                {{ profGroup.profesor_nombre.toLowerCase() }}
                              </span>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                              <span class="badge bg-light text-secondary border fw-medium px-2 py-1">
                                <i class="bi bi-clock me-1 opacity-75"></i>{{ profGroup.rango_horas }}
                              </span>
                              <button class="btn btn-sm btn-light border p-0 d-flex align-items-center justify-content-center text-primary rounded-circle shadow-sm" style="width: 26px; height: 26px;" title="Añadir horario a este profesor" (click)="openInlineForm(e.id, grupoDia.dia, profGroup.profesor_id)">
                                <i class="bi bi-plus-lg"></i>
                              </button>
                            </div>
                          </div>

                          <!-- Lista de horarios (Inputs Nivel 4) -->
                          <div class="card-body p-2 pt-0 bg-white">
                            @for (h of profGroup.horarios; track h.id) {
                              <div class="d-flex align-items-center gap-2 mt-2">
                                <div class="input-group input-group-sm w-100 rounded-pill border overflow-hidden bg-light">
                                  <span class="input-group-text bg-transparent text-muted border-0 ps-3 pe-1"><i class="bi bi-box-arrow-in-right opacity-50"></i></span>
                                  <input type="time" class="form-control text-center bg-transparent border-0 px-0 fw-medium text-dark" [value]="h.hora_inicio.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                  <span class="input-group-text bg-transparent text-muted border-0 px-1 opacity-50">a</span>
                                  <input type="time" class="form-control text-center bg-transparent border-0 px-0 fw-medium text-dark" [value]="h.hora_fin.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                </div>
                                <button class="btn btn-sm btn-outline-danger rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center bg-white" style="width: 32px; height: 32px; border-width: 1.5px;" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                                  <i class="bi bi-trash3"></i>
                                </button>
                              </div>
                            }
                            
                            <!-- Formulario Inline -->
                            @if (inlineFormEquipoId() === e.id && inlineFormDia() === grupoDia.dia && inlineFormProfesorId() === profGroup.profesor_id) {
                              <div class="d-flex align-items-center gap-2 mt-3 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill shadow-sm">
                                <div class="input-group input-group-sm w-100 rounded-pill overflow-hidden border border-primary border-opacity-25 bg-white">
                                  <input type="time" class="form-control text-center border-0 px-1 text-primary fw-bold" [(ngModel)]="horarioForm.hora_inicio">
                                  <span class="input-group-text bg-white text-primary border-0 px-1 opacity-50">a</span>
                                  <input type="time" class="form-control text-center border-0 px-1 text-primary fw-bold" [(ngModel)]="horarioForm.hora_fin">
                                </div>
                                <button class="btn btn-sm btn-primary rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center shadow-sm" style="width: 32px; height: 32px;" title="Guardar" (click)="saveInlineForm()" [disabled]="!horarioForm.hora_inicio || !horarioForm.hora_fin">
                                  <i class="bi bi-check2"></i>
                                </button>
                                <button class="btn btn-sm btn-light border-0 bg-white rounded-circle flex-shrink-0 text-secondary d-flex align-items-center justify-content-center shadow-sm" style="width: 32px; height: 32px;" title="Cancelar" (click)="inlineFormEquipoId.set(null)">
                                  <i class="bi bi-x-lg"></i>
                                </button>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center text-muted small py-4 mx-3 mt-3 bg-white rounded-4 shadow-sm border">
                  <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 48px; height: 48px;">
                    <i class="bi bi-calendar-x fs-4 text-secondary"></i>
                  </div>
                  <p class="mb-0 fw-medium">No hay horarios registrados.</p>
                  <p class="text-muted opacity-75" style="font-size: 0.75rem;">Usa el botón de editar la actividad para agregar.</p>
                </div>
              }
            </div>
          }
        }"""
    html = html.replace(old_loop.group(0), new_loop)
    with open(path, 'w') as f:
        f.write(html)
    print("Updated hierarchy successfully")
else:
    print("Could not find loop to replace")
