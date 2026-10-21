path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_card = """<div class="card border-0 shadow-sm session-card position-relative overflow-hidden mb-2" [style.border-left]="'4px solid ' + session.actColor" """
new_card = """<div class="card border-0 shadow-sm session-card position-relative flex-shrink-0 mb-2" [style.border-left]="'4px solid ' + session.actColor" """

html = html.replace(old_card, new_card)

with open(path, 'w') as f:
    f.write(html)
print("Fixed flexbox squish bug")
