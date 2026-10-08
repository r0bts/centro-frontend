import re

ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Fix the broken imports
ts = ts.replace("import { computed,  FormsModule }", "import { FormsModule }")
ts = ts.replace("import { computed, \n  Component,", "import { computed, \n  Component,")
ts = ts.replace("import { computed,  CommonModule }", "import { CommonModule }")
ts = ts.replace("import { computed,  ActividadService }", "import { ActividadService }")
ts = ts.replace("import { computed,  AuthService }", "import { AuthService }")
ts = ts.replace("import { computed,  Actividad, ActividadFormData }", "import { Actividad, ActividadFormData }")
ts = ts.replace("import { computed,  ActividadWizardComponent }", "import { ActividadWizardComponent }")

with open(ts_path, 'w') as f:
    f.write(ts)
print("Fixed imports!")
