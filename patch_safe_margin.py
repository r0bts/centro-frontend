import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    scss = f.read()

scss = scss.replace('margin: 5vh auto auto auto;', 'margin: 0 auto auto auto;')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
    f.write(scss)
print("Patched safe margin")
