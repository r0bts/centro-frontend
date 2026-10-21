import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# We need to remove from: <!-- Profesor Asignado --> up to the hr.
pattern = r'<!-- Profesor Asignado -->.*?<hr class="my-4">'
html = re.sub(pattern, '', html, flags=re.DOTALL)

# But wait, the <hr class="my-4"> might be below. Let's look at the actual HTML.
