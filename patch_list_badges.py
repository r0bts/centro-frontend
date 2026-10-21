import re

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'r') as f:
    content = f.read()

replacement = """                  }
                  @if (act.tiene_costo) {
                    <span class="badge bg-warning-subtle text-warning rounded-pill" style="font-size: 0.65rem;" title="Cobro a Socios"><i class="bi bi-currency-dollar"></i> Socio: ${{ act.monto | number:'1.2-2' }}</span>
                  }
                  @if (act.costo_interno) {
                    <span class="badge bg-info-subtle text-info rounded-pill" style="font-size: 0.65rem;" title="Costo del Profesor"><i class="bi bi-briefcase"></i> Prof: ${{ act.costo_interno | number:'1.2-2' }}</span>
                  }"""

content = content.replace('                  }\n                  @if (act.elegible_para_socios)', replacement + '\n                  @if (act.elegible_para_socios)')

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'w') as f:
    f.write(content)
