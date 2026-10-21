path_scss = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(path_scss, 'a') as f:
    f.write("\n.clear-search-icon {\n  cursor: pointer;\n  pointer-events: auto;\n  font-size: 0.85rem;\n  z-index: 10;\n  transition: color 0.15s ease-in-out;\n\n  &:hover {\n    color: var(--bs-danger) !important;\n  }\n}\n")

path_html = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path_html, 'r') as f:
    html = f.read()

old_html = """style="cursor: pointer; font-size: 0.85rem; z-index: 4;" (click)="filterNombre.set('')"></i>"""
new_html = """class="clear-search-icon bi bi-x-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted" (click)="filterNombre.set('')"></i>"""

html = html.replace('class="bi bi-x-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 text-muted" style="cursor: pointer; font-size: 0.85rem; z-index: 4;" (click)="filterNombre.set(\'\')"></i>', new_html)

with open(path_html, 'w') as f:
    f.write(html)
print("Updated search icon HTML/CSS")
