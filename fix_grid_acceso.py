html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

import re

old_badges = """              @if (act.elegible_para_socios !== false) {
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 d-flex align-items-center gap-1" style="font-size: 0.75rem; font-weight: 700;">
                  <i class="bi bi-person-check"></i> Socios
                </span>
              } @else {
                <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2 py-1 d-flex align-items-center gap-1" style="font-size: 0.75rem; font-weight: 700;">
                  <i class="bi bi-building"></i> Staff
                </span>
              }"""

new_switch = """              <div class="form-check form-switch mb-0 d-flex align-items-center justify-content-end" style="padding-left: 0;">
                <label class="form-check-label small me-1 fw-bold" style="font-size: 0.7rem; cursor: pointer;" (click)="toggleSocios(act); $event.preventDefault()"
                       [class.text-primary]="act.elegible_para_socios !== false"
                       [class.text-info]="act.elegible_para_socios === false">
                  <i class="bi" [class.bi-person-check]="act.elegible_para_socios !== false" [class.bi-building]="act.elegible_para_socios === false"></i>
                  {{ act.elegible_para_socios !== false ? 'Socios' : 'Staff' }}
                </label>
                <input class="form-check-input m-0" type="checkbox" role="switch"
                       [checked]="act.elegible_para_socios !== false" 
                       (change)="toggleSocios(act)"
                       style="cursor: pointer; width: 1.8rem; height: 0.9rem;"
                       [class.bg-primary]="act.elegible_para_socios !== false"
                       [class.bg-info]="act.elegible_para_socios === false"
                       [class.border-primary]="act.elegible_para_socios !== false"
                       [class.border-info]="act.elegible_para_socios === false">
              </div>"""

if old_badges in html:
    html = html.replace(old_badges, new_switch)
    with open(html_path, 'w') as f:
        f.write(html)
    print("Updated Grid view badges to switch")
else:
    print("Could not find badges to replace")

