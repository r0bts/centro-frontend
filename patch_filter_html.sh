sed -i '' -e '/<select class="form-select form-select-sm w-auto" \[ngModel\]="filterDay()"/i\
      <select class="form-select form-select-sm w-auto" [ngModel]="filterElegibilidad()" (ngModelChange)="filterElegibilidad.set($any($event))">\
        <option value="todos">Todas (Socios y Staff)</option>\
        <option value="socios">Visible para Socios</option>\
        <option value="staff">Solo Staff / Interno</option>\
      </select>\
' src/app/components/deportivo/actividades/deportivo-actividades.html

sed -i '' -e 's/{{ act.is_active ? '"'Activa'"' : '"'Inactiva'"' }}/Estado: {{ act.is_active ? '"'Activa'"' : '"'Inactiva'"' }}/g' src/app/components/deportivo/actividades/deportivo-actividades.html
