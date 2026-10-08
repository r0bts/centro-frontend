ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

ts = ts.replace("onKeydownHandler(event: KeyboardEvent)", "onKeydownHandler(event: Event)")

with open(ts_path, 'w') as f:
    f.write(ts)
print("Fixed type")
