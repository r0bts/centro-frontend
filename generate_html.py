html = """<div class="deportivo-actividades">
  <!-- ── Header ── -->
  <div class="page-header d-flex align-items-center justify-content-between mb-4">
    <div>
      <h4 class="mb-0 fw-bold">Actividades</h4>
      <small class="text-muted">Gestión de actividades, grupos y equipos del club</small>
    </div>
    <div class="d-flex gap-2">
      <div class="dropdown me-2">
        <button class="btn btn-outline-secondary dropdown-toggle bg-white shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-funnel"></i> 
          @if (filterElegibilidad() === 'todos') { Todos }
          @if (filterElegibilidad() === 'socios') { Solo Socios }
          @if (filterElegibilidad() === 'staff') { Solo Staff }
        </button>
        <ul class="dropdown-menu shadow-sm border-0">
          <li><button class="dropdown-item" [class.active]="filterElegibilidad() === 'todos'" (click)="filterElegibilidad.set('todos')">Todos</button></li>
          <li><button class="dropdown-item" [class.active]="filterElegibilidad() === 'socios'" (click)="filterElegibilidad.set('socios')">Solo Socios</button></li>
          <li><button class="dropdown-item" [class.active]="filterElegibilidad() === 'staff'" (click)="filterElegibilidad.set('staff')">Solo Interno / Staff</button></li>
        </ul>
      </div>

      <div class="btn-group shadow-sm bg-white rounded">
        <button class="btn" [class.btn-primary]="viewMode() === 'grid'" [class.btn-outline-secondary]="viewMode() !== 'grid'" (click)="viewMode.set('grid')" title="Vista en Cuadrícula">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button class="btn" [class.btn-primary]="viewMode() === 'list'" [class.btn-outline-secondary]="viewMode() !== 'list'" (click)="viewMode.set('list')" title="Vista en Lista">
          <i class="bi bi-list-ul"></i>
        </button>
      </div>

      <button class="btn btn-primary d-flex align-items-center gap-2 shadow-sm" (click)="openWizard()">
        <i class="bi bi-plus-lg"></i>
        <span>Nueva actividad</span>
      </button>
    </div>
  </div>

  <!-- ── Error ── -->
  @if (error()) {
    <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ error() }}</span>
      <button type="button" class="btn-close ms-auto" (click)="clearError()"></button>
    </div>
  }

  <!-- ── Toast ── -->
  @if (toast()) {
    <div class="toast-wrapper">
      <div class="toast show align-items-center text-bg-success border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill"></i>
            {{ toast() }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" (click)="clearToast()"></button>
        </div>
      </div>
    </div>
  }

  <!-- ── Loading skeleton ── -->
  @if (loading()) {
    <div [class]="viewMode() === 'grid' ? 'activities-grid' : 'activities-list'">
      @for (sk of [1,2,3,4,5,6]; track sk) {
        <div class="activity-card skeleton">
          <div class="sk-icon"></div>
          <div class="sk-line long"></div>
          <div class="sk-line short"></div>
        </div>
      }
    </div>
  }

  <!-- ── Grid de actividades ── -->
  @if (!loading()) {
    <div [class]="viewMode() === 'grid' ? 'activities-grid' : 'activities-list'">
      
      @if (viewMode() === 'grid') {
        <!-- Tarjeta "Nueva actividad" -->
        <div class="activity-card add-card" (click)="openWizard()" role="button" tabindex="0" (keydown.enter)="openWizard()">
          <div class="add-icon">
            <i class="bi bi-plus-lg"></i>
          </div>
          <span class="add-label">Nueva actividad</span>
        </div>

        <!-- Tarjetas de actividades -->
        @for (act of filteredActividades(); track act.id) {
          <div class="activity-card" [class.inactive]="!act.is_active">
            <!-- Top Row: Icon + Badges -->
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="activity-icon-wrap shadow-sm" [style.background]="act.color || '#6366f1'">
                <span class="activity-emoji">{{ act.icono || '🏆' }}</span>
              </div>
              <div class="d-flex flex-column align-items-end gap-1">
                @if (act.is_active) {
                  <span class="badge bg-success-subtle text-success rounded-pill px-2 border border-success-subtle">Activa</span>
                } @else {
                  <span class="badge bg-secondary-subtle text-secondary rounded-pill px-2 border border-secondary-subtle">Inactiva</span>
                }
                @if (act.elegible_para_socios) {
                  <span class="badge bg-primary-subtle text-primary rounded-pill px-2 border border-primary-subtle" title="Visible para Socios"><i class="bi bi-person-check"></i> Socios</span>
                } @else {
                  <span class="badge bg-warning-subtle text-warning rounded-pill px-2 border border-warning-subtle" title="Uso Interno / Staff"><i class="bi bi-person-workspace"></i> Staff</span>
                }
              </div>
            </div>

            <!-- Info -->
            <div class="activity-info mb-1">
              <h5 class="activity-name fw-bold mb-1" style="font-size: 1.05rem; line-height: 1.2;">{{ act.nombre }}</h5>
              <p class="activity-desc text-muted mb-0" style="font-size: 0.82rem; line-height: 1.4;">{{ act.descripcion || 'Sin descripción' }}</p>
            </div>

            <!-- Extra details -->
            <div class="activity-details d-flex flex-column gap-1 mb-2 mt-2">
              <div class="d-flex align-items-center text-secondary small" style="font-size: 0.8rem;">
                <i class="bi bi-geo-alt me-2 text-muted"></i> {{ act.club?.nombre || 'Todas las unidades' }}
              </div>
              <div class="d-flex align-items-center text-secondary small" style="font-size: 0.8rem;">
                <i class="bi bi-people me-2 text-muted"></i> {{ (act.grupos_categorias?.length ?? 0) }} grupos configurados
              </div>
            </div>

            <!-- Tags at bottom before actions -->
            <div class="d-flex flex-wrap gap-1 mb-auto">
              <span class="badge bg-light text-dark border fw-medium">{{ act.tipo || 'General' }}</span>
              @if (act.tiene_costo) {
                <span class="badge bg-warning-subtle text-warning border border-warning-subtle fw-medium">
                  <i class="bi bi-currency-dollar"></i> Socio: ${{ act.monto | number:'1.2-2' }}
                </span>
              }
              @if (act.costo_interno) {
                <span class="badge bg-info-subtle text-info border border-info-subtle fw-medium">
                  <i class="bi bi-briefcase"></i> Prof: ${{ act.costo_interno | number:'1.2-2' }}
                </span>
              }
            </div>

            <!-- Acciones Rediseñadas -->
            <div class="card-actions-modern mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center gap-2" title="Activar/Desactivar">
                <input class="form-check-input m-0 float-none" type="checkbox" role="switch" style="cursor: pointer;"
                       [checked]="act.is_active" (change)="toggleActive(act)">
                <label class="form-check-label small fw-medium text-nowrap lh-1 mb-0" style="font-size: 0.75rem; cursor: pointer;" (click)="toggleActive(act)">
                  {{ act.is_active ? 'Activa' : 'Inactiva' }}
                </label>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-light text-secondary action-icon-btn px-2 shadow-sm" title="Duplicar" (click)="duplicateActividad(act, $event)">
                  <i class="bi bi-copy"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger action-icon-btn px-2 shadow-sm" title="Eliminar" (click)="confirmDelete(act)">
                  <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-primary px-3 shadow-sm" style="font-size: 0.8rem; font-weight: 500;" title="Editar" (click)="editActividad(act)">
                  Editar
                </button>
              </div>
            </div>
          </div>
        }

      } @else {
        <!-- LIST MODE -->
        <div class="list-group shadow-sm">
          <div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 text-primary bg-light"
               (click)="openWizard()" role="button" tabindex="0" (keydown.enter)="openWizard()">
            <div class="add-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">
              <i class="bi bi-plus-lg"></i>
            </div>
            <span class="fw-bold">Nueva actividad</span>
          </div>

          @for (act of filteredActividades(); track act.id) {
            <div class="list-group-item d-flex align-items-center gap-3 p-3"
                 [class.bg-light]="!act.is_active" [style.opacity]="act.is_active ? 1 : 0.7">
              
              <!-- Icon -->
              <div class="activity-icon-wrap shadow-sm rounded-3 d-flex align-items-center justify-content-center"
                   [style.background]="act.color || '#6366f1'" style="width: 48px; height: 48px; flex-shrink: 0;">
                <span class="activity-emoji fs-4">{{ act.icono || '🏆' }}</span>
              </div>

              <!-- Info -->
              <div class="flex-grow-1">
                <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <h6 class="mb-0 fw-bold">{{ act.nombre }}</h6>
                  @if (act.is_active) {
                    <span class="badge bg-success-subtle text-success rounded-pill" style="font-size: 0.65rem;">Activa</span>
                  } @else {
                    <span class="badge bg-secondary-subtle text-secondary rounded-pill" style="font-size: 0.65rem;">Inactiva</span>
                  }
                  @if (act.elegible_para_socios) {
                    <span class="badge bg-primary-subtle text-primary rounded-pill" style="font-size: 0.65rem;" title="Visible para Socios"><i class="bi bi-person-check"></i> Socios</span>
                  } @else {
                    <span class="badge bg-warning-subtle text-warning rounded-pill" style="font-size: 0.65rem;" title="Uso Interno / Staff"><i class="bi bi-person-workspace"></i> Staff</span>
                  }
                  @if (act.tiene_costo) {
                    <span class="badge bg-warning-subtle text-warning rounded-pill" style="font-size: 0.65rem;" title="Cobro a Socios"><i class="bi bi-currency-dollar"></i> Socio: ${{ act.monto | number:'1.2-2' }}</span>
                  }
                  @if (act.costo_interno) {
                    <span class="badge bg-info-subtle text-info rounded-pill" style="font-size: 0.65rem;" title="Costo del Profesor"><i class="bi bi-briefcase"></i> Prof: ${{ act.costo_interno | number:'1.2-2' }}</span>
                  }
                </div>
                <div class="text-muted small text-truncate" style="max-width: 400px;">
                  {{ act.descripcion || 'Sin descripción' }}
                </div>
              </div>

              <!-- Meta (hidden on mobile) -->
              <div class="d-none d-md-flex flex-column gap-1 me-3 text-secondary small">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-geo-alt"></i> {{ act.club?.nombre || 'Todas las unidades' }}
                </div>
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-people"></i> {{ (act.grupos_categorias?.length ?? 0) }} grupos
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex align-items-center gap-2 border-start ps-3">
                <div class="form-check form-switch m-0 p-0 me-2 d-flex align-items-center gap-2" title="Activar/Desactivar">
                  <input class="form-check-input m-0 float-none" type="checkbox" role="switch" style="cursor: pointer;"
                         [checked]="act.is_active" (change)="toggleActive(act)">
                  <label class="form-check-label small fw-medium text-nowrap lh-1 mb-0" style="font-size: 0.75rem; cursor: pointer;" (click)="toggleActive(act)">
                    {{ act.is_active ? 'Activa' : 'Inactiva' }}
                  </label>
                </div>

                <button class="btn btn-sm btn-light text-secondary action-icon-btn px-2 shadow-sm" title="Duplicar" (click)="duplicateActividad(act, $event)">
                  <i class="bi bi-copy"></i>
                </button>
                <button class="btn btn-sm btn-light text-danger action-icon-btn px-2 shadow-sm" title="Eliminar" (click)="confirmDelete(act)">
                  <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-primary px-3 shadow-sm d-none d-sm-inline-block" style="font-size: 0.8rem; font-weight: 500;" (click)="editActividad(act)">
                  Editar
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Estado vacío -->
      @if (actividades().length === 0) {
        <div class="empty-state col-span-full">
          <i class="bi bi-trophy display-4 text-muted d-block mb-3"></i>
          <h5 class="text-muted">No hay actividades registradas</h5>
          <p class="text-muted small">Crea la primera actividad usando el botón "Nueva actividad".</p>
          <button class="btn btn-primary" (click)="openWizard()">
            <i class="bi bi-plus-lg me-2"></i>Crear actividad
          </button>
        </div>
      }
    </div>
  }

  <!-- ── Confirmación de eliminación ── -->
  @if (deleteTarget()) {
    <div class="modal-backdrop-custom" (click)="cancelDelete()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-icon text-danger">
          <i class="bi bi-trash-fill"></i>
        </div>
        <h5>¿Eliminar actividad?</h5>
        <p class="text-muted small">
          Se eliminará <strong>{{ deleteTarget()!.nombre }}</strong> y todos sus grupos, equipos y criterios.
          Esta acción no se puede deshacer.
        </p>
        <div class="d-flex gap-2 justify-content-center">
          <button class="btn btn-outline-secondary" (click)="cancelDelete()">Cancelar</button>
          <button class="btn btn-danger" [disabled]="deleting()" (click)="executeDelete()">
            @if (deleting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            Eliminar
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ── Wizard ── -->
  @if (wizardOpen()) {
    <app-actividad-wizard
      [editActividad]="wizardEditTarget()"
      (saved)="onWizardSaved($event)"
      (cancelled)="onWizardCancelled()">
    </app-actividad-wizard>
  }
</div>
"""
with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'w') as f:
    f.write(html)
