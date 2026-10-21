import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

target = """                                  </select>
                                }

                                <button class="btn btn-sm text-danger border-0 p-1" title="Quitar" (click)="removeHorario(gIdx, h.originalIndex)">"""

replacement = """                                  </select>
                                }

                                <select class="form-select form-select-sm" style="min-width: 150px; flex-grow: 1;"
                                        [ngModel]="h.item.profesor_id"
                                        (ngModelChange)="updateHorarioField(gIdx, h.originalIndex, 'profesor_id', $event || null)">
                                  <option [ngValue]="null">Sin profesor</option>
                                  @for (inst of formData()?.instructores; track inst.id) {
                                    <option [ngValue]="inst.id">{{ inst.full_name }}</option>
                                  }
                                </select>
                                
                                <div class="input-group input-group-sm" style="width: 120px; flex-shrink: 0;">
                                  <span class="input-group-text bg-white">$</span>
                                  <input type="number" class="form-control" placeholder="Costo"
                                         [ngModel]="h.item.costo_interno"
                                         (ngModelChange)="updateHorarioField(gIdx, h.originalIndex, 'costo_interno', $event || null)">
                                </div>

                                <button class="btn btn-sm text-danger border-0 p-1" title="Quitar" (click)="removeHorario(gIdx, h.originalIndex)">"""

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Patched Step 4")
else:
    print("Target not found")
