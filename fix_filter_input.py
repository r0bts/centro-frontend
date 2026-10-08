path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_html = """          <div class="col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Buscar actividad</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0" placeholder="Ej. Yoga, Tenis..." [(ngModel)]="filterNombre">
            </div>
          </div>"""

new_html = """          <div class="col-md-3">
            <label class="form-label small fw-semibold text-muted mb-1">Buscar actividad</label>
            <div class="position-relative">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style="font-size: 0.85rem; z-index: 4;"></i>
              <input type="text" class="form-control form-control-sm" style="padding-left: 2.2rem; padding-right: 2.2rem;" placeholder="Ej. Yoga, Tenis..." [(ngModel)]="filterNombre">
              @if (filterNombre()) {
                <i class="bi bi-x-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style="cursor: pointer; font-size: 0.85rem; z-index: 4;" (click)="filterNombre.set('')"></i>
              }
            </div>
          </div>"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Fixed filter input HTML")
