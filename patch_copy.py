import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

html = html.replace('¿Costo extra al socio?', '¿Costo de clase para el socio?')
html = html.replace('Monto a cobrar al socio <span', 'Costo para el socio <span')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
