sed -i '' -e '100,154c\
          <!-- Top Row: Icon + Badges -->\
          <div class="d-flex justify-content-between align-items-start mb-2">\
            <div class="activity-icon-wrap shadow-sm" [style.background]="act.color || '"'#6366f1'"'">\
              <span class="activity-emoji">{{ act.icono || '"'🏆'"' }}</span>\
            </div>\
            <div class="d-flex align-items-center gap-1">\
              @if (act.is_active) {\
                <span class="badge bg-success-subtle text-success rounded-pill px-2 border border-success-subtle">Activa</span>\
              } @else {\
                <span class="badge bg-secondary-subtle text-secondary rounded-pill px-2 border border-secondary-subtle">Inactiva</span>\
              }\
            </div>\
          </div>\
\
          <!-- Info -->\
          <div class="activity-info mb-1">\
            <h5 class="activity-name fw-bold mb-1" style="font-size: 1.05rem; line-height: 1.2;">{{ act.nombre }}</h5>\
            <p class="activity-desc text-muted mb-0" style="font-size: 0.82rem; line-height: 1.4;">{{ act.descripcion || '"'Sin descripción'"' }}</p>\
          </div>\
\
          <!-- Extra details (Funcionalidad sumada) -->\
          <div class="activity-details d-flex flex-column gap-1 mb-2 mt-2">\
            <div class="d-flex align-items-center text-secondary small" style="font-size: 0.8rem;">\
              <i class="bi bi-geo-alt me-2 text-muted"></i> {{ act.club?.nombre || '"'Todas las unidades'"' }}\
            </div>\
            <div class="d-flex align-items-center text-secondary small" style="font-size: 0.8rem;">\
              <i class="bi bi-people me-2 text-muted"></i> {{ (act.grupos_categorias?.length ?? 0) }} grupos configurados\
            </div>\
            @if (act.elegible_para_socios) {\
              <div class="d-flex align-items-center text-secondary small" style="font-size: 0.8rem;">\
                <i class="bi bi-person-check me-2 text-primary"></i> Visible para Socios\
              </div>\
            } @else {\
              <div class="d-flex align-items-center text-secondary small" style="font-size: 0.8rem;">\
                <i class="bi bi-person-workspace me-2 text-warning"></i> Interno / Staff\
              </div>\
            }\
          </div>\
\
          <!-- Tags at bottom before actions -->\
          <div class="d-flex flex-wrap gap-1 mb-auto">\
            <span class="badge bg-light text-dark border fw-medium">{{ act.tipo || '"'General'"' }}</span>\
            @if (act.tiene_costo) {\
              <span class="badge bg-warning-subtle text-warning border border-warning-subtle fw-medium">\
                <i class="bi bi-currency-dollar"></i> Con Cobro\
              </span>\
            }\
          </div>\
\
          <!-- Acciones Rediseñadas -->\
          <div class="card-actions-modern mt-3 pt-3 border-top d-flex justify-content-between align-items-center">\
            <div class="form-check form-switch m-0" title="Activar/Desactivar">\
              <input class="form-check-input" type="checkbox" role="switch" style="cursor: pointer;"\
                     [checked]="act.is_active" (change)="toggleActive(act)">\
            </div>\
            <div class="d-flex gap-2">\
              <button class="btn btn-sm btn-light text-secondary action-icon-btn px-2 shadow-sm" title="Duplicar" (click)="duplicateActividad(act, $event)">\
                <i class="bi bi-copy"></i>\
              </button>\
              <button class="btn btn-sm btn-light text-danger action-icon-btn px-2 shadow-sm" title="Eliminar" (click)="confirmDelete(act)">\
                <i class="bi bi-trash"></i>\
              </button>\
              <button class="btn btn-sm btn-primary px-3 shadow-sm" style="font-size: 0.8rem; font-weight: 500;" title="Editar" (click)="editActividad(act)">\
                Editar\
              </button>\
            </div>\
          </div>\
        </div>\
      }' src/app/components/deportivo/actividades/deportivo-actividades.html
