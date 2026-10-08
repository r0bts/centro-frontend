import re

# Fix TS model
with open('src/app/models/deportivo/actividad.model.ts', 'r') as f:
    ts = f.read()

# Add elegible_para_socios to CreateActividadRequest
ts = ts.replace('is_active: boolean;\n  created_by: number;', 'is_active: boolean;\n  elegible_para_socios?: boolean;\n  created_by: number;')

with open('src/app/models/deportivo/actividad.model.ts', 'w') as f:
    f.write(ts)

# Fix HTML 
with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

html = html.replace('formData()?.sedes', 'formData()?.acceso_clubes')
html = html.replace('c.nombre', 'c.name')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)

print("Fixed HTML and model.")
