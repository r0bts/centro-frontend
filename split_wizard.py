import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

header = html.split('<!-- ════ PASO 1: Identidad ════ -->')[0]
footer = html.split('</div><!-- /wizard-body -->')[1]

content = html[len(header): -len('</div><!-- /wizard-body -->') - len(footer)]

parts = re.split(r'<!-- ════ PASO \d: [^═]+ ════ -->', content)
# parts[0] is empty because the string starts with the separator
paso_identidad = parts[1]
paso_grupos = parts[2]
paso_horarios = parts[3]
paso_evaluacion = parts[4]
paso_resumen = parts[5]

# Now, we process Paso Identidad to split it into "General" (1) and "Operacion" (2)
# In paso_identidad, we find "Modo de mensajería"
mensajeria_idx = paso_identidad.find('<div class="mb-3">\n            <label class="form-label fw-semibold">Modo de mensajería</label>')
if mensajeria_idx == -1:
    print("mensajeria_idx not found")
    exit(1)

# The end of the "Operacion" part is the end of the step content `</div>\n      }`
# Which is at the very end of paso_identidad.
operacion_part = paso_identidad[mensajeria_idx:]
general_part = paso_identidad[:mensajeria_idx] + '        </div>\n      }\n'

# We remove the "Cobro" section from operacion_part
cobro_match = re.search(r'(<!-- Cobro -->.*?</div>\s*</div>)', operacion_part, re.DOTALL)
if cobro_match:
    operacion_part = operacion_part.replace(cobro_match.group(1), '')

# operacion_part still has the closing `</div>\n      }` from the original step.
# Let's wrap it in Step 2:
step2_content = f"""
      @if (currentStep() === 2) {{
        <div class="step-content">
          <h6 class="step-section-title">Reglas de Operación</h6>
          
          <div class="mb-3">
            <label class="form-label fw-semibold">Elegibilidad</label>
            <label class="mensajeria-option" [class.selected]="elegible_para_socios">
              <div>
                <div class="fw-semibold">¿Exclusivo para Socios?</div>
                <small class="text-muted">Desactiva esta opción si la actividad está abierta a invitados o externos.</small>
              </div>
              <div class="form-check form-switch ms-auto mb-0">
                <input class="form-check-input" type="checkbox" role="switch"
                       [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer">
              </div>
            </label>
          </div>

          {operacion_part}
"""

# Now we adjust currentStep numbers for the other steps
paso_grupos = paso_grupos.replace('@if (currentStep() === 2)', '@if (currentStep() === 3)')
paso_horarios = paso_horarios.replace('@if (currentStep() === 3)', '@if (currentStep() === 4)')
paso_evaluacion = paso_evaluacion.replace('@if (currentStep() === 4)', '@if (currentStep() === 5)')
paso_resumen = paso_resumen.replace('@if (currentStep() === 5)', '@if (currentStep() === 6)')

# Inject Profesor and Costo into paso_horarios
new_fields = """
                          <!-- Asignación de Profesor y Costo por Horario -->
                          @for (h of getHorariosByDia(gIdx, d.num); track h.hora_inicio; let idx = $index) {
                            <div class="mt-3 p-3 bg-light rounded border border-secondary-subtle">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-semibold text-primary">
                                  <i class="bi bi-clock me-1"></i> {{ h.hora_inicio }} - {{ h.hora_fin }}
                                </span>
                                <button class="btn btn-sm btn-outline-danger border-0" (click)="removeHorario(gIdx, d.num, idx)">
                                  <i class="bi bi-trash"></i>
                                </button>
                              </div>
                              <div class="row g-2">
                                <div class="col-md-6">
                                  <label class="form-label small mb-1">Profesor asignado (Opcional)</label>
                                  <select class="form-select form-select-sm" [(ngModel)]="h.profesor_id">
                                    <option [ngValue]="null">-- Sin profesor --</option>
                                    @for (p of $any(formData())?.profesores; track p.id) {
                                      <option [ngValue]="p.id">{{ p.name }}</option>
                                    }
                                  </select>
                                </div>
                                <div class="col-md-6">
                                  <label class="form-label small mb-1">Costo ($)</label>
                                  <input type="number" class="form-control form-control-sm" placeholder="0.00" min="0" step="0.01" [(ngModel)]="h.costo_interno">
                                </div>
                              </div>
                            </div>
                          }
"""
old_horario_loop = re.search(r'(@for \(h of getHorariosByDia\(gIdx, d.num\); track h; let idx = \$index\) \{.*?\n\s*\})', paso_horarios, re.DOTALL)
if old_horario_loop:
    paso_horarios = paso_horarios.replace(old_horario_loop.group(1), new_fields)

# Reconstruct
final_html = (
    header + 
    '<!-- ════ PASO 1: General ════ -->' + general_part +
    '<!-- ════ PASO 2: Operación ════ -->' + step2_content +
    '<!-- ════ PASO 3: Grupos ════ -->' + paso_grupos +
    '<!-- ════ PASO 4: Horarios ════ -->' + paso_horarios +
    '<!-- ════ PASO 5: Evaluación ════ -->' + paso_evaluacion +
    '<!-- ════ PASO 6: Resumen ════ -->' + paso_resumen +
    '</div><!-- /wizard-body -->' + footer
)

with open(html_path, 'w') as f:
    f.write(final_html)

print("Split and Reconstructed Successfully!")
