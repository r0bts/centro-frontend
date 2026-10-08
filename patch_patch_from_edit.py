import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

target = """        lugar:       h.lugar ?? null,
        area_id:     h.area_id ?? null,
      })),"""
replacement = """        lugar:       h.lugar ?? null,
        area_id:     h.area_id ?? null,
        profesor_id: h.profesor_id ? Number(h.profesor_id) : null,
        costo_interno: h.costo_interno ?? null,
      })),"""

if target in ts:
    ts = ts.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
        f.write(ts)
    print("Patched patchFromEdit")
else:
    print("Target not found")
