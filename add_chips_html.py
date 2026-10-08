path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_html = """          <!-- Badges below list -->
          <div class="d-flex flex-wrap gap-2 mb-auto pb-1">
            <span class="badge border text-dark fw-normal rounded-pill px-2 py-1" style="font-size: 0.75rem; background: #fff;">{{ formatTipo(act.tipo) }}</span>
          </div>

          <hr class="mt-0 mb-1" style="border-color: #e9ecef;">"""

new_html = """          <!-- Badges below list -->
          <div class="d-flex flex-wrap gap-2 pb-1">
            <span class="badge border text-dark fw-normal rounded-pill px-2 py-1" style="font-size: 0.75rem; background: #fff;">{{ formatTipo(act.tipo) }}</span>
          </div>

          <!-- Instructores Chips -->
          @if (getInstructoresDeActividad(act).length > 0) {
            <div class="d-flex flex-wrap gap-1 mb-auto mt-1 pb-1">
              @for (profId of getInstructoresDeActividad(act); track profId) {
                <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; font-weight: 500; background: #f8f9fa;">
                  <i class="bi bi-person-fill text-muted"></i>
                  {{ getInstructorName(profId) }}
                </span>
              }
            </div>
          } @else {
            <div class="mb-auto"></div>
          }

          <hr class="mt-1 mb-1" style="border-color: #e9ecef;">"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML for chips")
