import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

start_marker = "<!-- ════ PASO 4: Horarios ════ -->"
end_marker = "<!-- ════ PASO 5: Evaluación ════ -->"
start_idx = html.find(start_marker)
end_idx = html.find(end_marker)

new_step4 = """<!-- ════ PASO 4: Horarios ════ -->
      @if (currentStep() === 4) {
        <div class="step-content">
          <h6 class="step-section-title text-uppercase fw-bold text-secondary mb-3">Horarios de entrenamiento</h6>
          <p class="text-muted small mb-4">Configura los días y horarios de cada grupo.</p>

          @if (grupos().length === 0) {
            <div class="empty-hint text-center py-5">
              <i class="bi bi-clock text-muted d-block mb-2" style="font-size:2rem"></i>
              <span>No hay grupos definidos. Vuelve al paso anterior.</span>
            </div>
          } @else {
            <div class="d-flex flex-column h-100">
              <!-- Tabs por grupo -->
              <div class="grupo-tabs mb-4">
                @for (g of grupos(); track trackByIdx($index, g); let gi = $index) {
                  <button type="button" class="btn btn-sm rounded-pill px-3 fw-medium me-2 mb-2"
                          [class.btn-primary]="activeGrupoIndex() === gi"
                          [class.btn-outline-secondary]="activeGrupoIndex() !== gi"
                          (click)="activeGrupoIndex.set(gi)">
                    {{ g.nombre }}
                  </button>
                }
              </div>

              @let gIdx = activeGrupoIndex();
              @let gActual = grupos()[gIdx];
              @if (gActual) {
                <div class="horario-panel">
                  <label class="form-label fw-bold mb-3">Días</label>
                  <div class="dias-chips mb-4">
                    @for (d of dias; track d.num) {
                      <button type="button" class="dia-chip"
                              [class.selected]="isDiaSelected(gIdx, d.num)"
                              (click)="toggleDia(gIdx, d.num)">
                        {{ d.label }}
                      </button>
                    }
                  </div>

                  @if (gActual.horarios.length === 0) {
                    <p class="text-muted small">Selecciona días para configurar horarios.</p>
                  }

                  <div class="row g-3">
                    @for (d of dias; track d.num) {
                      @if (isDiaSelected(gIdx, d.num)) {
                        <div class="col-12">
                          <div class="dia-horario-card p-3 border rounded shadow-sm bg-white">
                            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                              <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-primary fs-6 rounded">{{ d.label }}</span>
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
                                               [class.btn-outline-secondary]="!isDiaParaReplicar(rd.num) && !isDiaSelected(gIdx, rd.num)"
                                               [class.btn-outline-warning]="!isDiaParaReplicar(rd.num) && isDiaSelected(gIdx, rd.num)"
                                               style="cursor: pointer;">
                                          <input type="checkbox" class="d-none"
                                                 [checked]="isDiaParaReplicar(rd.num)"
                                                 (change)="toggleDiaReplica(rd.num, $any($event.target).checked)">
                                          {{ rd.label }}
                                          @if (isDiaSelected(gIdx, rd.num)) {
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
                                      <input type="time" class="form-control form-control-sm rounded-pill"
                                             [value]="h.item.hora_inicio"
                                             (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_inicio', $any($event.target).value)">
                                    </div>
                                    <div class="col-12 col-md-3">
                                      <label class="form-label small text-muted mb-1 d-block">Fin</label>
                                      <input type="time" class="form-control form-control-sm rounded-pill"
                                             [value]="h.item.hora_fin"
                                             (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_fin', $any($event.target).value)">
                                    </div>
                                    <div class="col-12 col-md-5">
                                      <label class="form-label small text-muted mb-1 d-block">Área</label>
                                      @if (getAreasByClub().length === 0) {
                                        <input type="text" class="form-control form-control-sm rounded-pill" disabled
                                               placeholder="No hay áreas mapeadas para este club">
                                      } @else {
                                        <select class="form-select form-select-sm rounded-pill"
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
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      """

html = html[:start_idx] + new_step4 + html[end_idx:]
with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML with proper classes!")
