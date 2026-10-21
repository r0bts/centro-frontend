path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re
ts = re.sub(
    r"costo_interno: g\.equipos\?\.\[0\]\?\.horarios\?\.\[0\]\?\.costo_interno \?\? null,",
    "costo_interno: a.costo_interno ?? g.equipos?.[0]?.horarios?.[0]?.costo_interno ?? null,",
    ts
)

with open(path, 'w') as f:
    f.write(ts)
print("Updated patchForm to fallback to a.costo_interno")
