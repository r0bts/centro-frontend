sed -i '' -e 's/<div class="dropdown">/<div class="d-none">/g' src/app/components/deportivo/actividades/deportivo-actividades.html

sed -i '' -e '/<button class="btn btn-sm btn-primary/i\
                <button class="btn btn-sm btn-light text-secondary action-icon-btn px-2 shadow-sm" title="Duplicar" (click)="duplicateActividad(act, $event)">\
                  <i class="bi bi-copy"></i>\
                </button>\
                <button class="btn btn-sm btn-light text-danger action-icon-btn px-2 shadow-sm" title="Eliminar" (click)="confirmDelete(act)">\
                  <i class="bi bi-trash"></i>\
                </button>\
' src/app/components/deportivo/actividades/deportivo-actividades.html
