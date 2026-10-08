path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_html = """          <!-- Instructores Chips -->
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
          }"""

new_html = """          <!-- Instructores Chips -->
          @let profs = getInstructoresDeActividad(act);
          @if (profs.length > 0) {
            <div class="d-flex flex-wrap gap-1 mb-auto mt-1 pb-1" style="max-height: 28px; overflow: hidden;">
              @for (profId of profs | slice:0:2; track profId) {
                <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; font-weight: 500; background: #f8f9fa;" [title]="getInstructorName(profId)">
                  <i class="bi bi-person-fill text-muted"></i>
                  <span class="text-truncate" style="max-width: 85px;">{{ getInstructorName(profId) }}</span>
                </span>
              }
              @if (profs.length > 2) {
                <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center" style="font-size: 0.7rem; font-weight: 500; background: #e9ecef;" [title]="getExtraInstructoresNames(profs)">
                  +{{ profs.length - 2 }}
                </span>
              }
            </div>
          } @else {
            <div class="mb-auto"></div>
          }"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML")
