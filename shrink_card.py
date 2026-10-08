import re

# Update HTML
html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace padding 1.25rem with 1rem
html = html.replace('padding: 1.25rem;', 'padding: 1rem;')

# Replace mb-3 with mb-2 for tighter spacing
html = html.replace('mb-3">\n            <h6', 'mb-2">\n            <h6')
html = html.replace('mb-3" style="font-size: 0.85rem;', 'mb-2" style="font-size: 0.85rem;')
html = html.replace('mb-auto pb-3">', 'mb-auto pb-2">')
html = html.replace('mt-0 mb-3" style="', 'mt-0 mb-2" style="')

with open(html_path, 'w') as f:
    f.write(html)

# Update SCSS
scss_path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

scss = scss.replace('min-height: 160px;', 'min-height: auto;')
scss = scss.replace('padding: 1.25rem;', 'padding: 1rem;')

with open(scss_path, 'w') as f:
    f.write(scss)

print("Card height reduced")
