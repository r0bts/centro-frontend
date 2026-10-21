import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# Pattern to remove everything from <!-- Profesor Asignado --> up to the end of the Step 2 div.
# We will just remove from <!-- Profesor Asignado --> up to just before </div><!-- FIN PASO 2 -->
pattern = r'<!-- Profesor Asignado -->.*?</div>\s*<!-- FIN PASO 2 -->'
replacement = '</div>\n          <!-- FIN PASO 2 -->'
html = re.sub(pattern, replacement, html, flags=re.DOTALL)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
print("Removed Step 2 blocks")
