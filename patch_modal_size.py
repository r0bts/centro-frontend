import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    scss = f.read()

target = """  max-width: 800px;
  height: 750px;
  max-height: calc(100dvh - 3rem);"""

replacement = """  max-width: 900px;
  height: calc(100dvh - 3rem);
  max-height: 850px;"""

if target in scss:
    scss = scss.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
        f.write(scss)
    print("Patched modal size")
else:
    print("Target not found")
