html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

import re

old_html_pattern = re.compile(r"    @if \(viewMode\(\) === 'calendar'\) \{.*?    \}", re.DOTALL)

new_html = """    @if (viewMode() === 'calendar') {
      <div class="card shadow-sm border-0 mb-4" style="overflow-x: auto; border-radius: 12px; height: 75vh;">
        <div class="d-flex h-100" style="min-width: 900px;">
          @for (day of calendarDays(); track day.dia) {
            <div class="flex-fill border-end d-flex flex-column" style="width: 14.28%;">
              <!-- Day Header -->
              <div class="bg-light border-bottom p-2 text-center flex-shrink-0" style="z-index: 10;">
                <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                <small class="text-muted">{{ day.total }} sesiones</small>
              </div>
              
              <!-- Day Events -->
              <div class="p-2 d-flex flex-column gap-2 flex-grow-1" style="background-color: #f8f9fa; overflow-y: auto;">
                @for (item of day.acts; track item.act.id) {
                  <div class="card border-0 shadow-sm" [style.border-left]="'4px solid ' + (item.act.color || '#6366f1')">
                    <div class="card-body p-2 position-relative">
                      <div class="d-flex justify-content-between align-items-start mb-1">
                        <strong class="small text-truncate d-inline-block" style="max-width: 80%;" [title]="item.act.nombre">{{ item.act.nombre }}</strong>
                        <span class="badge bg-light text-dark px-1 py-0 border" style="font-size: 0.65rem;">{{ item.act.icono || '🏆' }}</span>
                      </div>
                      
                      <div class="text-muted mb-2" style="font-size: 0.7rem;">
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-1">{{ item.totalSesiones }} sesiones</span>
                      </div>
                      
                      <!-- Slots compactos -->
                      <div class="d-flex flex-column gap-1">
                        @for (slot of item.slots; track slot.start + '-' + slot.end) {
                          <div class="d-flex align-items-center justify-content-between" style="font-size: 0.7rem;">
                            <span class="text-muted"><i class="bi bi-clock me-1"></i>{{ formatHora(slot.start) }} - {{ formatHora(slot.end) }}</span>
                            <span class="text-secondary fw-semibold">x{{ slot.count }}</span>
                          </div>
                        }
                      </div>

                      @if (!item.act.is_active) {
                        <div class="position-absolute top-0 start-0 w-100 h-100 bg-white" style="opacity: 0.7; pointer-events: none;"></div>
                      }
                    </div>
                  </div>
                }
                
                @if (day.acts.length === 0) {
                  <div class="text-center text-muted py-4 small">
                    Sin actividades
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }"""

html = old_html_pattern.sub(new_html, html)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML with grouped template")
