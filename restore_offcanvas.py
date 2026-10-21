path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

offcanvas_html = """
  <!-- ── Offcanvas para Horarios ── -->
  @if (isOffcanvasOpen() && selectedActividadForHorarios()) {
    <div class="offcanvas-backdrop fade show" style="z-index: 1040; position: fixed; inset: 0; cursor: pointer;" (click)="closeHorariosOffcanvas()"></div>
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
                @if (e.horarios && e.horarios.length > 0) {
                  <div class="d-flex flex-column gap-3 mb-3">
                    @for (grupoDia of agruparPorDia(e.horarios); track grupoDia.dia) {
                      <div class="border rounded shadow-sm" style="background: #fff; overflow: hidden;">
                        <!-- Encabezado del Día -->
                        <div class="bg-light px-3 py-2 border-bottom text-dark fw-bold text-uppercase d-flex align-items-center" style="font-size: 0.85rem; letter-spacing: 0.5px;">
                          <i class="bi bi-calendar-day me-2 text-primary"></i>{{ daysMapping[grupoDia.dia] || 'Día' }}
                        </div>
                        
                        <div class="d-flex flex-column">
                          @for (profGroup of grupoDia.profesores; track profGroup.profesor_id; let lastProf = $last) {
                            
                            <!-- Subencabezado de Profesor -->
                            <div class="px-3 py-2 bg-white d-flex justify-content-between align-items-center border-bottom" style="border-left: 3px solid #6366f1;">
                              <div class="fw-semibold text-dark" style="font-size: 0.8rem; text-transform: capitalize;">
                                <i class="bi bi-person-circle text-muted me-1"></i> {{ profGroup.profesor_nombre.toLowerCase() }}
                              </div>
                              <div class="badge bg-light text-secondary border fw-medium">
                                <i class="bi bi-clock me-1"></i>{{ profGroup.rango_horas }}
                              </div>
                            </div>

                            <!-- Lista de horarios (Inputs) -->
                            <div class="px-3 py-2 bg-white" [class.border-bottom]="!lastProf">
                              @for (h of profGroup.horarios; track h.id) {
                                <div class="d-flex align-items-center gap-2 mb-2">
                                  <div class="input-group input-group-sm w-100">
                                    <span class="input-group-text bg-light text-muted border-end-0"><i class="bi bi-box-arrow-in-right"></i></span>
                                    <input type="time" class="form-control text-center" [value]="h.hora_inicio.substring(0,5)" readonly title="Hora inicio (Solo lectura por ahora)">
                                    <span class="input-group-text bg-light text-muted border-start-0 border-end-0">a</span>
                                    <input type="time" class="form-control text-center" [value]="h.hora_fin.substring(0,5)" readonly title="Hora fin (Solo lectura por ahora)">
                                  </div>
                                  <button class="btn btn-sm btn-outline-danger px-2 flex-shrink-0" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                                    <i class="bi bi-trash"></i>
                                  </button>
                                </div>
                              }
                            </div>
                          }
                        </div>
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
                    <div class="col-12 mt-1">
                      <button class="btn btn-sm btn-primary w-100" (click)="addHorarioRapido(e.id)" [disabled]="!horarioForm.dia_semana || !horarioForm.hora_inicio || !horarioForm.hora_fin">
                        Guardar horario
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  }
"""

html = html.replace('<!-- ── Wizard ── -->', offcanvas_html + '\n  <!-- ── Wizard ── -->')

with open(path, 'w') as f:
    f.write(html)
print("Restored Offcanvas HTML")
