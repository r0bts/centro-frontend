import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

target = "horarios.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null });"
replacement = "horarios.push({ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null, profesor_id: null, costo_interno: null });"

if target in ts:
    ts = ts.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
        f.write(ts)
    print("Patched toggleDia")
else:
    print("Target not found")
