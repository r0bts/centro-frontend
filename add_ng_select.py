path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

# Add import
if "NgSelectModule" not in ts:
    ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\nimport { NgSelectModule } from '@ng-select/ng-select';")
    ts = ts.replace("imports: [CommonModule, FormsModule],", "imports: [CommonModule, FormsModule, NgSelectModule],")

with open(path, 'w') as f:
    f.write(ts)
print("Added NgSelectModule")
