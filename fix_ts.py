ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

ts = ts.replace('this.svc.update(act.id, act).subscribe({', 'this.svc.update(act.id, act as any).subscribe({')

with open(ts_path, 'w') as f:
    f.write(ts)
print("Fixed TS")
