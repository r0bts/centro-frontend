import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

target = '<span class="badge bg-success-subtle text-success">Vigente</span>'
replacement = '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fw-medium" style="font-size: 0.75rem;"><i class="bi bi-check-circle-fill me-1"></i> Vigente</span>'

# Also add align-middle to the table
html = html.replace('<table class="table table-sm mb-0 bg-white" style="font-size: 0.85rem;">', '<table class="table table-sm mb-0 bg-white align-middle" style="font-size: 0.85rem;">')

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success replacing badge.")
else:
    print("Target badge not found.")
