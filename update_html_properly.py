import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# 1. View selector
view_selector_regex = r'<div class="d-flex align-items-center bg-white border rounded-pill p-1 shadow-sm position-relative">.*?</div>\s*</div>\s*<button routerLink="crear"'
new_view_selector = """<div class="d-flex align-items-center bg-white border rounded-pill p-1 shadow-sm position-relative">
          <div class="position-absolute bg-primary rounded-pill shadow-sm"
               style="width: 36px; height: 32px; top: 4px; left: 4px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 0;"
               [ngStyle]="{'transform': viewMode() === 'grid' ? 'translateX(0px)' : (viewMode() === 'list' ? 'translateX(40px)' : (viewMode() === 'calendar' ? 'translateX(80px)' : (viewMode() === 'classic' ? 'translateX(120px)' : 'translateX(160px)')))}">
          </div>
          <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                  [class.text-white]="viewMode() === 'grid'" [class.text-secondary]="viewMode() !== 'grid'"
                  (click)="viewMode.set('grid')" title="Vista de tarjetas">
            <i class="bi bi-grid-fill"></i>
          </button>
          <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s; margin-left: 4px;"
                  [class.text-white]="viewMode() === 'list'" [class.text-secondary]="viewMode() !== 'list'"
                  (click)="viewMode.set('list')" title="Vista de lista">
            <i class="bi bi-list-ul" style="font-size: 1.1rem;"></i>
          </button>
          <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s; margin-left: 4px;"
                  [class.text-white]="viewMode() === 'calendar'" [class.text-secondary]="viewMode() !== 'calendar'"
                  (click)="viewMode.set('calendar')" title="Línea de tiempo">
            <i class="bi bi-distribute-horizontal"></i>
          </button>
          <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s; margin-left: 4px;"
                  [class.text-white]="viewMode() === 'classic'" [class.text-secondary]="viewMode() !== 'classic'"
                  (click)="viewMode.set('classic')" title="Agenda Clásica">
            <i class="bi bi-calendar-week"></i>
          </button>
          <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s; margin-left: 4px;"
                  [class.text-white]="viewMode() === 'heatmap'" [class.text-secondary]="viewMode() !== 'heatmap'"
                  (click)="viewMode.set('heatmap')" title="Mapa de Calor">
            <i class="bi bi-grid-3x3-gap-fill"></i>
          </button>
        </div>
      </div>
      <button routerLink="crear" """
html = re.sub(view_selector_regex, new_view_selector, html, flags=re.DOTALL)


# 2. Filters section (Adding 'Area' filter)
filters_regex = r'<div class="col">\s*<label class="form-label small fw-semibold text-muted mb-1">Profesor</label>'
area_filter = """<div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Área / Salón</label>
            <ng-select [items]="uniqueAreas()" 
                       [ngModel]="filterArea()" 
                       (ngModelChange)="filterArea.set($event)"
                       bindLabel="" bindValue=""
                       placeholder="Cualquier área"
                       [clearable]="true"
                       class="custom-sm-select w-100">
            </ng-select>
          </div>
          <div class="col">
            <label class="form-label small fw-semibold text-muted mb-1">Profesor</label>"""
html = re.sub(filters_regex, area_filter, html)

# 3. Add Classic Calendar and Heatmap HTML
classic_and_heatmap = """
    <!-- ── VISTA DE MATRIZ CLÁSICA (AGENDA POR ESPACIO / PROFESOR) ── -->
    @if (viewMode() === 'classic') {
      <div class="card shadow-sm border-0 mb-4 overflow-hidden" style="border-radius: 12px; height: 75vh; display: flex; flex-direction: column;">
        @if (!filterArea() && !filterProfesorId()) {
          <div class="d-flex flex-column align-items-center justify-content-center h-100 bg-light p-5 text-center">
            <div class="display-1 text-muted opacity-25 mb-3"><i class="bi bi-calendar2-x"></i></div>
            <h4 class="text-secondary fw-bold">Vista de Matriz Bloqueada</h4>
            <p class="text-muted" style="max-width: 500px; margin: 0 auto;">Para evitar sobrecargar la pantalla con miles de tarjetas, utiliza los filtros superiores (<b>Área / Salón</b> o <b>Profesor</b>) para generar la agenda semanal específica.</p>
          </div>
        } @else {
          <div class="table-responsive flex-grow-1" style="background-color: #f8f9fa;">
            <table class="table table-bordered mb-0" style="min-width: max-content;">
              <thead class="sticky-top shadow-sm" style="z-index: 1030;">
                <tr>
                  <th class="bg-white border-bottom-0 text-center align-middle sticky-start shadow-sm" style="width: 100px; left: 0; z-index: 1031;">
                    <i class="bi bi-clock text-muted"></i>
                  </th>
                  @for (day of calendarDays(); track day.dia) {
                    <th class="bg-white border-bottom-0 text-center py-3" style="min-width: 180px;">
                      <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of timeTableHours(); track row.hour) {
                  <tr>
                    <!-- Time Axis -->
                    <td class="bg-white text-center align-middle fw-semibold text-secondary sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; font-size: 0.85rem;">
                      {{ row.label }}
                    </td>
                    
                    <!-- Day Cells -->
                    @for (day of calendarDays(); track day.dia) {
                      <td class="p-2 align-top bg-white" style="vertical-align: top;">
                        <div class="d-flex flex-column gap-2">
                          @for (session of row.days[day.dia]; track session.id) {
                            <div class="card shadow-sm session-card" 
                                 [style.border]="'1px solid color-mix(in srgb, ' + session.actColor + ' 30%, transparent)'"
                                 [style.border-left]="'4px solid ' + session.actColor"
                                 [style.background-color]="'color-mix(in srgb, ' + session.actColor + ' 8%, white)'"
                                 style="cursor: pointer;"
                                 (click)="openHorariosOffcanvas(session.actRef)">
                              <div class="card-body p-2 bg-transparent">
                                <div class="mb-1"><span class="badge bg-white text-dark border fw-bold" style="font-size: 0.7rem;">{{ formatHora(session.start) }} - {{ formatHora(session.end) }}</span></div>
                                <strong class="d-block text-dark lh-sm mb-1" style="font-size: 0.8rem;">{{ session.actNombre }}</strong>
                                <div class="text-muted d-flex align-items-center" style="font-size: 0.7rem;"><i class="bi bi-person me-1"></i>{{ session.profesor }}</div>
                                <div class="text-muted d-flex align-items-center mt-1" style="font-size: 0.7rem;"><i class="bi bi-geo-alt me-1"></i>{{ session.ubicacion }}</div>
                              </div>
                            </div>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }

    <!-- ── MAPA DE CALOR (HEATMAP) ── -->
    @if (viewMode() === 'heatmap') {
      <div class="card shadow-sm border-0 mb-4 overflow-hidden" style="border-radius: 12px;">
        <div class="card-header bg-white border-bottom py-3">
          <h5 class="mb-0 fw-bold"><i class="bi bi-grid-3x3-gap-fill text-primary me-2"></i>Mapa de Calor: Densidad de Clases</h5>
          <small class="text-muted">Muestra la saturación de las instalaciones por día y hora. Tonos más oscuros indican mayor cantidad de actividades simultáneas.</small>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered mb-0 text-center" style="table-layout: fixed;">
            <thead>
              <tr>
                <th class="bg-light" style="width: 100px;">Hora \\ Día</th>
                @for (day of calendarDays(); track day.dia) {
                  <th class="bg-light">{{ day.nombre }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of timeTableHours(); track row.hour) {
                <tr>
                  <td class="bg-light fw-bold text-secondary align-middle">{{ row.label }}</td>
                  @for (day of calendarDays(); track day.dia) {
                    <td class="align-middle position-relative p-0" 
                        [style.background-color]="'rgba(13, 110, 253, ' + ((row.days[day.dia]?.length || 0) / heatmapMax() * 0.8) + ')'"
                        [style.height]="'60px'">
                      @if (row.days[day.dia]?.length > 0) {
                        <span class="fw-bold position-absolute top-50 start-50 translate-middle"
                              [class.text-white]="(row.days[day.dia]?.length || 0) / heatmapMax() > 0.4"
                              [class.text-dark]="(row.days[day.dia]?.length || 0) / heatmapMax() <= 0.4"
                              style="font-size: 1.1rem; text-shadow: 0px 0px 4px rgba(255,255,255,0.5);">
                          {{ row.days[day.dia].length }}
                        </span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
"""

if 'viewMode() === \'classic\'' not in html:
    html = html.replace('    <!-- ── Confirmación de eliminación ── -->', classic_and_heatmap + '\n    <!-- ── Confirmación de eliminación ── -->')

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML successfully!")
