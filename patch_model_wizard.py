import re

model_path = 'src/app/models/deportivo/actividad.model.ts'
with open(model_path, 'r') as f:
    ts = f.read()

ts = ts.replace("lugar: string | null;            // texto libre (opcional)", "lugar: string | null;            // texto libre (opcional)\n  profesor_id: number | null;\n  costo_interno: number | null;")

with open(model_path, 'w') as f:
    f.write(ts)
print("Updated WizardHorario!")
