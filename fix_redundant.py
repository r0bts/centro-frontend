import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Add header before @for
header = """                          <div class="d-flex flex-column gap-2">
                            @if (getHorariosByDia(gIdx, d.num).length > 0) {
                              <div class="row g-2 px-2 d-none d-md-flex">
                                <div class="col-md-3"><small class="text-muted fw-semibold">Inicio</small></div>
                                <div class="col-md-3"><small class="text-muted fw-semibold">Fin</small></div>
                                <div class="col-md-5"><small class="text-muted fw-semibold">Área</small></div>
                                <div class="col-md-1"></div>
                              </div>
                            }"""

html = html.replace('<div class="d-flex flex-column gap-2">', header)

# Hide labels on md+ screens
html = html.replace('<label class="form-label small text-muted mb-1 d-block">Inicio</label>', '<label class="form-label small text-muted mb-1 d-block d-md-none">Inicio</label>')
html = html.replace('<label class="form-label small text-muted mb-1 d-block">Fin</label>', '<label class="form-label small text-muted mb-1 d-block d-md-none">Fin</label>')
html = html.replace('<label class="form-label small text-muted mb-1 d-block">Área</label>', '<label class="form-label small text-muted mb-1 d-block d-md-none">Área</label>')

# Fix trash button alignment
# Find: <div class="col-12 col-md-1 d-flex justify-content-end align-items-end h-100 pb-1">
# Replace with: <div class="col-12 col-md-1 d-flex justify-content-end align-items-center h-100">
html = html.replace('<div class="col-12 col-md-1 d-flex justify-content-end align-items-end h-100 pb-1">', '<div class="col-12 col-md-1 d-flex justify-content-end align-items-center h-100">')

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML for less redundancy")
