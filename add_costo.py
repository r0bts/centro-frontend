html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

costo_section = """          <!-- Costo al socio -->
          <div class="mb-4 bg-light rounded p-3 border border-light-subtle">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <label class="form-label fw-semibold mb-0">Costo para el socio</label>
                <div class="small text-muted mt-1">Habilita esta opción si la actividad tiene un costo de inscripción.</div>
              </div>
              <div class="form-check form-switch ms-3 m-0">
                <input class="form-check-input" type="checkbox" role="switch" style="width: 2.5rem; height: 1.25rem; cursor: pointer;"
                       [(ngModel)]="tiene_costo">
              </div>
            </div>

            @if (tiene_costo) {
              <div class="mt-3 pt-3 border-top">
                <label class="form-label small fw-semibold">Monto a cobrar</label>
                <div class="input-group" style="max-width: 300px;">
                  <span class="input-group-text bg-white text-muted border-end-0" style="border-top-right-radius: 0 !important; border-bottom-right-radius: 0 !important;">$</span>
                  <input type="number" class="form-control border-start-0 ps-0" style="border-top-left-radius: 0 !important; border-bottom-left-radius: 0 !important;"
                         [(ngModel)]="monto" min="0" step="0.01" placeholder="Ej. 150.00">
                </div>
              </div>
            }
          </div>

          <div class="mb-3">"""

html = html.replace('<div class="mb-3">\n            <label class="form-label fw-semibold">Tipo</label>', costo_section + '\n            <label class="form-label fw-semibold">Tipo</label>')

with open(html_path, 'w') as f:
    f.write(html)
print("Added Costo al socio in Step 1")
