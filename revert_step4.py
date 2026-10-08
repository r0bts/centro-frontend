import re

# 1. Restore Step 4 HTML
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
          <h6 class="step-section-title">Horarios de entrenamiento</h6>
          <p class="text-muted small mb-3">Configura los días y horarios de cada grupo.</p>

          @if (grupos().length === 0) {
            <div class="empty-hint">
              <i class="bi bi-clock text-muted d-block mb-2" style="font-size:2rem"></i>
              <span>No hay grupos definidos. Vuelve al paso anterior.</span>
            </div>
          } @else {
            <div class="d-flex flex-column h-100">
              <!-- Tabs por grupo -->
              <div class="grupo-tabs mb-3">
                @for (g of grupos(); track trackByIdx($index, g); let gi = $index) {
                  <button type="button" class="grupo-tab"
                          [class.active]="activeGrupoIndex() === gi"
                          (click)="activeGrupoIndex.set(gi)">
                    {{ g.nombre }}
                  </button>
                }
              </div>

              @let gIdx = activeGrupoIndex();
              @let gActual = grupos()[gIdx];
              @if (gActual) {
                <div class="horario-panel">
                  <label class="form-label fw-semibold small">Días</label>
                  <div class="d-flex flex-wrap gap-2 mb-4">
                    @for (d of dias; track d.num) {
                      <button type="button" class="btn btn-sm rounded-pill fw-medium"
                              [class.btn-primary]="isDiaSelected(gIdx, d.num)"
                              [class.btn-outline-secondary]="!isDiaSelected(gIdx, d.num)"
                              [class.border-0]="isDiaSelected(gIdx, d.num)"
                              (click)="toggleDia(gIdx, d.num)">
                        {{ d.label }}
                      </button>
                    }
                  </div>

                  @for (d of dias; track d.num) {
                    @if (isDiaSelected(gIdx, d.num)) {
                      <div class="dia-horario-box">
                        <div class="dia-horario-header">
                          <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-primary fs-6">{{ d.label.substring(0,2) }}</span>
                            <span class="fw-bold">{{ d.label }}</span>
                          </div>
                          <div class="d-flex gap-2">
                            <!-- Botón Replicar -->
                            <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 bg-white"
                                    (click)="iniciarReplica(d.num)">
                              <i class="bi bi-files"></i> Replicar
                            </button>
                            <!-- Botón Añadir -->
                            <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 bg-white"
                                    (click)="addHorarioOnly(gIdx, d.num)">
                              <i class="bi bi-plus-circle"></i> Añadir horario
                            </button>
                          </div>
                        </div>
                        
                        <div class="dia-horario-body">
                          @if (diaReplicando() === d.num) {
                            <div class="replicate-panel">
                              <label class="fw-semibold small d-block mb-2">Replicar horarios de {{ d.label }} a:</label>
                              <div class="replicate-panel__days">
                                @for (rd of dias; track rd.num) {
                                  @if (rd.num !== d.num) {
                                    <label class="replicate-panel__day"
                                           [class.has-existing]="isDiaSelected(gIdx, rd.num)"
                                           [class.checked]="isDiaParaReplicar(rd.num)">
                                      <input type="checkbox"
                                             [checked]="isDiaParaReplicar(rd.num)"
                                             (change)="toggleDiaReplica(rd.num, $any($event.target).checked)">
                                      <span>{{ rd.label }}</span>
                                      @if (isDiaSelected(gIdx, rd.num)) {
                                        <i class="bi bi-exclamation-triangle-fill text-warning ms-1" title="Este día ya tiene horarios, serán reemplazados"></i>
                                      }
                                    </label>
                                  }
                                }
                              </div>
                              @if (tieneDestinosConConflicto(gIdx)) {
                                <div class="replicate-panel__warn">
                                  <i class="bi bi-exclamation-triangle-fill"></i>
                                  Los días marcados con ⚠ ya tienen horarios configurados y serán <strong>reemplazados</strong>.
                                </div>
                              }
                              <div class="replicate-panel__actions">
                                <button class="btn btn-sm btn-outline-secondary" (click)="cerrarReplicar()">Cancelar</button>
                                <button class="btn btn-sm btn-primary"
                                        [disabled]="diasParaReplicar().length === 0"
                                        (click)="aplicarReplica(gIdx, d.num)">
                                  <i class="bi bi-check-lg me-1"></i>Aplicar
                                </button>
                              </div>
                            </div>
                          }

                          <div class="d-flex flex-column gap-2">
                            @for (h of getHorariosByDia(gIdx, d.num); track h.originalIndex) {
                              <div class="row g-2 align-items-center p-2 rounded bg-light border border-light-subtle">
                                <div class="col-12 col-md-3">
                                  <label class="form-label small text-muted mb-1 d-block">Inicio</label>
                                  <input type="time" class="form-control form-control-sm"
                                         [value]="h.item.hora_inicio"
                                         (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_inicio', $any($event.target).value)">
                                </div>
                                <div class="col-12 col-md-3">
                                  <label class="form-label small text-muted mb-1 d-block">Fin</label>
                                  <input type="time" class="form-control form-control-sm"
                                         [value]="h.item.hora_fin"
                                         (change)="updateHorarioField(gIdx, h.originalIndex, 'hora_fin', $any($event.target).value)">
                                </div>
                                <div class="col-12 col-md-5">
                                  <label class="form-label small text-muted mb-1 d-block">Área</label>
                                  @if (getAreasByClub().length === 0) {
                                    <input type="text" class="form-control form-control-sm" disabled
                                           placeholder="No hay áreas mapeadas para este club">
                                  } @else {
                                    <select class="form-select form-select-sm"
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
                  }
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


# 2. Restore TS Methods
ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# I need to replace the bulk methods block with the old replication and toggleDia logic.
# Wait, let's just get the methods from /tmp/old_ts.ts

import subprocess
old_ts = subprocess.check_output(['cat', '/tmp/old_ts.ts']).decode('utf-8')

# The block of methods we want to remove from current TS:
bulk_pattern = r'// ── Bulk Add State \(Step 4\) ─────────────────────────────────────────────────.*?addBulkHorarios\(grupoIdx: number\): void \{.*?\s+this\.bulkSelectedDays = \[\];\s+\}'
ts = re.sub(bulk_pattern, '', ts, flags=re.DOTALL)

# And now add the old toggleDia, etc. Since we lost them or replaced them.
# I'll just append them at the very end of the class, before the final `}`
# First, extract them from old_ts:
def extract_method(text, method_name):
    # This is a bit fragile, let's just use known blocks:
    return ""

# Actually, it's easier to just copy the whole section from old_ts.
# Look for "// ── Paso 3: Horarios ─────────────────────────────────────────────────────────"
# to the end of the class (before buildCreatePayload).
match = re.search(r'(// ── Paso 3: Horarios ─────────────────────────────────────────────────────────.*?)\s+private buildCreatePayload', old_ts, re.DOTALL)
if match:
    old_methods = match.group(1)
    
    # We need to replace the same section in the current ts
    current_match = re.search(r'(// ── Paso 3: Horarios ─────────────────────────────────────────────────────────.*?)\s+private buildCreatePayload', ts, re.DOTALL)
    if current_match:
        ts = ts.replace(current_match.group(1), old_methods)

with open(ts_path, 'w') as f:
    f.write(ts)

print("Restored original Step 4 and Replicar logic!")
