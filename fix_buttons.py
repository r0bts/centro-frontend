html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

old_group = """      <div class="btn-group" role="group">
        <button type="button" class="btn btn-outline-secondary" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Vista de cuadrícula">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button type="button" class="btn btn-outline-secondary" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" title="Vista de lista">
          <i class="bi bi-list-ul"></i>
        </button>
      </div>"""

new_group = """      <div class="btn-group bg-white border rounded shadow-sm" role="group" style="padding: 2px;">
        <button type="button" class="btn btn-sm btn-light border-0" style="border-radius: 4px;" [class.bg-light]="viewMode() !== 'grid'" [class.bg-white]="viewMode() === 'grid'" [class.shadow-sm]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Vista de cuadrícula">
          <i class="bi bi-grid-fill" [class.text-primary]="viewMode() === 'grid'" [class.text-secondary]="viewMode() !== 'grid'"></i>
        </button>
        <button type="button" class="btn btn-sm btn-light border-0 mx-1" style="border-radius: 4px;" [class.bg-light]="viewMode() !== 'list'" [class.bg-white]="viewMode() === 'list'" [class.shadow-sm]="viewMode() === 'list'" (click)="viewMode.set('list')" title="Vista de lista">
          <i class="bi bi-list-ul" [class.text-primary]="viewMode() === 'list'" [class.text-secondary]="viewMode() !== 'list'"></i>
        </button>
        <button type="button" class="btn btn-sm btn-light border-0" style="border-radius: 4px;" [class.bg-light]="viewMode() !== 'calendar'" [class.bg-white]="viewMode() === 'calendar'" [class.shadow-sm]="viewMode() === 'calendar'" (click)="viewMode.set('calendar')" title="Vista de calendario">
          <i class="bi bi-calendar-week" [class.text-primary]="viewMode() === 'calendar'" [class.text-secondary]="viewMode() !== 'calendar'"></i>
        </button>
      </div>"""

html = html.replace(old_group, new_group)

# Now add the calendar view block at the end (before </app-layout>)
calendar_view = """
    @if (viewMode() === 'calendar') {
      <div class="card shadow-sm border-0 mb-4" style="overflow-x: auto; border-radius: 12px;">
        <div class="d-flex" style="min-width: 900px;">
          @for (day of calendarDays(); track day.dia) {
            <div class="flex-fill border-end" style="width: 14.28%; min-height: 500px;">
              <!-- Day Header -->
              <div class="bg-light border-bottom p-2 text-center sticky-top" style="z-index: 10;">
                <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                <small class="text-muted">{{ day.eventos.length }} act.</small>
              </div>
              
              <!-- Day Events -->
              <div class="p-2 d-flex flex-column gap-2" style="background-color: #f8f9fa; height: calc(100% - 50px);">
                @for (ev of day.eventos; track ev.h.id) {
                  <div class="card border-0 shadow-sm" [style.border-left]="'4px solid ' + (ev.act.color || '#6366f1')">
                    <div class="card-body p-2 position-relative">
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <strong class="small text-truncate d-inline-block" style="max-width: 80%;" [title]="ev.act.nombre">{{ ev.act.nombre }}</strong>
                        <span class="badge bg-light text-dark px-1 py-0 border" style="font-size: 0.65rem;">{{ ev.act.icono || '🏆' }}</span>
                      </div>
                      
                      <div class="small text-muted d-flex align-items-center mb-1" style="font-size: 0.75rem; font-weight: 600;">
                        <i class="bi bi-clock me-1"></i> {{ formatHora(ev.h.hora_inicio) }} - {{ formatHora(ev.h.hora_fin) }}
                      </div>
                      
                      <div class="text-muted d-flex align-items-center" style="font-size: 0.7rem;">
                        <i class="bi bi-people me-1 text-secondary"></i> 
                        <span class="text-truncate">{{ ev.grupoNombre }} &bull; {{ ev.equipoNombre }}</span>
                      </div>
                      
                      @if (!ev.act.is_active) {
                        <div class="position-absolute top-0 start-0 w-100 h-100 bg-white" style="opacity: 0.7; pointer-events: none;"></div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  </app-layout>"""

html = html.replace('  </app-layout>', calendar_view)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML with calendar")
