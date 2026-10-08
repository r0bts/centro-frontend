html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

html = html.replace('<span>Todas las unidades</span>', '<span>{{ act.club?.nombre || \'Todas las sedes\' }}</span>')

with open(html_path, 'w') as f:
    f.write(html)

print("Updated HTML with dynamic club name")
