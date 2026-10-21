import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# Replace the TD inside @defer
old_td = """                    <!-- Left Axis (Day Name) -->
                    <td class="bg-white text-center align-top pt-4 sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; width: 120px;">
                      <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                      <small class="text-muted">{{ day.total }} ses.</small>
                    </td>"""

new_td = """                    <!-- Left Axis (Day Name) -->
                    <td class="bg-white text-center align-top p-0 sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; width: 120px;">
                      <div class="d-flex flex-column pt-4 w-100" style="position: sticky; top: 60px;">
                        <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                        <small class="text-muted">{{ day.total }} ses.</small>
                      </div>
                    </td>"""

html = html.replace(old_td, new_td)

# Replace the TD inside @placeholder
old_placeholder_td = """                  <tr style="height: 120px;">
                    <td class="bg-white text-center align-top pt-4 sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; width: 120px;">
                      <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                    </td>"""

new_placeholder_td = """                  <tr style="height: 120px;">
                    <td class="bg-white text-center align-top p-0 sticky-start border-end shadow-sm" style="left: 0; z-index: 1020; width: 120px;">
                      <div class="d-flex flex-column pt-4 w-100" style="position: sticky; top: 60px;">
                        <h6 class="mb-0 fw-bold text-dark">{{ day.nombre }}</h6>
                      </div>
                    </td>"""

html = html.replace(old_placeholder_td, new_placeholder_td)

with open(path, 'w') as f:
    f.write(html)
