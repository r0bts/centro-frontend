import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace Identidad with General
html = html.replace('<!-- ════ PASO 1: Identidad ════ -->', '<!-- ════ PASO 1: General ════ -->')

# The exact block for Modo de mensajería and Cobro in Step 1 is:
#           <div class="mb-3">
#             <label class="form-label fw-semibold">Modo de mensajería</label>
#             ...
#           </div>
#         </div>
#       }
# We want to extract mensajeria and cobro, leaving the `</div>\n      }` intact.
# So we search up to the `</div>\n        </div>\n      }`.
chunk_match = re.search(r'(<div class="mb-3">\s*<label class="form-label fw-semibold">Modo de mensajería</label>.*?</div>\s*</div>\s*</div>)', html, re.DOTALL)

if not chunk_match:
    print("Could not find chunk!")
    exit(1)

chunk = chunk_match.group(1)

# Remove that exact chunk from Step 1, but we need to put the closing `</div>\n      }` back!
html = html.replace(chunk, '</div>\n      }')

# Remove the trailing `</div>\n      }` from chunk to use it inside Step 2
chunk = re.sub(r'</div>\s*</div>\s*</div>$', '</div>', chunk)

# Remove the "Cobro" section from chunk because Option B moves it to Step 4 Horarios!
cobro_match = re.search(r'(<!-- Cobro -->.*?</div>\s*</div>)', chunk, re.DOTALL)
if cobro_match:
    chunk = chunk.replace(cobro_match.group(1), '')

step2 = f"""      <!-- ════ PASO 2: Operación ════ -->
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

{chunk}
        </div>
      }}
"""

html = html.replace('<!-- ════ PASO 2: Grupos ════ -->', step2 + '\n      <!-- ════ PASO 3: Grupos ════ -->')

html = html.replace('@if (currentStep() === 2) {', '@if (currentStep() === 3) {', 1)
html = html.replace('<!-- ════ PASO 3: Horarios ════ -->', '<!-- ════ PASO 4: Horarios ════ -->')
html = html.replace('@if (currentStep() === 3) {', '@if (currentStep() === 4) {')
html = html.replace('<!-- ════ PASO 4: Evaluación ════ -->', '<!-- ════ PASO 5: Evaluación ════ -->')
html = html.replace('@if (currentStep() === 4) {', '@if (currentStep() === 5) {')
html = html.replace('<!-- ════ PASO 5: Resumen ════ -->', '<!-- ════ PASO 6: Resumen ════ -->')
html = html.replace('@if (currentStep() === 5) {', '@if (currentStep() === 6) {')

# Inject Profesor and Costo into Horario Row
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

old_horario_loop = re.search(r'(@for \(h of getHorariosByDia\(gIdx, d.num\); track h; let idx = \$index\) \{.*?\n\s*\})', html, re.DOTALL)
if old_horario_loop:
    # Also replace the old replicar button to cleanly sit above the loop, but wait, the old button was inside the header!
    # No, the old for loop was just displaying a row.
    html = html.replace(old_horario_loop.group(1), new_fields)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated Wizard Structure safely!")
