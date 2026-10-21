import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

target = "this.profesor_id     = act.profesor_id  ?? null;"
replacement = "this.profesor_id     = act.profesor_id ? Number(act.profesor_id) : null;"

if target in ts:
    ts = ts.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
        f.write(ts)
    print("Patched number cast")
else:
    print("Target not found")
