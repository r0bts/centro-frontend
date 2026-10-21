path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_costo = """                      @if (act.tiene_costo) {
                        <span class="badge bg-warning-subtle text-warning ms-1" title="Tiene costo">💰</span>
                      }"""

new_costo = """                      @if (act.tiene_costo) {
                        <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill ms-2 d-inline-flex align-items-center gap-1" title="Tiene costo: {{ (act.monto || 0) | currency:'MXN':'symbol':'1.2-2' }}">
                          💰 {{ (act.monto || 0) | currency:'MXN':'symbol':'1.2-2' }}
                        </span>
                      }"""

html = html.replace(old_costo, new_costo)

with open(path, 'w') as f:
    f.write(html)
print("Added monto")
