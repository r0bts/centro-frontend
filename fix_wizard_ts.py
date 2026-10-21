import re
path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

# Add fields
ts = ts.replace(
    "monto: number | null = null;",
    "monto: number | null = null;\n  costo_interno: number | null = null;\n  profesor_id: number | null = null;"
)

# In patchForm
ts = ts.replace(
    "this.monto           = a.monto ?? null;",
    "this.monto           = a.monto ?? null;\n    this.costo_interno   = a.costo_interno ?? null;\n    this.profesor_id     = a.profesor_id ?? null;"
)

# In getBaseData
ts = ts.replace(
    "monto:           this.tiene_costo ? this.monto : null,",
    "monto:           this.tiene_costo ? this.monto : null,\n      costo_interno:   this.costo_interno,\n      profesor_id:     this.profesor_id,"
)

with open(path, 'w') as f:
    f.write(ts)
print("Updated wizard ts")
