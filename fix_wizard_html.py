path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

operacion_content = """<!-- ════ PASO 2: Operación ════ -->
      @if (currentStep() === 2) {
        <div class="step-content">
          <h6 class="step-section-title">Reglas de Operación</h6>
          
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Profesor Asignado</label>
              <select class="form-select" [(ngModel)]="profesor_id">
                <option [ngValue]="null">Sin profesor (por definir)</option>
                @for (p of formData()?.instructores || []; track p.id) {
                  <option [ngValue]="p.id">{{ p.name }} {{ p.last_name }}</option>
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
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Elegibilidad</label>"""

import re
# Replace exactly at the start of step 2
html = re.sub(
    r'<!-- ════ PASO 2: Operación ════ -->\s*@if \(currentStep\(\) === 2\) \{\s*<div class="step-content">\s*<h6 class="step-section-title">Reglas de Operación</h6>\s*<div class="mb-3">\s*<label class="form-label fw-semibold">Elegibilidad</label>',
    operacion_content,
    html
)

with open(path, 'w') as f:
    f.write(html)
print("Updated wizard HTML")
