path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_form = """                <!-- Formulario rápido para agregar nuevo -->
                <div class="p-2 bg-light rounded border">
                  <div class="text-secondary small fw-bold mb-2"><i class="bi bi-plus-circle me-1"></i>Añadir horario</div>
                  <div class="row g-2 mb-2">
                    <div class="col-12">
                      <select class="form-select form-select-sm" [(ngModel)]="horarioForm.dia_semana">
                        <option [value]="1">Lunes</option>
                        <option [value]="2">Martes</option>
                        <option [value]="3">Miércoles</option>
                        <option [value]="4">Jueves</option>
                        <option [value]="5">Viernes</option>
                        <option [value]="6">Sábado</option>
                        <option [value]="7">Domingo</option>
                      </select>
                    </div>
                    <div class="col-6">
                      <input type="time" class="form-control form-control-sm" [(ngModel)]="horarioForm.hora_inicio">
                    </div>
                    <div class="col-6">
                      <input type="time" class="form-control form-control-sm" [(ngModel)]="horarioForm.hora_fin">
                    </div>
                    <div class="col-12 mt-1">
                      <button class="btn btn-sm btn-primary w-100" (click)="addHorarioRapido(e.id)" [disabled]="!horarioForm.dia_semana || !horarioForm.hora_inicio || !horarioForm.hora_fin">
                        Guardar horario
                      </button>
                    </div>
                  </div>
                </div>"""

new_form = """                <!-- Formulario rápido para agregar nuevo -->
                @if (e._showForm) {
                  <div class="p-2 bg-light rounded border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="text-secondary small fw-bold"><i class="bi bi-plus-circle me-1"></i>Añadir horario</div>
                      <button class="btn btn-sm text-muted p-0" (click)="e._showForm = false"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="row g-2 mb-2">
                      <div class="col-12">
                        <select class="form-select form-select-sm" [(ngModel)]="horarioForm.dia_semana">
                          <option [value]="1">Lunes</option>
                          <option [value]="2">Martes</option>
                          <option [value]="3">Miércoles</option>
                          <option [value]="4">Jueves</option>
                          <option [value]="5">Viernes</option>
                          <option [value]="6">Sábado</option>
                          <option [value]="7">Domingo</option>
                        </select>
                      </div>
                      <div class="col-6">
                        <input type="time" class="form-control form-control-sm" [(ngModel)]="horarioForm.hora_inicio">
                      </div>
                      <div class="col-6">
                        <input type="time" class="form-control form-control-sm" [(ngModel)]="horarioForm.hora_fin">
                      </div>
                      <div class="col-12 mt-1">
                        <button class="btn btn-sm btn-primary w-100" (click)="addHorarioRapido(e.id); e._showForm = false" [disabled]="!horarioForm.dia_semana || !horarioForm.hora_inicio || !horarioForm.hora_fin">
                          Guardar horario
                        </button>
                      </div>
                    </div>
                  </div>
                } @else {
                  <button class="btn btn-sm btn-light border text-secondary w-100 fw-medium d-flex justify-content-center align-items-center gap-2" (click)="e._showForm = true">
                    <i class="bi bi-plus-circle"></i>Añadir horario a este equipo
                  </button>
                }"""

html = html.replace(old_form, new_form)

with open(path, 'w') as f:
    f.write(html)
print("Updated form toggle")
