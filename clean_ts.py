ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

bad_ts = """  diaReplicando = signal<number | null>(null);

  iniciarReplica(dia: number): void {
    this.diaReplicando.set(dia);
    this.diasParaReplicar.set([]);
  }"""
ts = ts.replace(bad_ts, "")

with open(ts_path, 'w') as f:
    f.write(ts)
print("Cleaned TS")
