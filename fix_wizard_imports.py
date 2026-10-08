path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

# Fix interface implementation
ts = ts.replace("implements OnInit {", "implements OnInit, DoCheck {")

# Fix imports
if "DoCheck" not in ts[:500]:
    ts = ts.replace("OnInit,", "OnInit, DoCheck,")

with open(path, 'w') as f:
    f.write(ts)
print("Fixed imports")
