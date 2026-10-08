ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

import re
m = re.search(r'editActividad\(.*?\).*?\{.*?\}', ts, re.DOTALL)
print(m.group(0) if m else "Not found")
