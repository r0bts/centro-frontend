import re

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'r') as f:
    content = f.read()

replacement_grid = """
            @if (act.tiene_costo) {
              <span class="badge bg-warning-subtle text-warning border border-warning-subtle fw-medium">
                <i class="bi bi-currency-dollar"></i> Socio: ${{ act.monto | number:'1.2-2' }}
              </span>
            }
            @if (act.costo_interno) {
              <span class="badge bg-info-subtle text-info border border-info-subtle fw-medium">
                <i class="bi bi-briefcase"></i> Prof: ${{ act.costo_interno | number:'1.2-2' }}
              </span>
            }
"""

content = re.sub(
    r'@if \(act\.costo_interno\) \{\s*<span class="badge bg-warning-subtle text-warning border border-warning-subtle fw-medium">\s*<i class="bi bi-currency-dollar"></i> Costo Prof:[^\n]*\s*</span>\s*\}',
    replacement_grid.strip(),
    content
)

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'w') as f:
    f.write(content)
