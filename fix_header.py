path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_header = """            <!-- SEPARADOR DE EQUIPO (Nivel 1) -->
            <div class="bg-dark text-white px-3 py-2 sticky-top d-flex justify-content-between align-items-center shadow-sm" style="z-index: 10;">
              <div class="fw-medium" style="font-size: 0.85rem; letter-spacing: 0.5px;">
                <i class="bi bi-diagram-3 me-2 opacity-75"></i>
                <span class="opacity-75">{{ g.nombre }}</span> <i class="bi bi-chevron-right mx-1" style="font-size: 0.6rem;"></i> <strong>{{ e.nombre }}</strong>
              </div>
            </div>"""

new_header = """            <!-- SEPARADOR DE EQUIPO (Nivel 1) -->
            <div class="bg-dark text-white px-3 py-2 sticky-top shadow-sm" style="z-index: 10; line-height: 1.4;">
              <div class="fw-medium d-flex align-items-start gap-2" style="font-size: 0.85rem; letter-spacing: 0.5px;">
                <i class="bi bi-diagram-3 opacity-75" style="margin-top: 2px;"></i>
                <div class="text-wrap">
                  <span class="opacity-75">{{ g.nombre }}</span> 
                  <i class="bi bi-chevron-right mx-1" style="font-size: 0.6rem;"></i> 
                  <strong>{{ e.nombre }}</strong>
                </div>
              </div>
            </div>"""

html = html.replace(old_header, new_header)

with open(path, 'w') as f:
    f.write(html)
print("Updated header wrap")
