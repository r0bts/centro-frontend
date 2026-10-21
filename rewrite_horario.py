import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# I will replace everything from `<div class="row g-3">` under the Horarios section
# up to the end of the `col-12` loop that renders the days.
start_marker = '<div class="row g-3">'
end_marker = '<!-- ════ PASO 4: Evaluación ════ -->' # wait, it was renamed to PASO 5: Evaluación!

# Let's check where the end of the Horarios section is.
