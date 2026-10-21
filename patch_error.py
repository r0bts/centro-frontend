import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

ts = ts.replace("Debes ingresar el monto a cobrar al socio.", "Debes ingresar el costo para el socio.")

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
    f.write(ts)
