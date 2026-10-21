import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# I will find everything from '<div class="row g-3">' up to the closing tags before '</div> <!-- end of horario-panel -->'
start_idx = html.find('<div class="row g-3">')
# Look for:
#                 </div>
#               }
#             </div>
#           }
end_str = "              }\n            </div>\n          }\n        </div>\n      }\n\n      <!-- ════ PASO 5: Evaluación ════ -->"
end_idx = html.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
else:
    new_html = """                  <div class="d-flex flex-column gap-3">
                    @for (d of dias; track d.num) {
                      <div class="dia-horario-card p-3 border rounded shadow-sm bg-white">
                        <div class="d-flex justify-content-between align-items-center pb-2" [class.border-bottom]="getHorariosByDia(gIdx, d.num).length > 0 || diaReplicando() === d.num" [class.mb-3]="getHorariosByDia(gIdx, d.num).length > 0 || diaReplicando() === d.num">
                          <div class="d-flex align-items-center gap-2">
                            <span class="fw-bold fs-5">{{ getDiaNombre(d.num) }}</span>
                          </div>
                          <div class="d-flex gap-2">
                            <!-- Botón Replicar -->
                            @if (getHorariosByDia(gIdx, d.num).length > 0) {
                              <button class="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1"
                                      title="Replicar este horario en otros días"
                                      (click)="iniciarReplica(d.num)">
                                <i class="bi bi-files"></i>
                                <span class="d-none d-sm-inline">Replicar</span>
                              </button>
                            }
                            <!-- Botón Añadir -->
                            <button class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1 bg-white"
                                    (click)="addHorarioOnly(gIdx, d.num)">
                              <i class="bi bi-plus-circle"></i> <span class="d-none d-sm-inline">Añadir horario</span>
                            </button>
                          </div>
                        </div>
                        
                        <div class="dia-horario-body">
                          <!-- Panel de réplica inline -->
                          @if (diaReplicando() === d.num) {
                            <div class="replicate-panel mb-3 p-3 bg-light border rounded">
                              <label class="fw-semibold small d-block mb-2">
                                <i class="bi bi-copy me-1"></i> Replicar horarios de <strong>{{ getDiaNombre(d.num) }}</strong> a:
                              </label>
                              <div class="replicate-panel__days d-flex flex-wrap gap-2 mb-3">
                                @for (rd of dias; track rd.num) {
                                  @if (rd.num !== d.num) {
                                    <label class="btn btn-sm rounded-pill"
                                           [class.btn-primary]="isDiaParaReplicar(rd.num)"
                                           [class.btn-outline-secondary]="!isDiaParaReplicar(rd.num) && getHorariosByDia(gIdx, rd.num).length === 0"
                                           [class.btn-outline-warning]="!isDiaParaReplicar(rd.num) && getHorariosByDia(gIdx, rd.num).length > 0"
                                           style="cursor: pointer;">
                                      <input type="checkbox" class="d-none"
                                             [checked]="isDiaParaReplicar(rd.num)"
                                             (change)="toggleDiaReplica(rd.num, $any($event.target).checked)">
                                      {{ rd.label }}
                                      @if (getHorariosByDia(gIdx, rd.num).length > 0) {
                                        <i class="bi bi-exclamation-triangle-fill ms-1" title="Se reemplazarán los horarios"></i>
                                      }
                                    </label>
                                  }
                                }
                              </div>
                              @if (tieneDestinosConConflicto(gIdx)) {
                                <div class="alert alert-warning py-1 px-2 small mb-3">
                                  <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                  Los días con advertencia ya tienen horarios configurados y serán <strong>reemplazados</strong>.
                                </div>
                              }
                              <div class="d-flex justify-content-end gap-2">
                                <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" (click)="cerrarReplicar()">Cancelar</button>
                                <button class="btn btn-sm btn-primary rounded-pill px-3"
                                        [disabled]="diasParaReplicar().length === 0"
                                        (click)="aplicarReplica(gIdx, d.num)">
                                  <i class="bi bi-check-lg me-1"></i>Aplicar
                                </button>
                              </div>
                            </div>
                          }

                          <div class="d-flex flex-column gap-2">
                            @for (h of getHorariosByDia(gIdx, d.num); track h.originalIndex) {
                              <div class="row g-2 align-items-center p-2 rounded bg-light border border-light-subtle mb-2">
                                <div class="col-12 col-md-3">
                                  <label class="form-label small text-muted mb-1 d-block">Inicio</label>
                                  <input type="time" class="form-control form-control-sm rounded-pill bg-white"
                                         [value]="h.item.hora_inicio"
                                         (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_inicio', $any($event.target).value)">
                                </div>
                                <div class="col-12 col-md-3">
                                  <label class="form-label small text-muted mb-1 d-block">Fin</label>
                                  <input type="time" class="form-control form-control-sm rounded-pill bg-white"
                                         [value]="h.item.hora_fin"
                                         (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_fin', $any($event.target).value)">
                                </div>
                                <div class="col-12 col-md-5">
                                  <label class="form-label small text-muted mb-1 d-block">Área</label>
                                  @if (getAreasByClub().length === 0) {
                                    <input type="text" class="form-control form-control-sm rounded-pill bg-white" disabled
                                           placeholder="No hay áreas mapeadas para este club">
                                  } @else {
                                    <select class="form-select form-select-sm rounded-pill bg-white"
                                            [ngModel]="h.item.area_id"
                                            (ngModelChange)="updateHorarioField(gIdx, h.originalIndex, 'area_id', $event || null)">
                                      <option [ngValue]="null">Sin área asignada</option>
                                      @for (area of getAreasByClub(); track area.area_id) {
                                        <option [ngValue]="area.area_id">{{ area.area_name }}</option>
                                      }
                                    </select>
                                  }
                                </div>
                                <div class="col-12 col-md-1 d-flex justify-content-end align-items-end h-100 pb-1">
                                  <button class="btn btn-sm text-danger border-0 p-1"
                                          title="Eliminar horario"
                                          (click)="removeHorario(gIdx, h.originalIndex)">
                                    <i class="bi bi-trash fs-5"></i>
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
"""
    html = html[:start_idx] + new_html + "\n" + end_str + html[end_idx + len(end_str):]
    with open(html_path, 'w') as f:
        f.write(html)
    print("Force replaced HTML successfully!")
