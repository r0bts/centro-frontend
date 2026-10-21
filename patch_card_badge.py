import re

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'r') as f:
    content = f.read()

# Replace act.tiene_costo with act.costo_interno in the badge for Grid View
content = re.sub(
    r'@if\s*\(act\.tiene_costo\)\s*{\s*<span class="badge bg-warning-subtle text-warning border border-warning-subtle fw-medium">\s*<i class="bi bi-currency-dollar"></i> Con Cobro\s*</span>\s*}',
    r'@if (act.costo_interno) {\n              <span class="badge bg-warning-subtle text-warning border border-warning-subtle fw-medium">\n                <i class="bi bi-currency-dollar"></i> Costo Prof: ${{ act.costo_interno | number:\'1.2-2\' }}\n              </span>\n            }',
    content
)

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'w') as f:
    f.write(content)
