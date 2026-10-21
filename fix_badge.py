import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Pattern to find and remove the badge
badge_pattern = r'<span class="badge bg-primary fs-6 rounded">\{\{\s*d\.label\.substring\(0,2\)\s*\}\}</span>'
html = re.sub(badge_pattern, '', html)

with open(html_path, 'w') as f:
    f.write(html)
print("Removed redundant badge!")
