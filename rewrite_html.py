import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# 1. Step 2 (Costos y Mensajería)
# We need to ensure Elegibilidad is 2 columns, Mensajería is 2 columns.
# We also need to add "Elegibilidad" to Step 2 if it's missing in the git version.
# Actually, the git version might already have Elegibilidad? Let's look at git version of Step 2.

