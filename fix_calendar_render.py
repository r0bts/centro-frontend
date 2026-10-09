path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_loop = """                @for (session of day.sessions; track session.id) {
                  @defer (on viewport) {"""

new_loop = """                @for (session of day.sessions; track $index) {
                  @defer (on viewport) {"""

html = html.replace(old_loop, new_loop)

old_placeholder = """                  } @placeholder {
                    <div style="height: 120px; border-radius: 6px;" class="bg-white border-0 shadow-sm opacity-50 mb-2"></div>
                  }"""

new_placeholder = """                  } @placeholder {
                    <div class="card border-0 shadow-sm session-card mb-2" style="height: 100px;">
                      <div class="card-body placeholder-glow p-2">
                        <span class="placeholder col-8 mb-2"></span>
                        <span class="placeholder col-4 mb-2"></span>
                        <span class="placeholder col-10"></span>
                      </div>
                    </div>
                  }"""

html = html.replace(old_placeholder, new_placeholder)

with open(path, 'w') as f:
    f.write(html)
print("Updated HTML to track $index and fix placeholder")
