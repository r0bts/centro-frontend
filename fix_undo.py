html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# I will find the first occurrence (at line 171) and revert it back to <div class="d-flex flex-column gap-2">
bad_header = """                                      <div class="d-flex flex-column gap-2">
                            @if (getHorariosByDia(gIdx, d.num).length > 0) {
                              <div class="row g-2 px-2 d-none d-md-flex">
                                <div class="col-md-3"><small class="text-muted fw-semibold">Inicio</small></div>
                                <div class="col-md-3"><small class="text-muted fw-semibold">Fin</small></div>
                                <div class="col-md-5"><small class="text-muted fw-semibold">Área</small></div>
                                <div class="col-md-1"></div>
                              </div>
                            }"""

html = html.replace(bad_header, '<div class="d-flex flex-column gap-2">', 1)

with open(html_path, 'w') as f:
    f.write(html)
print("Undid accidental injection")
