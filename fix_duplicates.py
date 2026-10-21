import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# I appended them at the bottom. I will just find the marker:
# "// ── Replicar y Horarios ──────────────────────────────────────────────────"
# and remove everything from it to the end of the file except the last `}`
marker = "// ── Replicar y Horarios ──────────────────────────────────────────────────"
idx = ts.rfind(marker)
if idx != -1:
    ts = ts[:idx] + "\n}\n"

with open(ts_path, 'w') as f:
    f.write(ts)
print("Removed duplicated block at the end!")
