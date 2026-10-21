import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

target = 'type="time" class="form-control form-control-sm" style="width: 110px;"'
replacement = 'type="time" class="form-control form-control-sm" style="width: 135px;"'

if target in html:
    html = html.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
        f.write(html)
    print("Success")
else:
    print("Not found")
