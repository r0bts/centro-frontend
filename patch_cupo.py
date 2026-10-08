import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

target = """                  <!-- Cupo del grupo -->
                  <div class="mb-3">
                    <label class="mensajeria-option" [class.selected]="grupos()[gi].tiene_cupo">
                      <div>
                        <div class="fw-semibold small">Limitar cupo del grupo</div>
                        <small class="text-muted">Establece un máximo de lugares disponibles</small>
                      </div>
                      <div class="form-check form-switch ms-auto mb-0">
                        <input class="form-check-input" type="checkbox" role="switch"
                               [ngModel]="grupos()[gi].tiene_cupo"
                               (ngModelChange)="toggleGrupoCupo(gi, $event)"
                               style="width:2.5rem;height:1.25rem;cursor:pointer">
                      </div>
                    </label>"""

replacement = """                  <!-- Cupo del grupo -->
                  <div class="mb-3">
                    <label class="mensajeria-option" [class.selected]="grupos()[gi].tiene_cupo" style="padding: 0.6rem 1rem;">
                      <div class="row w-100 m-0 align-items-center">
                        <div class="col-12 col-md-5 pe-2 pe-md-3">
                          <span class="fw-semibold small">Limitar cupo del grupo</span>
                        </div>
                        <div class="col-12 col-md-7 ps-0 d-flex justify-content-between align-items-center">
                          <small class="text-muted">Máximo de lugares disponibles</small>
                          <div class="form-check form-switch ms-2 mb-0">
                            <input class="form-check-input" type="checkbox" role="switch"
                                   [ngModel]="grupos()[gi].tiene_cupo"
                                   (ngModelChange)="toggleGrupoCupo(gi, $event)"
                                   style="width:2.5rem;height:1.25rem;cursor:pointer">
                          </div>
                        </div>
                      </div>
                    </label>"""

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success replacing cupo toggle")
else:
    print("Not found")
