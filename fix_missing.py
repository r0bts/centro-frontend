import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

missing_methods = """
  getHorariosByDia(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(x => x.item.dia_semana === dia) ?? [];
  }

  diaReplicando = signal<number | null>(null);

  iniciarReplica(dia: number): void {
    this.diaReplicando.set(dia);
    this.diasParaReplicar.set([]);
  }
"""

# Let's just put them right before `cerrarReplicar(): void {`
if 'cerrarReplicar(): void {' in ts:
    ts = ts.replace('cerrarReplicar(): void {', missing_methods + '\n  cerrarReplicar(): void {')
    with open(ts_path, 'w') as f:
        f.write(ts)
    print("Fixed missing methods!")
else:
    print("Could not find cerrarReplicar")
