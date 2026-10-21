import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

target = """        lugar:       h.lugar ?? null,
        area_id:     h.area_id ?? null,
      })),"""

replacement = """        lugar:       h.lugar ?? null,
        area_id:     h.area_id ?? null,
        profesor_id: h.profesor_id ?? null,
        costo_interno: h.costo_interno ?? null,
      })),"""

ts = ts.replace(target, replacement)

with open(ts_path, 'w') as f:
    f.write(ts)
