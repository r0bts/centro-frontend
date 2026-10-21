path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_html = """<li class="dropdown-header text-uppercase text-muted mb-1 px-2" style="font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;">Resto de profesores</li>"""

new_html = """<li class="dropdown-header d-flex justify-content-between align-items-center mb-1 px-2" style="font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px;">
                      <span class="text-uppercase text-muted">Resto de profesores</span>
                      <span class="badge bg-light text-secondary border rounded-pill px-2">{{ profs.length }}</span>
                    </li>"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated Dropdown Header")
