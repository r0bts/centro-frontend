sed -i '' -e '/<div class="form-check form-switch m-0"/,/<\/div>/c\
            <div class="form-check form-switch m-0 d-flex align-items-center gap-2" title="Activar/Desactivar">\
              <input class="form-check-input m-0" type="checkbox" role="switch" style="cursor: pointer;"\
                     [checked]="act.is_active" (change)="toggleActive(act)">\
              <label class="form-check-label small fw-medium" style="font-size: 0.75rem; cursor: pointer;" (click)="toggleActive(act)">\
                {{ act.is_active ? '"'Activa'"' : '"'Inactiva'"' }}\
              </label>\
            </div>\
' src/app/components/deportivo/actividades/deportivo-actividades.html

sed -i '' -e '/<div class="form-check form-switch m-0 me-2"/,/<\/div>/c\
                <div class="form-check form-switch m-0 me-2 d-flex align-items-center gap-2" title="Activar/Desactivar">\
                  <input class="form-check-input m-0" type="checkbox" role="switch" style="cursor: pointer;"\
                         [checked]="act.is_active" (change)="toggleActive(act)">\
                  <label class="form-check-label small fw-medium" style="font-size: 0.75rem; cursor: pointer;" (click)="toggleActive(act)">\
                    {{ act.is_active ? '"'Activa'"' : '"'Inactiva'"' }}\
                  </label>\
                </div>\
' src/app/components/deportivo/actividades/deportivo-actividades.html

sed -i '' -e 's/Editar\n              <\/button>/<button class="btn btn-sm btn-primary px-3 shadow-sm" style="font-size: 0.8rem; font-weight: 500;" title="Editar" (click)="editActividad(act)">Editar<\/button>/g' src/app/components/deportivo/actividades/deportivo-actividades.html
