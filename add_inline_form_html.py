path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_prof_header = """                            <!-- Subencabezado de Profesor -->
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
                            </div>"""

new_prof_header = """                            <!-- Subencabezado de Profesor -->
                            <div class="px-3 py-2 bg-white d-flex justify-content-between align-items-center border-bottom" style="border-left: 3px solid #6366f1;">
                              <div class="fw-semibold text-dark" style="font-size: 0.8rem; text-transform: capitalize;">
                                <i class="bi bi-person-circle text-muted me-1"></i> {{ profGroup.profesor_nombre.toLowerCase() }}
                              </div>
                              <div class="d-flex align-items-center gap-2">
                                <div class="badge bg-light text-secondary border fw-medium">
                                  <i class="bi bi-clock me-1"></i>{{ profGroup.rango_horas }}
                                </div>
                                <button class="btn btn-sm btn-light border p-0 d-flex align-items-center justify-content-center text-primary" style="width: 24px; height: 24px; border-radius: 6px;" title="Añadir horario a este profesor" (click)="openInlineForm(e.id, grupoDia.dia, profGroup.profesor_id)">
                                  <i class="bi bi-plus"></i>
                                </button>
                              </div>
                            </div>

                            <!-- Lista de horarios (Inputs) -->
                            <div class="px-3 py-2 bg-white" [class.border-bottom]="!lastProf">
                              @for (h of profGroup.horarios; track h.id) {
                                <div class="d-flex align-items-center gap-2 mb-2">
                                  <div class="input-group input-group-sm w-100">
                                    <span class="input-group-text bg-light text-muted border-end-0"><i class="bi bi-box-arrow-in-right"></i></span>
                                    <input type="time" class="form-control text-center bg-white" [value]="h.hora_inicio.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                    <span class="input-group-text bg-light text-muted border-start-0 border-end-0">a</span>
                                    <input type="time" class="form-control text-center bg-white" [value]="h.hora_fin.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                  </div>
                                  <button class="btn btn-sm btn-outline-danger px-2 flex-shrink-0" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                                    <i class="bi bi-trash"></i>
                                  </button>
                                </div>
                              }
                              
                              <!-- Formulario Inline -->
                              @if (inlineFormEquipoId() === e.id && inlineFormDia() === grupoDia.dia && inlineFormProfesorId() === profGroup.profesor_id) {
                                <div class="d-flex align-items-center gap-2 mt-2 p-2 bg-light border border-primary rounded border-opacity-25" style="box-shadow: inset 0 0 0 1px rgba(13,110,253,.15);">
                                  <div class="input-group input-group-sm w-100">
                                    <input type="time" class="form-control text-center border-primary border-opacity-50" [(ngModel)]="horarioForm.hora_inicio">
                                    <span class="input-group-text bg-white text-muted border-primary border-opacity-50 border-start-0 border-end-0">a</span>
                                    <input type="time" class="form-control text-center border-primary border-opacity-50" [(ngModel)]="horarioForm.hora_fin">
                                  </div>
                                  <button class="btn btn-sm btn-primary px-2 flex-shrink-0" title="Guardar" (click)="saveInlineForm()" [disabled]="!horarioForm.hora_inicio || !horarioForm.hora_fin">
                                    <i class="bi bi-check-lg"></i>
                                  </button>
                                  <button class="btn btn-sm btn-light border px-2 flex-shrink-0 text-secondary" title="Cancelar" (click)="inlineFormEquipoId.set(null)">
                                    <i class="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              }
                            </div>"""

html = html.replace(old_prof_header, new_prof_header)

with open(path, 'w') as f:
    f.write(html)
print("Added inline form to HTML")
