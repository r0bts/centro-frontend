import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

target = """                        <!-- Día Header -->
                        <div class="d-flex align-items-center gap-2 mb-2 mb-md-0" style="width: 140px; flex-shrink: 0;">
                          <span class="badge bg-primary-subtle text-primary rounded fs-6 fw-bold border border-primary-subtle px-2 py-1">{{ d.label }}</span>
                          <span class="fw-semibold text-secondary ">{{ getDiaNombre(d.num) }}</span>
                        </div>"""

replacement = """                        <!-- Día Header -->
                        <div class="d-flex align-items-center mb-2 mb-md-0" style="width: 110px; flex-shrink: 0; padding-top: 0.25rem;">
                          <span class="fw-bold text-secondary" style="font-size: 0.95rem;">{{ getDiaNombre(d.num) }}</span>
                        </div>"""

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success")
else:
    print("Target not found")
