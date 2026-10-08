path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_horarios = """                @if (e.horarios && e.horarios.length > 0) {
                  <div class="d-flex flex-column gap-2 mb-3">
                    @for (h of e.horarios; track h.id) {
                      <div class="d-flex align-items-center justify-content-between p-2 border rounded" style="background: #fff;">
                        <div>
                          <div class="fw-semibold text-dark" style="font-size: 0.85rem;">
                            {{ daysMapping[h.dia_semana] || 'Día' }}
                          </div>
                          <div class="text-muted" style="font-size: 0.75rem;">
                            {{ formatHora(h.hora_inicio) }} - {{ formatHora(h.hora_fin) }}
                          </div>
                          @if (h.profesor_id) {
                            <div class="text-primary mt-1" style="font-size: 0.7rem; text-transform: capitalize;">
                              <i class="bi bi-person-fill"></i> {{ getInstructorName(h.profesor_id) }}
                            </div>
                          }
                        </div>
                        <button class="btn btn-sm text-danger border-0 p-1" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    }
                  </div>
                }"""

new_horarios = """                @if (e.horarios && e.horarios.length > 0) {
                  <div class="d-flex flex-column gap-3 mb-3">
                    @for (grupoDia of agruparPorDia(e.horarios); track grupoDia.dia) {
                      <div class="border rounded overflow-hidden shadow-sm" style="background: #fff;">
                        <div class="bg-light px-3 py-2 border-bottom text-dark fw-bold" style="font-size: 0.85rem;">
                          <i class="bi bi-calendar-check me-2 text-secondary"></i>{{ daysMapping[grupoDia.dia] || 'Día' }}
                        </div>
                        <div class="d-flex flex-column">
                          @for (h of grupoDia.horarios; track h.id; let last = $last) {
                            <div class="d-flex align-items-center justify-content-between px-3 py-2" [class.border-bottom]="!last">
                              <div>
                                <div class="text-dark fw-medium" style="font-size: 0.85rem;">
                                  <i class="bi bi-clock me-1 text-muted" style="font-size: 0.75rem;"></i>{{ formatHora(h.hora_inicio) }} - {{ formatHora(h.hora_fin) }}
                                </div>
                                @if (h.profesor_id) {
                                  <div class="text-primary mt-1" style="font-size: 0.75rem; text-transform: capitalize;">
                                    <i class="bi bi-person-fill text-primary opacity-75"></i> {{ getInstructorName(h.profesor_id) }}
                                  </div>
                                } @else {
                                  <div class="text-muted mt-1" style="font-size: 0.75rem;">
                                    <i class="bi bi-person-fill text-muted opacity-50"></i> Sin asignar
                                  </div>
                                }
                              </div>
                              <button class="btn btn-sm text-danger border-0 p-1" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                                <i class="bi bi-trash"></i>
                              </button>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }"""

html = html.replace(old_horarios, new_horarios)

with open(path, 'w') as f:
    f.write(html)
print("Replaced horarios list")
