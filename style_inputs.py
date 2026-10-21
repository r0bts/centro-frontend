path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_readonly = """                                <div class="d-flex align-items-center gap-2 mb-2">
                                  <div class="input-group input-group-sm w-100">
                                    <span class="input-group-text bg-light text-muted border-end-0"><i class="bi bi-box-arrow-in-right"></i></span>
                                    <input type="time" class="form-control text-center bg-white" [value]="h.hora_inicio.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                    <span class="input-group-text bg-light text-muted border-start-0 border-end-0">a</span>
                                    <input type="time" class="form-control text-center bg-white" [value]="h.hora_fin.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                  </div>
                                  <button class="btn btn-sm btn-outline-danger px-2 flex-shrink-0" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                                    <i class="bi bi-trash"></i>
                                  </button>
                                </div>"""

new_readonly = """                                <div class="d-flex align-items-center gap-2 mb-2">
                                  <div class="input-group input-group-sm w-100 rounded-pill border overflow-hidden shadow-sm" style="background: #fff;">
                                    <span class="input-group-text bg-light text-muted border-0"><i class="bi bi-box-arrow-in-right"></i></span>
                                    <input type="time" class="form-control text-center bg-white border-0 px-1" [value]="h.hora_inicio.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                    <span class="input-group-text bg-light text-muted border-0 px-1">a</span>
                                    <input type="time" class="form-control text-center bg-white border-0 px-1" [value]="h.hora_fin.substring(0,5)" readonly title="Para cambiar este horario, elimínalo y crea uno nuevo">
                                  </div>
                                  <button class="btn btn-sm btn-outline-danger rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 31px; height: 31px;" title="Eliminar" (click)="deleteHorarioRapido(selectedActividadForHorarios()!.id, e.id, h.id)">
                                    <i class="bi bi-trash"></i>
                                  </button>
                                </div>"""

html = html.replace(old_readonly, new_readonly)

old_inline = """                                <div class="d-flex align-items-center gap-2 mt-2 p-2 bg-light border border-primary rounded border-opacity-25" style="box-shadow: inset 0 0 0 1px rgba(13,110,253,.15);">
                                  <div class="input-group input-group-sm w-100">
                                    <input type="time" class="form-control text-center border-primary border-opacity-50" [(ngModel)]="horarioForm.hora_inicio">
                                    <span class="input-group-text bg-white text-muted border-primary border-opacity-50 border-start-0 border-end-0">a</span>
                                    <input type="time" class="form-control text-center border-primary border-opacity-50" [(ngModel)]="horarioForm.hora_fin">
                                  </div>
                                  <button class="btn btn-sm btn-primary px-2 flex-shrink-0" title="Guardar" (click)="saveInlineForm()" [disabled]="!horarioForm.hora_inicio || !horarioForm.hora_fin">
                                    <i class="bi bi-check-lg"></i>
                                  </button>
                                  <button class="btn btn-sm btn-light border px-2 flex-shrink-0 text-secondary" title="Cancelar" (click)="inlineFormEquipoId.set(null)">
                                    <i class="bi bi-x-lg"></i>
                                  </button>
                                </div>"""

new_inline = """                                <div class="d-flex align-items-center gap-2 mt-2 p-2 bg-light border border-primary rounded-pill border-opacity-25 shadow-sm" style="box-shadow: inset 0 0 0 1px rgba(13,110,253,.15);">
                                  <div class="input-group input-group-sm w-100 rounded-pill overflow-hidden border border-primary border-opacity-25" style="background: #fff;">
                                    <input type="time" class="form-control text-center border-0 px-1" [(ngModel)]="horarioForm.hora_inicio">
                                    <span class="input-group-text bg-white text-muted border-0 px-1">a</span>
                                    <input type="time" class="form-control text-center border-0 px-1" [(ngModel)]="horarioForm.hora_fin">
                                  </div>
                                  <button class="btn btn-sm btn-primary rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 31px; height: 31px;" title="Guardar" (click)="saveInlineForm()" [disabled]="!horarioForm.hora_inicio || !horarioForm.hora_fin">
                                    <i class="bi bi-check-lg"></i>
                                  </button>
                                  <button class="btn btn-sm btn-light border rounded-circle flex-shrink-0 text-secondary d-flex align-items-center justify-content-center" style="width: 31px; height: 31px;" title="Cancelar" (click)="inlineFormEquipoId.set(null)">
                                    <i class="bi bi-x-lg"></i>
                                  </button>
                                </div>"""

html = html.replace(old_inline, new_inline)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML for homologated inputs")
