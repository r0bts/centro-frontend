path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

ts = ts.replace(
    "costo_interno: a.costo_interno ?? g.equipos?.[0]?.horarios?.[0]?.costo_interno ?? null,",
    "costo_interno: act.costo_interno ?? g.equipos?.[0]?.horarios?.[0]?.costo_interno ?? null,"
)

with open(path, 'w') as f:
    f.write(ts)
print("Fixed variable name to act")
