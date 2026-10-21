import re

with open('src/app/models/deportivo/actividad.model.ts', 'r') as f:
    ts = f.read()

# Add to Actividad interface
ts = ts.replace('club_id: number;\n  nombre: string;', 'club_id: number;\n  profesor_id?: number | null;\n  nombre: string;')

# Add to CreateActividadRequest
ts = ts.replace('club_id: number;\n  nombre: string;', 'club_id: number;\n  profesor_id?: number | null;\n  nombre: string;')

# Add to UpdateActividadRequest
ts = ts.replace('nombre?: string;\n  descripcion?: string;', 'profesor_id?: number | null;\n  nombre?: string;\n  descripcion?: string;')

with open('src/app/models/deportivo/actividad.model.ts', 'w') as f:
    f.write(ts)
print("Patched models")
