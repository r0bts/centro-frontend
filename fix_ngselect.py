path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

# remove appendTo="body"
html = html.replace('appendTo="body"', '')

with open(path, 'w') as f:
    f.write(html)
print("Removed appendTo='body'")
