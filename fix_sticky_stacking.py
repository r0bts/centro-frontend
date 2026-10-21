path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_loop = """        @for (g of selectedActividadForHorarios()!.grupos_categorias || []; track g.id) {
          @for (e of g.equipos || []; track e.id) {
            
            <!-- SEPARADOR DE EQUIPO (Nivel 1) -->"""

new_loop = """        @for (g of selectedActividadForHorarios()!.grupos_categorias || []; track g.id) {
          @for (e of g.equipos || []; track e.id) {
            <div class="equipo-section-wrapper">
            <!-- SEPARADOR DE EQUIPO (Nivel 1) -->"""

html = html.replace(old_loop, new_loop)

old_end = """            </div>
          }
        }
      </div>
    </div>
  }"""

new_end = """            </div>
            </div>
          }
        }
      </div>
    </div>
  }"""

html = html.replace(old_end, new_end)

with open(path, 'w') as f:
    f.write(html)
print("Updated sticky stacking")
