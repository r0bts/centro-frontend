import re

# 1. Update HTML
html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Remove the description
html = re.sub(r'<p class="text-muted small mb-0" style="font-size: 0.85rem;">\{\{ act\.descripcion \|\| \'Sin descripción\' \}\}</p>', '', html)

with open(html_path, 'w') as f:
    f.write(html)

# 2. Update SCSS
scss_path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

scss = scss.replace('min-height: 220px;', 'min-height: 160px;')
scss = scss.replace('min-height: 180px;', 'min-height: 160px;') # for add-card

with open(scss_path, 'w') as f:
    f.write(scss)

print("Fixed height and description")
