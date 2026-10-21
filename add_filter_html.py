path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_row = """        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Sede (Unidad)</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterClubId">
              <option [ngValue]="null">Todas las sedes</option>
              @for (c of formData()?.acceso_clubes; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Zona (Área)</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterAreaId">
              <option [ngValue]="null">Todas las áreas</option>
              @for (a of formData()?.areas_mapeadas; track a.area_id) {
                <option [ngValue]="a.area_id">{{ a.area_name }}</option>
              }
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Horario / Día</label>
            <input type="text" class="form-control form-control-sm" placeholder="Ej. Lunes, 08:00..." [(ngModel)]="filterHorario">
          </div>
        </div>"""

new_row = """        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Buscar actividad</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0" placeholder="Ej. Yoga, Tenis..." [(ngModel)]="filterNombre">
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Sede (Unidad)</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterClubId">
              <option [ngValue]="null">Todas las sedes</option>
              @for (c of formData()?.acceso_clubes; track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Zona (Área)</label>
            <select class="form-select form-select-sm" [(ngModel)]="filterAreaId">
              <option [ngValue]="null">Todas las áreas</option>
              @for (a of formData()?.areas_mapeadas; track a.area_id) {
                <option [ngValue]="a.area_id">{{ a.area_name }}</option>
              }
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Horario / Día</label>
            <input type="text" class="form-control form-control-sm" placeholder="Ej. Lunes, 08:00..." [(ngModel)]="filterHorario">
          </div>
        </div>"""

html = html.replace(old_row, new_row)

with open(path, 'w') as f:
    f.write(html)
print("Added filter HTML")
