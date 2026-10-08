import os

html = """
<div class="wizard-overlay" (click)="close.emit()">
  <div class="wizard-container" (click)="$event.stopPropagation()">
    <!-- Header -->
    <div class="wizard-header">
      <div class="d-flex align-items-center gap-2">
        <div class="icon-wrap bg-primary-subtle text-primary">
          <i class="bi bi-activity"></i>
        </div>
        <div>
          <h5 class="mb-0 fw-bold">{{ isEditMode() ? 'Editar Actividad' : 'Nueva Actividad' }}</h5>
          <small class="text-muted">Configura los detalles, horarios y reglas</small>
        </div>
      </div>
      <button class="btn-close" (click)="close.emit()"></button>
    </div>

    <!-- Stepper -->
    <div class="wizard-stepper">
      <div class="step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1" (click)="currentStep() > 1 ? setStep(1) : null">
        <div class="step-num">1</div>
        <div class="step-label">General</div>
      </div>
      <div class="step-line"></div>
      <div class="step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2" (click)="currentStep() > 2 ? setStep(2) : null">
        <div class="step-num">2</div>
        <div class="step-label">Operación</div>
      </div>
      <div class="step-line"></div>
      <div class="step" [class.active]="currentStep() === 3" [class.completed]="currentStep() > 3" (click)="currentStep() > 3 ? setStep(3) : null">
        <div class="step-num">3</div>
        <div class="step-label">Grupos</div>
      </div>
      <div class="step-line"></div>
      <div class="step" [class.active]="currentStep() === 4" [class.completed]="currentStep() > 4" (click)="currentStep() > 4 ? setStep(4) : null">
        <div class="step-num">4</div>
        <div class="step-label">Horarios</div>
      </div>
    </div>

    <!-- Content -->
    <div class="wizard-body p-4" style="overflow-y: auto;">
      
      <!-- ════ PASO 1: General ════ -->
      @if (currentStep() === 1) {
        <div class="step-content">
          <h6 class="step-section-title">Detalles básicos</h6>
          
          <div class="mb-3">
            <label class="form-label fw-semibold">Nombre de la actividad <span class="text-danger">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="nombre" placeholder="Ej: Natación, Fútbol, Yoga">
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Tipo <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="tipo">
                <option value="deportiva">Deportiva</option>
                <option value="cultural">Cultural</option>
                <option value="evento">Evento</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Sede (Club) <span class="text-danger">*</span></label>
              <select class="form-select" [(ngModel)]="club_id">
                @for (c of formData()?.clubes; track c.id) {
                  <option [ngValue]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label fw-semibold">Descripción pública</label>
            <textarea class="form-control" rows="3" [(ngModel)]="descripcion" placeholder="Se mostrará en la app o portal de socios"></textarea>
          </div>

          <h6 class="step-section-title mt-4">Personalización Visual</h6>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Color identificador</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" class="form-control form-control-color" [(ngModel)]="color">
                <small class="text-muted">Color para etiquetas y calendario</small>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Icono (Emoji)</label>
              <input type="text" class="form-control" [(ngModel)]="icono" placeholder="⚽, 🏊‍♂️, 🎨" maxlength="5">
            </div>
          </div>
        </div>
      }

      <!-- ════ PASO 2: Operación y Costos ════ -->
      @if (currentStep() === 2) {
        <div class="step-content">
          <h6 class="step-section-title">Reglas de Operación</h6>

          <label class="mensajeria-option mb-3" [class.selected]="elegible_para_socios" style="padding: 0.6rem 1rem;">
            <div class="row w-100 m-0 align-items-center">
              <div class="col-12 col-md-5">
                <span class="fw-semibold">¿Elegible para socios?</span>
              </div>
              <div class="col-12 col-md-7 d-flex justify-content-between align-items-center">
                <small class="text-muted">Si está activo, los socios podrán verla e inscribirse en el portal.</small>
                <div class="form-check form-switch ms-2 mb-0">
                  <input class="form-check-input" type="checkbox" role="switch"
                         [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer">
                </div>
              </div>
            </div>
          </label>

          <div class="mb-4">
            <label class="form-label fw-semibold">Modo de Mensajería</label>
            <select class="form-select" [(ngModel)]="modo_mensajeria">
              <option value="none">Sin mensajería</option>
              <option value="broadcast">Solo el profesor puede enviar mensajes (Avisos)</option>
              <option value="group">Todos pueden enviar mensajes (Chat grupal)</option>
            </select>
          </div>

          <hr class="my-4">

          <h6 class="step-section-title">Cobro a Socios</h6>
          <label class="mensajeria-option mb-3" [class.selected]="tiene_costo" style="padding: 0.6rem 1rem;">
            <div class="row w-100 m-0 align-items-center">
              <div class="col-12 col-md-5">
                <span class="fw-semibold">¿Tiene costo para socios?</span>
              </div>
              <div class="col-12 col-md-7 d-flex justify-content-between align-items-center">
                <small class="text-muted">Actívalo si requiere pago por parte del socio.</small>
                <div class="form-check form-switch ms-2 mb-0">
                  <input class="form-check-input" type="checkbox" role="switch"
                         [(ngModel)]="tiene_costo" style="width:2.5rem;height:1.25rem;cursor:pointer">
                </div>
              </div>
            </div>
          </label>

          @if (tiene_costo) {
            <div class="d-flex justify-content-end mb-3">
              <div style="width: 100%; max-width: 300px;">
                <label class="form-label small fw-semibold">Monto a cobrar <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text bg-white">$</span>
                  <input type="number" class="form-control" placeholder="0.00"
                         min="0" step="0.01" [(ngModel)]="monto">
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ════ PASO 3: Grupos ════ -->
      @if (currentStep() === 3) {
        <div class="step-content">
          <h6 class="step-section-title">Grupos y categorías</h6>
          <p class="text-muted small mb-3">Define los grupos principales de la actividad (Ej: Principiantes, Avanzados).</p>

          <div class="input-add-row mb-3">
            <input type="text" class="form-control" placeholder="Nombre del grupo (Ej: Sub-12)"
                   [(ngModel)]="nuevoGrupoNombre"
                   (keydown.enter)="addGrupo()">
            <button class="btn btn-primary" (click)="addGrupo()">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>

          @if (grupos().length === 0) {
            <div class="empty-hint text-center p-4 bg-light rounded border">
              <i class="bi bi-people text-muted d-block mb-2" style="font-size:2rem"></i>
              <span class="text-muted">Agrega al menos un grupo para continuar</span>
            </div>
          }

          @for (g of grupos(); track trackByIdx($index, g); let gi = $index) {
            <div class="card mb-3 shadow-sm border-0">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center cursor-pointer"
                   (click)="activeGrupoIndex.set(gi)">
                <div class="fw-bold d-flex align-items-center gap-2">
                  <i class="bi bi-people-fill text-primary"></i> {{ g.nombre }}
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-danger border-0" (click)="removeGrupo(gi); $event.stopPropagation()">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              @if (activeGrupoIndex() === gi) {
                <div class="card-body bg-light">
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label class="form-label small">Edad mínima</label>
                      <input type="number" class="form-control form-control-sm" min="0" max="99" [(ngModel)]="grupos()[gi].edad_min">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small">Edad máxima</label>
                      <input type="number" class="form-control form-control-sm" min="0" max="99" [(ngModel)]="grupos()[gi].edad_max">
                    </div>
                  </div>

                  <label class="mensajeria-option mb-0" [class.selected]="grupos()[gi].tiene_cupo">
                    <div class="row w-100 m-0 align-items-center">
                      <div class="col-12 col-md-5">
                        <span class="fw-semibold small">¿Limitar cupo?</span>
                      </div>
                      <div class="col-12 col-md-7 d-flex justify-content-between align-items-center">
                        <div class="form-check form-switch mb-0">
                          <input class="form-check-input" type="checkbox" role="switch"
                                 [(ngModel)]="grupos()[gi].tiene_cupo" style="cursor:pointer">
                        </div>
                      </div>
                    </div>
                  </label>

                  @if (grupos()[gi].tiene_cupo) {
                    <div class="mt-2 d-flex justify-content-end">
                      <div style="width: 150px;">
                        <label class="form-label small">Cupo máximo <span class="text-danger">*</span></label>
                        <input type="number" class="form-control form-control-sm" min="1" [(ngModel)]="grupos()[gi].cupo_maximo">
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ════ PASO 4: Horarios ════ -->
      @if (currentStep() === 4) {
        <div class="step-content">
          <h6 class="step-section-title">Horarios por Grupo</h6>
          
          @if (grupos().length === 0) {
            <div class="alert alert-warning">Debes crear al menos un grupo en el paso anterior.</div>
          } @else {
            <ul class="nav nav-pills nav-fill mb-3 bg-light rounded p-1">
              @for (g of grupos(); track $index; let gi = $index) {
                <li class="nav-item">
                  <button class="nav-link fw-semibold" [class.active]="activeGrupoIndex() === gi" (click)="activeGrupoIndex.set(gi)">
                    {{ g.nombre }}
                  </button>
                </li>
              }
            </ul>

            @for (g of grupos(); track $index; let gi = $index) {
              @if (activeGrupoIndex() === gi) {
                <div class="horarios-grid">
                  @for (d of dias; track d.num) {
                    <div class="horario-dia-row border rounded mb-3 p-3 bg-white shadow-sm">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="fw-bold text-primary">{{ d.label }}</div>
                        <div class="d-flex gap-2">
                          <button class="btn btn-sm btn-outline-primary" (click)="addHorarioOnly(gi, d.num)">
                            <i class="bi bi-plus"></i> Agregar
                          </button>
                          <button class="btn btn-sm btn-outline-secondary" title="Replicar día" (click)="iniciarReplica(gi, d.num)">
                            <i class="bi bi-files"></i>
                          </button>
                        </div>
                      </div>

                      @if (getHorariosByDia(gi, d.num).length === 0) {
                        <div class="text-muted small py-2">No hay horarios configurados</div>
                      }
                      
                      <div class="d-flex flex-column gap-2">
                        @for (h of getHorariosByDia(gi, d.num); track h.originalIndex) {
                          <div class="d-flex flex-wrap gap-2 align-items-center bg-light p-2 rounded">
                            <input type="time" class="form-control form-control-sm" style="width: 120px;"
                                   [ngModel]="h.item.hora_inicio"
                                   (ngModelChange)="updateHorarioField(gi, h.originalIndex, 'hora_inicio', $event)">
                            <span class="text-muted small">a</span>
                            <input type="time" class="form-control form-control-sm" style="width: 120px;"
                                   [ngModel]="h.item.hora_fin"
                                   (ngModelChange)="updateHorarioField(gi, h.originalIndex, 'hora_fin', $event)">
                            
                            <select class="form-select form-select-sm" style="min-width: 130px; flex-grow: 1;"
                                    [ngModel]="h.item.area_id"
                                    (ngModelChange)="updateHorarioField(gi, h.originalIndex, 'area_id', $event || null)">
                              <option [ngValue]="null">Sin área</option>
                              @for (area of getAreasByClub(); track area.area_id) {
                                <option [ngValue]="area.area_id">{{ area.area_name }}</option>
                              }
                            </select>

                            <select class="form-select form-select-sm" style="min-width: 150px; flex-grow: 1;"
                                    [ngModel]="h.item.profesor_id"
                                    (ngModelChange)="updateHorarioField(gi, h.originalIndex, 'profesor_id', $event || null)">
                              <option [ngValue]="null">Sin profesor</option>
                              @for (inst of formData()?.instructores; track inst.id) {
                                <option [ngValue]="inst.id">{{ inst.full_name }}</option>
                              }
                            </select>
                            
                            <div class="input-group input-group-sm" style="width: 110px;">
                              <span class="input-group-text bg-white">$</span>
                              <input type="number" class="form-control" placeholder="Costo"
                                     [ngModel]="h.item.costo_interno"
                                     (ngModelChange)="updateHorarioField(gi, h.originalIndex, 'costo_interno', $event || null)">
                            </div>

                            <button class="btn btn-sm text-danger border-0 p-1" title="Quitar" (click)="removeHorario(gi, h.originalIndex)">
                              <i class="bi bi-x-lg"></i>
                            </button>
                          </div>
                        }
                      </div>

                      @if (replicandoDia()?.grupoIdx === gi && replicandoDia()?.dia === d.num) {
                        <div class="replicate-panel mt-3 p-3 bg-white rounded border border-primary">
                          <div class="fw-bold text-primary mb-2">Copiar a:</div>
                          <div class="d-flex flex-wrap gap-2 mb-3">
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
                          <div class="d-flex justify-content-end gap-2">
                            <button class="btn btn-sm btn-light border" (click)="cerrarReplicar()">Cancelar</button>
                            <button class="btn btn-sm btn-primary"
                                    [disabled]="diasParaReplicar().length === 0"
                                    (click)="aplicarReplica(gi, d.num)">Aplicar</button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          }
        </div>
      }
    </div>

    <!-- Footer -->
    <div class="wizard-footer d-flex justify-content-between">
      @if (currentStep() > 1) {
        <button class="btn btn-outline-secondary px-4" (click)="prevStep()">Anterior</button>
      } @else {
        <div></div>
      }
      
      @if (currentStep() < 4) {
        <button class="btn btn-primary px-4" (click)="nextStep()" [disabled]="!canProceed()">
          Siguiente <i class="bi bi-chevron-right ms-1"></i>
        </button>
      } @else {
        <button class="btn btn-success px-4 fw-bold" (click)="save()" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner-border spinner-border-sm me-2"></span> Guardando...
          } @else {
            <i class="bi bi-check2-circle ms-1"></i> Guardar Actividad
          }
        </button>
      }
    </div>
  </div>
</div>
"""
with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
print("Rewrote html")
