sed -i '' -e 's/<div class="activities-grid">/<div [class]="viewMode() === '"'grid'"' ? '"'activities-grid'"' : '"'activities-list'"'">/g' src/app/components/deportivo/actividades/deportivo-actividades.html

sed -i '' -e '/<!-- Tarjeta "Nueva actividad" -->/i\
      @if (viewMode() === '"'grid'"') {\
' src/app/components/deportivo/actividades/deportivo-actividades.html

sed -i '' -e '/<!-- Estado vacío -->/i\
      } @else {\
        <!-- LIST MODE -->\
        <div class="list-group shadow-sm">\
          <div class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 text-primary bg-light"\
               (click)="openWizard()" role="button" tabindex="0" (keydown.enter)="openWizard()">\
            <div class="add-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;">\
              <i class="bi bi-plus-lg"></i>\
            </div>\
            <span class="fw-bold">Nueva actividad</span>\
          </div>\
\
          @for (act of filteredActividades(); track act.id) {\
            <div class="list-group-item d-flex align-items-center gap-3 p-3"\
                 [class.bg-light]="!act.is_active" [style.opacity]="act.is_active ? 1 : 0.7">\
              \
              <!-- Icon -->\
              <div class="activity-icon-wrap shadow-sm rounded-3 d-flex align-items-center justify-content-center"\
                   [style.background]="act.color || '"'#6366f1'"'" style="width: 48px; height: 48px; flex-shrink: 0;">\
                <span class="activity-emoji fs-4">{{ act.icono || '"'🏆'"' }}</span>\
              </div>\
\
              <!-- Info -->\
              <div class="flex-grow-1">\
                <div class="d-flex align-items-center gap-2 mb-1">\
                  <h6 class="mb-0 fw-bold">{{ act.nombre }}</h6>\
                  @if (act.is_active) {\
                    <span class="badge bg-success-subtle text-success rounded-pill" style="font-size: 0.65rem;">Activa</span>\
                  } @else {\
                    <span class="badge bg-secondary-subtle text-secondary rounded-pill" style="font-size: 0.65rem;">Inactiva</span>\
                  }\
                </div>\
                <div class="text-muted small text-truncate" style="max-width: 400px;">\
                  {{ act.descripcion || '"'Sin descripción'"' }}\
                </div>\
              </div>\
\
              <!-- Meta (hidden on mobile) -->\
              <div class="d-none d-md-flex flex-column gap-1 me-3 text-secondary small">\
                <div class="d-flex align-items-center gap-2">\
                  <i class="bi bi-geo-alt"></i> {{ act.club?.nombre || '"'Todas las unidades'"' }}\
                </div>\
                <div class="d-flex align-items-center gap-2">\
                  <i class="bi bi-people"></i> {{ (act.grupos_categorias?.length ?? 0) }} grupos\
                </div>\
              </div>\
\
              <!-- Actions -->\
              <div class="d-flex align-items-center gap-2 border-start ps-3">\
                <div class="form-check form-switch m-0 me-2" title="Activar/Desactivar">\
                  <input class="form-check-input" type="checkbox" role="switch" style="cursor: pointer;"\
                         [checked]="act.is_active" (change)="toggleActive(act)">\
                </div>\
                <div class="dropdown">\
                  <button class="btn btn-sm btn-light text-secondary border dropdown-toggle-hide-arrow"\
                          type="button" data-bs-toggle="dropdown" aria-expanded="false">\
                    <i class="bi bi-three-dots-vertical"></i>\
                  </button>\
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">\
                    <li><button class="dropdown-item" (click)="editActividad(act)"><i class="bi bi-pencil me-2 text-primary"></i> Editar</button></li>\
                    <li><button class="dropdown-item" (click)="duplicateActividad(act, $event)"><i class="bi bi-copy me-2 text-secondary"></i> Duplicar</button></li>\
                    <li><hr class="dropdown-divider"></li>\
                    <li><button class="dropdown-item text-danger" (click)="confirmDelete(act)"><i class="bi bi-trash me-2"></i> Eliminar</button></li>\
                  </ul>\
                </div>\
                <button class="btn btn-sm btn-primary px-3 shadow-sm d-none d-sm-inline-block" style="font-size: 0.8rem; font-weight: 500;" (click)="editActividad(act)">\
                  Editar\
                </button>\
              </div>\
            </div>\
          }\
        </div>\
      }\
' src/app/components/deportivo/actividades/deportivo-actividades.html
