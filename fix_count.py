html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

old_header = '<h4 class="mb-0 fw-bold">Actividades</h4>'
new_header = """<h4 class="mb-0 fw-bold d-flex align-items-center gap-2">
        Actividades
        @if (!loading()) {
          <span class="badge bg-light text-secondary border fw-normal rounded-pill" style="font-size: 0.85rem; padding: 0.35em 0.65em;">{{ filteredActividades().length }}</span>
        }
      </h4>"""

if old_header in html:
    html = html.replace(old_header, new_header)
    with open(html_path, 'w') as f:
        f.write(html)
    print("Updated header with count")
else:
    print("Could not find old header")

