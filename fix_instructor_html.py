path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

html = html.replace('{{ p.name }} {{ p.last_name }}</option>', '{{ p.full_name }}</option>')

with open(path, 'w') as f:
    f.write(html)
