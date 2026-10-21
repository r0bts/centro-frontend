import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    scss = f.read()

# Fix the overlay
scss = scss.replace('align-items: center;', 'align-items: flex-start;')

# Fix the container margin
target_margin = 'margin: auto;'
replacement_margin = 'margin: 5vh auto auto auto;'
if target_margin in scss:
    scss = scss.replace(target_margin, replacement_margin)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
    f.write(scss)
print("Patched!")
