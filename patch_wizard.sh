# Remove the old Cobro block
sed -i '' -e '/<!-- Cobro -->/,/<\/div>/d' src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html
