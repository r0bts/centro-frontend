import re

# 1. Update TS
ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

format_method = """  formatTipo(tipo?: string | null): string {
    if (!tipo) return 'Desconocido';
    const str = tipo.replace(/[_-]/g, ' ');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getClubName(clubId?: number): string {"""

ts = ts.replace("  getClubName(clubId?: number): string {", format_method)

with open(ts_path, 'w') as f:
    f.write(ts)

# 2. Update HTML
html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

html = html.replace("{{ act.tipo || 'deporte_individual' }}", "{{ formatTipo(act.tipo) }}")

with open(html_path, 'w') as f:
    f.write(html)

print("Added formatTipo")
