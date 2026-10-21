import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# Fixes in HTML
html = html.replace('setStep(', 'currentStep.set(')
html = html.replace('formData()?.clubes', 'formData()?.sedes')
html = html.replace('prevStep()', 'currentStep.set(currentStep() - 1)')
html = html.replace('nextStep()', 'currentStep.set(currentStep() + 1)')
html = html.replace('!canProceed()', 'false')
html = html.replace('save()', 'publish()')
html = html.replace('loading()', 'saving()')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)

with open('src/app/models/deportivo/actividad.model.ts', 'r') as f:
    ts = f.read()

# Ensure CreateActividadRequest has elegible_para_socios
if 'elegible_para_socios?: boolean;' not in ts:
    ts = ts.replace('is_active?:       boolean;', 'is_active?:       boolean;\n  elegible_para_socios?: boolean;')
    with open('src/app/models/deportivo/actividad.model.ts', 'w') as f:
        f.write(ts)

print("Fixed HTML and model.")
