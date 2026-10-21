import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

start_marker = '<div class="row g-3">'
end_marker = '<!-- ════ PASO 5: Evaluación ════ -->'

start_idx = html.find(start_marker)
end_idx = html.find(end_marker)

replacement = """<div class="d-flex flex-column gap-2 border rounded bg-white overflow-hidden">
                  @for (d of dias; track d.num) {
                    @if (isDiaSelected(gIdx, d.num)) {
                      <div class="d-flex flex-column flex-md-row align-items-md-start p-3 border-bottom position-relative">
                        <!-- Día Header -->
                        <div class="d-flex align-items-center gap-2 mb-2 mb-md-0" style="width: 140px; flex-shrink: 0;">
                          <span class="badge bg-primary-subtle text-primary rounded fs-6 fw-bold border border-primary-subtle px-2 py-1">{{ d.label }}</span>
                          <span class="fw-semibold text-secondary d-md-none">{{ getDiaNombre(d.num) }}</span>
                        </div>

                        <!-- Horarios -->
                        <div class="flex-grow-1 w-100">
                          @if (getHorariosByDia(gIdx, d.num).length === 0) {
                            <div class="text-muted small py-1">No hay horarios configurados</div>
                          }
                          <div class="d-flex flex-column gap-2">
                            @for (h of getHorariosByDia(gIdx, d.num); track h.originalIndex) {
                              <div class="d-flex flex-wrap flex-md-nowrap gap-2 align-items-center">
                                <input type="time" class="form-control form-control-sm" style="width: 100px;"
                                       [value]="h.item.hora_inicio"
                                       (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_inicio', $any($event.target).value)">
                                <span class="text-muted small">a</span>
                                <input type="time" class="form-control form-control-sm" style="width: 100px;"
                                       [value]="h.item.hora_fin"
                                       (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_fin', $any($event.target).value)">
                                
                                @if (getAreasByClub().length === 0) {
                                  <input type="text" class="form-control form-control-sm flex-grow-1" disabled placeholder="Sin áreas">
                                } @else {
                                  <select class="form-select form-select-sm flex-grow-1" style="min-width: 150px;"
                                          [ngModel]="h.item.area_id"
                                          (ngModelChange)="updateHorarioField(gIdx, h.originalIndex, 'area_id', $event || null)">
                                    <option [ngValue]="null">Sin área</option>
                                    @for (area of getAreasByClub(); track area.area_id) {
                                      <option [ngValue]="area.area_id">{{ area.area_name }}</option>
                                    }
                                  </select>
                                }

                                <button class="btn btn-sm text-danger border-0 p-1" title="Quitar" (click)="removeHorario(gIdx, h.originalIndex)">
                                  <i class="bi bi-x-lg"></i>
                                </button>
                              </div>
                            }
                          </div>
                          
                          <!-- Panel de réplica inline -->
                          @if (replicandoDia()?.grupoIdx === gIdx && replicandoDia()?.dia === d.num) {
                            <div class="replicate-panel mt-3 p-3 bg-light rounded border">
                              <div class="replicate-panel__title mb-2">
                                <i class="bi bi-copy me-1"></i> Copiar a:
                              </div>
                              <div class="d-flex flex-wrap gap-2 mb-2">
                                @for (rd of dias; track rd.num) {
                                  @if (rd.num !== d.num) {
                                    <label class="btn btn-sm btn-outline-primary" [class.active]="isDiaParaReplicar(rd.num)">
                                      <input type="checkbox" class="visually-hidden"
                                             [checked]="isDiaParaReplicar(rd.num)"
                                             (change)="toggleDiaReplica(rd.num, $any($event.target).checked)">
                                      {{ rd.label }}
                                    </label>
                                  }
                                }
                              </div>
                              <div class="d-flex justify-content-end gap-2 mt-3">
                                <button class="btn btn-sm btn-light border" (click)="cerrarReplicar()">Cancelar</button>
                                <button class="btn btn-sm btn-primary"
                                        [disabled]="diasParaReplicar().length === 0"
                                        (click)="aplicarReplica(gIdx, d.num)">
                                  Aplicar
                                </button>
                              </div>
                            </div>
                          }
                        </div>

                        <!-- Acciones -->
                        <div class="d-flex gap-1 ms-md-3 mt-2 mt-md-0 justify-content-end">
                          @if (getHorariosByDia(gIdx, d.num).length > 0) {
                            <button class="btn btn-sm btn-light border text-primary" title="Copiar horario" (click)="toggleReplicar(gIdx, d.num)">
                              <i class="bi bi-copy"></i>
                            </button>
                          }
                          <button class="btn btn-sm btn-light border text-success" title="Añadir otro horario este día" (click)="addHorarioOnly(gIdx, d.num)">
                            <i class="bi bi-plus-lg"></i>
                          </button>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          }
        </div>
      }

      """

html = html[:start_idx] + replacement + html[end_idx:]

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
print("Success replacing Horarios.")
