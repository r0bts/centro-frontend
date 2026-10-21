import re

with open('src/app/models/deportivo/actividad.model.ts', 'r') as f:
    ts = f.read()

# Remove from Actividad
ts = re.sub(r'\s*profesor_id\?: number \| null;', '', ts)
ts = re.sub(r'\s*costo_interno\?: number \| null;', '', ts)

# Add to HorarioEntrenamiento
ts = ts.replace('area_id?: number | null;         // FK → areas.id', 'area_id?: number | null;         // FK → areas.id\n  profesor_id?: number | null;\n  costo_interno?: number | null;')

# Add to CreateHorarioRequest
ts = ts.replace('area_id?: number | null;', 'area_id?: number | null;\n  profesor_id?: number | null;\n  costo_interno?: number | null;')

# Update WizardHorario
ts = ts.replace('area_id: number | null;          // FK → areas.id (solo áreas con layout mapeado)', 'area_id: number | null;          // FK → areas.id\n  profesor_id: number | null;\n  costo_interno: number | null;')

with open('src/app/models/deportivo/actividad.model.ts', 'w') as f:
    f.write(ts)
print("Patched interfaces")
