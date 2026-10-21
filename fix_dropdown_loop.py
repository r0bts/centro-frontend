path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

html = html.replace("@for (profId of (isOpen ? profs : (profs | slice:2)); track profId) {", "@for (profId of profs; track profId) {")

with open(path, 'w') as f:
    f.write(html)
print("Fixed loop to always show all profs")
