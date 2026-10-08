import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# We need to replace the content of Step 4
start_marker = "<!-- ════ PASO 4: Horarios ════ -->"
end_marker = "<!-- ════ PASO 5: Evaluación ════ -->"
start_idx = html.find(start_marker)
end_idx = html.find(end_marker)

if start_idx != -1 and end_idx != -1:
    old_step4 = html[start_idx:end_idx]
    
    new_step4 = """<!-- ════ PASO 4: Horarios ════ -->
      @if (currentStep() === 4) {
        <div class="step-content">
          <h6 class="step-section-title">Horarios de entrenamiento</h6>
          <p class="text-muted small mb-3">Configura los días y horarios de cada grupo. Usa el formulario rápido para agregar varios a la vez.</p>

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
                
                <!-- Bulk Add Form -->
                <div class="bg-light p-3 rounded border mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <label class="fw-semibold small m-0 text-primary"><i class="bi bi-lightning-charge-fill me-1"></i>Añadir horario rápido</label>
                  </div>
                  
                  <!-- Días -->
                  <div class="d-flex gap-2 flex-wrap mb-3">
                    @for (d of dias; track d.id) {
                      <button type="button" class="btn btn-sm rounded-pill fw-medium"
                              [class.btn-primary]="bulkSelectedDays.includes(d.id)"
                              [class.btn-outline-secondary]="!bulkSelectedDays.includes(d.id)"
                              [class.border-0]="bulkSelectedDays.includes(d.id)"
                              (click)="toggleBulkDay(d.id)">
                        {{ d.label }}
                      </button>
                    }
                  </div>
                  
                  <div class="row g-2 align-items-end">
                    <div class="col-6 col-md-2">
                      <label class="form-label small mb-1 text-muted">Inicio</label>
                      <input type="time" class="form-control form-control-sm rounded-pill" [(ngModel)]="bulkHoraInicio">
                    </div>
                    <div class="col-6 col-md-2">
                      <label class="form-label small mb-1 text-muted">Fin</label>
                      <input type="time" class="form-control form-control-sm rounded-pill" [(ngModel)]="bulkHoraFin">
                    </div>
                    <div class="col-12 col-md-3">
                      <label class="form-label small mb-1 text-muted">Área (Opcional)</label>
                      <select class="form-select form-select-sm" [(ngModel)]="bulkAreaId">
                        <option [ngValue]="null">Sin área asignada</option>
                        @for (area of getAreasByClub(); track area.area_id) {
                          <option [ngValue]="area.area_id">{{ area.area_name }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-12 col-md-3">
                      <label class="form-label small mb-1 text-muted">Suplente (Opcional)</label>
                      <select class="form-select form-select-sm" [(ngModel)]="bulkProfesorId">
                        <option [ngValue]="null">Usar titular del grupo</option>
                        @for (inst of formData()?.instructores; track inst.id) {
                          <option [ngValue]="inst.id">{{ inst.full_name }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-12 col-md-2">
                      <label class="form-label small mb-1 text-muted">Costo dif.</label>
                      <div class="input-group input-group-sm">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control form-control-sm" min="0" step="0.01"
                               placeholder="Costo base" [(ngModel)]="bulkCosto">
                      </div>
                    </div>
                    <div class="col-12 mt-3">
                      <button class="btn btn-primary btn-sm w-100 rounded-pill"
                              [disabled]="bulkSelectedDays.length === 0"
                              (click)="addBulkHorarios(gIdx)">
                        <i class="bi bi-plus-circle me-1"></i> Añadir a los {{ bulkSelectedDays.length }} días seleccionados
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Tabla de Horarios -->
                <div class="table-responsive border rounded bg-white">
                  <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                    <thead class="table-light">
                      <tr>
                        <th class="ps-3 text-nowrap">Día</th>
                        <th class="text-nowrap" style="min-width: 180px;">Horario</th>
                        <th class="text-nowrap" style="min-width: 150px;">Área</th>
                        <th class="text-nowrap" style="min-width: 150px;">Profesor (Día)</th>
                        <th class="text-nowrap" style="min-width: 100px;">Costo (Día)</th>
                        <th class="text-end pe-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (gActual.horarios.length === 0) {
                        <tr>
                          <td colspan="6" class="text-center text-muted py-4">
                            <i class="bi bi-calendar-x d-block mb-1 fs-5"></i>
                            Aún no hay horarios para este grupo
                          </td>
                        </tr>
                      }
                      @for (h of gActual.horarios; track $index; let hi = $index) {
                        <tr>
                          <td class="ps-3 fw-medium text-primary">
                            {{ getDiaNombre(h.dia_semana) }}
                          </td>
                          <td>
                            <div class="d-flex align-items-center gap-1">
                              <input type="time" class="form-control form-control-sm text-center px-1" 
                                     style="min-width: 75px;"
                                     [value]="h.hora_inicio"
                                     (change)="updateHorarioField(gIdx, hi, 'hora_inicio', $any($event.target).value)">
                              <span class="text-muted">-</span>
                              <input type="time" class="form-control form-control-sm text-center px-1"
                                     style="min-width: 75px;"
                                     [value]="h.hora_fin"
                                     (change)="updateHorarioField(gIdx, hi, 'hora_fin', $any($event.target).value)">
                            </div>
                          </td>
                          <td>
                            <select class="form-select form-select-sm"
                                    [ngModel]="h.area_id"
                                    (ngModelChange)="updateHorarioField(gIdx, hi, 'area_id', $event || null)">
                              <option [ngValue]="null">- Sin área -</option>
                              @for (area of getAreasByClub(); track area.area_id) {
                                <option [ngValue]="area.area_id">{{ area.area_name }}</option>
                              }
                            </select>
                          </td>
                          <td>
                            <select class="form-select form-select-sm"
                                    [ngModel]="h.profesor_id"
                                    (ngModelChange)="updateHorarioField(gIdx, hi, 'profesor_id', $event || null)">
                              <option [ngValue]="null">- Titular -</option>
                              @for (inst of formData()?.instructores; track inst.id) {
                                <option [ngValue]="inst.id">{{ inst.full_name }}</option>
                              }
                            </select>
                          </td>
                          <td>
                            <div class="input-group input-group-sm">
                              <span class="input-group-text py-0 px-1 border-end-0 bg-transparent text-muted">$</span>
                              <input type="number" class="form-control form-control-sm border-start-0 ps-0" min="0" step="0.01"
                                     placeholder="Base"
                                     [ngModel]="h.costo_interno"
                                     (ngModelChange)="updateHorarioField(gIdx, hi, 'costo_interno', $event || null)">
                            </div>
                          </td>
                          <td class="text-end pe-3">
                            <button class="btn btn-sm text-danger p-1" title="Eliminar" (click)="removeHorario(gIdx, hi)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
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
    print("Replaced Step 4 HTML!")
else:
    print("Could not find markers")
