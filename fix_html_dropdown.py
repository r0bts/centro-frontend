path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_html = """              @if (profs.length > 2) {
                <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center" style="font-size: 0.7rem; font-weight: 500; background: #e9ecef;" [title]="getExtraInstructoresNames(profs)">
                  +{{ profs.length - 2 }}
                </span>
              }"""

new_html = """              @if (profs.length > 2) {
                <div class="dropdown d-inline-block">
                  <span class="badge text-secondary border rounded-pill px-2 py-1 d-inline-flex align-items-center" 
                        style="font-size: 0.7rem; font-weight: 500; background: #e9ecef; cursor: pointer;" 
                        data-bs-toggle="dropdown" aria-expanded="false" title="Ver todos">
                    +{{ profs.length - 2 }} <i class="bi bi-chevron-down ms-1" style="font-size: 0.55rem;"></i>
                  </span>
                  <ul class="dropdown-menu shadow-sm border-0" style="font-size: 0.8rem; border-radius: 0.5rem; z-index: 1050;">
                    <li class="dropdown-header text-uppercase" style="font-size: 0.65rem; font-weight: 700;">Resto de profesores</li>
                    @for (profId of profs | slice:2; track profId) {
                      <li>
                        <span class="dropdown-item d-flex align-items-center gap-2 py-1">
                          <i class="bi bi-person-fill text-muted"></i>
                          {{ getInstructorName(profId, true) }}
                        </span>
                      </li>
                    }
                  </ul>
                </div>
              }"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML with Dropdown")
