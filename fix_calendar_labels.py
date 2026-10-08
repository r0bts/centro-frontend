html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

html = html.replace('{{ day.eventos.length }} act.</small>', '{{ day.eventos.length }} sesiones</small>')

with open(html_path, 'w') as f:
    f.write(html)
print("Updated label to sesiones")
