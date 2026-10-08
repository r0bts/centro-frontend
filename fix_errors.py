import re

# Fix TS
ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Remove my getDiaNombre
target_ts = """  getDiaNombre(dia: number): string {
    return this.dias.find(d => d.id === dia)?.label ?? 'Día desconocido';
  }"""
ts = ts.replace(target_ts, "")

with open(ts_path, 'w') as f:
    f.write(ts)

# Fix HTML
html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

html = html.replace('track d.id', 'track d.num')
html = html.replace('d.id', 'd.num')

with open(html_path, 'w') as f:
    f.write(html)

print("Fixed errors!")
