import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# Replace the grid container completely using regex to be safe
pattern = r'<div class="[^"]*" style="display: grid; grid-template-columns: repeat\(48, 60px\);[^"]*">'
replacement = '<div class="py-1 px-0 position-relative" style="display: grid; grid-template-columns: repeat(48, 60px); grid-auto-rows: min-content; row-gap: 4px; column-gap: 0; min-height: 60px;">'

html = re.sub(pattern, replacement, html)

with open(path, 'w') as f:
    f.write(html)
print("Replaced grid container with regex!")
