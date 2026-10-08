import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# Change mb-2 to mb-1 for tighter vertical spacing
html = html.replace('mb-2">', 'mb-1">')
html = html.replace('mb-2" style', 'mb-1" style')
html = html.replace('mb-auto pb-2">', 'mb-auto pb-1">')
html = html.replace('mt-0 mb-2" style', 'mt-0 mb-1" style')
html = html.replace('padding: 1rem;', 'padding: 0.75rem;') # inline style override padding

# Make the icon slightly smaller
html = html.replace('width: 48px; height: 48px;', 'width: 40px; height: 40px;')
html = html.replace('font-size: 1.5rem;', 'font-size: 1.25rem;')

with open(html_path, 'w') as f:
    f.write(html)

scss_path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

scss = scss.replace('padding: 1rem;', 'padding: 0.75rem;')
scss = scss.replace('min-height: 100%;', 'min-height: 100px;') # for add-card

with open(scss_path, 'w') as f:
    f.write(scss)

print("Ultra shrink applied")
