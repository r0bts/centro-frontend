html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

html = html.replace('class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1 bg-white"', 'class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center gap-1"')

with open(html_path, 'w') as f:
    f.write(html)
print("Removed bg-white from button")
