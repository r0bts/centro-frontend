path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_horarios = re.search(r'(@if \(e\.horarios && e\.horarios\.length > 0\) \{.*?</div>\s*\n\s*\})', html, re.DOTALL)
if old_horarios:
    new_horarios = """@if (e.horarios && e.horarios.length > 0) {
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
                }"""
    html = html.replace(old_horarios.group(1), new_horarios)

with open(path, 'w') as f:
    f.write(html)
print("Replaced horarios list with Professor grouping and Inputs")
