import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# Replace col-12 col-sm-3 px-0 -> col-12 col-md-4 pe-3 pe-md-4
html = html.replace('col-12 col-sm-3 px-0', 'col-12 col-md-4 pe-2 pe-md-4')

# Replace col-12 col-sm-9 px-0 -> col-12 col-md-8 ps-0
html = html.replace('col-12 col-sm-9 px-0', 'col-12 col-md-8 ps-0')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
