path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

fields_to_remove = """          <div class="row g-3 mb-4">
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

html = html.replace(fields_to_remove, "")

with open(path, 'w') as f:
    f.write(html)
print("Removed fields from Step 1")
