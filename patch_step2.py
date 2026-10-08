import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# We need to replace everything from "Modo de mensajería" up to "PASO 3: Grupos"
# Let's locate the slice:
start_str = '<label class="form-label fw-semibold">Modo de mensajería</label>'
end_str = '<!-- ════ PASO 3: Grupos ════ -->'

if start_str in html and end_str in html:
    start_idx = html.find(start_str) - 33  # include `<div class="mb-3">`
    end_idx = html.find(end_str)
    
    replacement = """<label class="form-label fw-semibold">Modo de mensajería</label>
            <div class="d-flex flex-column gap-2 mb-4">
              @for (opt of [
                {val:'bidireccional', label:'Bidireccional', desc:'Entrenadores y alumnos pueden enviar y responder mensajes'},
                {val:'solo_respuesta', label:'Solo respuesta', desc:'Los alumnos solo pueden responder mensajes del entrenador'},
                {val:'solo_lectura', label:'Solo lectura', desc:'Los alumnos solo pueden leer, no pueden responder'}
              ]; track opt.val) {
                <label class="mensajeria-option" [class.selected]="modo_mensajeria === opt.val" style="padding: 0.6rem 1rem;">
                  <input type="radio" [(ngModel)]="modo_mensajeria" [value]="opt.val" class="visually-hidden">
                  <div class="row w-100 m-0 align-items-center">
                    <div class="col-12 col-sm-3 px-0">
                      <span class="fw-semibold">{{ opt.label }}</span>
                    </div>
                    <div class="col-12 col-sm-9 px-0 d-flex justify-content-between align-items-center">
                      <small class="text-muted">{{ opt.desc }}</small>
                      @if (modo_mensajeria === opt.val) {
                        <i class="bi bi-check-circle-fill text-primary ms-2"></i>
                      }
                    </div>
                  </div>
                </label>
              }
            </div>
            
            <!-- Clasificación (Socios vs Staff) -->
            <label class="form-label fw-semibold">Elegibilidad</label>
            <label class="mensajeria-option mb-4" [class.selected]="elegible_para_socios" style="padding: 0.6rem 1rem;">
              <div class="row w-100 m-0 align-items-center">
                <div class="col-12 col-sm-3 px-0">
                  <span class="fw-semibold">¿Elegible para socios?</span>
                </div>
                <div class="col-12 col-sm-9 px-0 d-flex justify-content-between align-items-center">
                  <small class="text-muted">Si se desactiva, esta actividad será exclusiva para staff y no aparecerá en el portal de socios.</small>
                  <div class="form-check form-switch ms-2 mb-0">
                    <input class="form-check-input" type="checkbox" role="switch"
                           [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer">
                  </div>
                </div>
              </div>
            </label>

            <!-- Cobro a Socios -->
            <label class="form-label fw-semibold">Cobro a Socios</label>
            <label class="mensajeria-option mb-2" [class.selected]="tiene_costo" style="padding: 0.6rem 1rem;">
              <div class="row w-100 m-0 align-items-center">
                <div class="col-12 col-sm-3 px-0">
                  <span class="fw-semibold">¿Costo extra al socio?</span>
                </div>
                <div class="col-12 col-sm-9 px-0 d-flex justify-content-between align-items-center">
                  <small class="text-muted">Actívalo si la actividad requiere pago de inscripción o mensualidad por parte del socio.</small>
                  <div class="form-check form-switch ms-2 mb-0">
                    <input class="form-check-input" type="checkbox" role="switch"
                           [(ngModel)]="tiene_costo" style="width:2.5rem;height:1.25rem;cursor:pointer">
                  </div>
                </div>
              </div>
            </label>

            @if (tiene_costo) {
              <div class="mt-2 mb-4 d-flex justify-content-end">
                <div style="width: 100%; max-width: 300px;">
                  <label class="form-label small fw-semibold">Monto a cobrar al socio <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text bg-white">$</span>
                    <input type="number" class="form-control" placeholder="0.00"
                           min="0" step="0.01" [(ngModel)]="monto">
                  </div>
                </div>
              </div>
            }

            <hr class="my-4">

            <!-- Costo del Profesor -->
            <div class="mb-3">
              <label class="form-label fw-semibold text-primary d-flex align-items-center gap-2">
                <i class="bi bi-briefcase"></i> Costo del Profesor (Nómina / Honorarios)
              </label>
              <p class="small text-muted mb-3">
                Captura el <strong>costo actual vigente</strong> por clase/hora que se le paga al profesor. El sistema guardará automáticamente el historial de cambios. No corresponde al costo para el socio.
              </p>
              
              <div class="input-group mb-3" style="max-width: 300px;">
                <span class="input-group-text bg-white">$</span>
                <input type="number" class="form-control" placeholder="0.00"
                       min="0" step="0.01" [(ngModel)]="costo_interno">
              </div>

              @if (historial_costos && historial_costos.length > 0) {
                <div class="mt-3 bg-light p-3 rounded border">
                  <h6 class="small fw-bold text-muted mb-2">Historial de Costos</h6>
                  <div class="table-responsive">
                    <table class="table table-sm mb-0 bg-white" style="font-size: 0.85rem;">
                      <thead class="table-light">
                        <tr>
                          <th>Monto</th>
                          <th>Fecha de Inicio</th>
                          <th>Fecha de Fin</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (hist of historial_costos; track hist.id) {
                          <tr>
                            <td>$ {{ hist.costo | number:'1.2-2' }}</td>
                            <td>{{ hist.fecha_inicio | date:'dd/MMM/yyyy' }}</td>
                            <td>
                              @if (hist.fecha_fin) {
                                {{ hist.fecha_fin | date:'dd/MMM/yyyy' }}
                              } @else {
                                <span class="badge bg-success-subtle text-success">Vigente</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>

        </div>
      }

      """
    
    html = html[:start_idx] + replacement + html[end_idx:]
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success replacing step 2.")
else:
    print("Could not find delimiters.")
