import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Add filters UI right before <div class="activities-grid">
filters_html = """
    <!-- ── Filtros ── -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body py-3">
        <div class="row g-3">
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
              @for (a of formData()?.areas_mapeadas; track a.id) {
                <option [ngValue]="a.id">{{ a.nombre }}</option>
              }
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-semibold text-muted mb-1">Horario / Día</label>
            <input type="text" class="form-control form-control-sm" placeholder="Ej. Lunes, 08:00..." [(ngModel)]="filterHorario">
          </div>
        </div>
      </div>
    </div>
    
    <div class="activities-grid">
"""
html = html.replace('    <div class="activities-grid">', filters_html)

# Change the for loop to use filteredActividades
html = html.replace('@for (act of actividades(); track act.id) {', '@for (act of filteredActividades(); track act.id) {')

with open(html_path, 'w') as f:
    f.write(html)
print("Patched HTML Filters!")
