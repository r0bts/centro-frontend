import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

target = """                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label small">Descripción</label>
                      <input type="text" class="form-control form-control-sm"
                             placeholder="Opcional" [(ngModel)]="grupos()[gi].descripcion">
                    </div>
                    <div class="col-3">
                      <label class="form-label small">Edad mín.</label>
                      <input type="number" class="form-control form-control-sm" min="0" max="99"
                             [(ngModel)]="grupos()[gi].edad_min">
                    </div>
                    <div class="col-3">
                      <label class="form-label small">Edad máx.</label>
                      <input type="number" class="form-control form-control-sm" min="0" max="99"
                             [(ngModel)]="grupos()[gi].edad_max">
                    </div>
                  </div>"""

replacement = """                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label small">Edad mínima (años)</label>
                      <input type="number" class="form-control form-control-sm" min="0" max="99" placeholder="Sin límite"
                             [(ngModel)]="grupos()[gi].edad_min">
                    </div>
                    <div class="col-6">
                      <label class="form-label small">Edad máxima (años)</label>
                      <input type="number" class="form-control form-control-sm" min="0" max="99" placeholder="Sin límite"
                             [(ngModel)]="grupos()[gi].edad_max">
                    </div>
                  </div>"""

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success")
else:
    print("Not found")
