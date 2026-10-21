import re

scss_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

target = """.wizard-container {
  background: #fff;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 850px;
  max-height: calc(100dvh - 3rem);
  display: flex;"""

replacement = """.wizard-container {
  background: #fff;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 850px;
  height: 80vh;
  min-height: 600px;
  max-height: 850px;
  display: flex;"""

scss = scss.replace(target, replacement)

with open(scss_path, 'w') as f:
    f.write(scss)
print("Updated modal height!")
