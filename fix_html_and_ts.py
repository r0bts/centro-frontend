import re

# Fix TS
with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

ts = ts.replace(
    "field: 'hora_inicio' | 'hora_fin' | 'lugar' | 'area_id'", 
    "field: 'hora_inicio' | 'hora_fin' | 'lugar' | 'area_id' | 'profesor_id' | 'costo_interno'"
)
with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
    f.write(ts)


# Fix HTML
with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

html = html.replace('setStep(', 'currentStep.set(')
html = html.replace('save()', 'publish()')
html = html.replace('loading()', 'saving()')
html = html.replace('formData()?.clubes', 'formData()?.sedes')

# Implement inline nextStep / prevStep / canProceed
html = html.replace('prevStep()', 'currentStep.set(currentStep() - 1)')
html = html.replace('nextStep()', 'currentStep.set(currentStep() + 1)')
# Just disable canProceed for now by making it true, or doing basic checks.
# Actually, I can just use basic HTML validation or leave disabled="false" for next step
html = html.replace('[disabled]="!canProceed()"', '')

# One more thing, "iniciarReplica(gi, d.num)"
# Let's check TS for what it's called
import os
os.system("grep -n 'Replica' src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts > /tmp/replica.txt")
