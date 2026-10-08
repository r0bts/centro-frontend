import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    scss = f.read()

target = 'max-height: calc(100dvh - 3rem);'
replacement = 'height: 750px;\n  max-height: calc(100dvh - 3rem);'

if target in scss:
    scss = scss.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
        f.write(scss)
    print("Patched!")
else:
    print("Not found")
