import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

html = html.replace('close.emit()', 'cancelled.emit()')
html = html.replace('isEditMode()', 'isEditing()')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
print("Fixed HTML methods.")
