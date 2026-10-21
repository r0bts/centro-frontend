html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

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

  <!-- ── Confirmación de eliminación ── -->"""

if "@if (viewMode() === 'calendar')" not in html:
    html = html.replace('  <!-- ── Confirmación de eliminación ── -->', calendar_view)
    with open(html_path, 'w') as f:
        f.write(html)
    print("Inserted calendar view successfully.")
else:
    print("Calendar view already exists.")
