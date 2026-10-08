import re

model_path = 'src/app/models/deportivo/actividad.model.ts'
with open(model_path, 'r') as f:
    ts = f.read()

# Add a few properties to the root models that the backend expects now
# 1. WizardHorario
ts = ts.replace("lugar?: string | null;", "lugar?: string | null;\n  profesor_id?: number | null;\n  costo_interno?: number | null;")

# 2. Update CreateActividadRequest and UpdateActividadRequest to include elegible_para_socios
# Because we restored from git which might not have it! Wait, let's check if elegible_para_socios is there.
if 'elegible_para_socios?: boolean' not in ts:
    ts = ts.replace("is_active?: boolean;", "is_active?: boolean;\n  elegible_para_socios?: boolean;")
    ts = ts.replace("is_active: boolean;", "is_active: boolean;\n  elegible_para_socios?: boolean;")

with open(model_path, 'w') as f:
    f.write(ts)
print("Updated models!")
