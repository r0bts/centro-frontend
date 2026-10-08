import re

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'r') as f:
    html = f.read()

# Remove the cost blocks
pattern = r'@if \(act\.costo_interno\) \{.*?\n\s*\}'
html = re.sub(pattern, '', html, flags=re.DOTALL)

with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'w') as f:
    f.write(html)
print("Patched deportivo")
