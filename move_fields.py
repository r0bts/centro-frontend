path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

fields_html = """          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Profesor Asignado</label>
              <select class="form-select" [(ngModel)]="profesor_id">
                <option [ngValue]="null">Sin profesor (por definir)</option>
                @for (p of formData()?.instructores || []; track p.id) {
                  <option [ngValue]="p.id">{{ p.full_name }}</option>
                }
              </select>
              <div class="form-text">Profesor responsable de esta actividad en general.</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Costo Interno (Nómina por clase)</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" class="form-control" placeholder="0.00" [(ngModel)]="costo_interno">
              </div>
              <div class="form-text">Monto que se le paga al profesor por impartir esta sesión.</div>
            </div>
          </div>"""

# Remove from Step 2
html = html.replace(fields_html + "\n\n", "")

# Add to Step 1 right after the "Costo para el socio" block
costo_socio_block = """          <div class="p-3 bg-light border rounded mb-4">
            <div class="form-check form-switch mb-0 d-flex align-items-center justify-content-between px-0">
              <div>
                <label class="form-check-label fw-bold mb-1 d-block" for="tieneCosto">Costo para el socio</label>
                <small class="text-muted d-block" style="line-height: 1.2;">Habilita esta opción si la actividad tiene un costo de inscripción.</small>
              </div>
              <input class="form-check-input ms-3 mt-0" type="checkbox" role="switch" id="tieneCosto" [(ngModel)]="tiene_costo" style="width: 2.5rem; height: 1.25rem;">
            </div>
            
            @if (tiene_costo) {
              <div class="mt-3 pt-3 border-top">
                <label class="form-label fw-semibold small">Monto (MXN)</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" placeholder="0.00" [(ngModel)]="monto">
                </div>
              </div>
            }
          </div>"""

html = html.replace(costo_socio_block, costo_socio_block + "\n\n" + fields_html)

with open(path, 'w') as f:
    f.write(html)
print("Moved fields to Step 1")
