sed -i '' -e 's/Estado: {{ act.is_active ? '"'Activa'"' : '"'Inactiva'"' }}/{{ act.is_active ? '"'Activa'"' : '"'Inactiva'"' }}/g' src/app/components/deportivo/actividades/deportivo-actividades.html
sed -i '' -e 's/class="form-check-label small fw-medium"/class="form-check-label small fw-medium text-nowrap lh-1 mb-0"/g' src/app/components/deportivo/actividades/deportivo-actividades.html
