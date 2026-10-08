import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

pattern = r'\s*<!-- Instructor del grupo -->\s*<div class="mb-3">\s*<label class="form-label small fw-semibold">Instructor asignado</label>.*?</select>\s*(?:@if \(formData\(\)\?\.instructores\?\.length === 0\) \{\s*<small class="text-muted">No hay instructores registrados aún\.</small>\s*\})?\s*</div>'

html = re.sub(pattern, '', html, flags=re.DOTALL)

with open(html_path, 'w') as f:
    f.write(html)
print("Removed duplicate instructor!")
