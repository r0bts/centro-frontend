import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Remove my injected methods
ts = ts.replace("  diaReplicando = signal<number | null>(null);\n\n  iniciarReplica(dia: number): void {\n    this.diaReplicando.set(dia);\n    this.diasParaReplicar.set([]);\n  }", "")
ts = ts.replace("  getHorariosByDia(grupoIdx: number, dia: number) {\n    return this.grupos()[grupoIdx]?.horarios\n      .map((item, index) => ({ item, originalIndex: index }))\n      .filter(x => x.item.dia_semana === dia) ?? [];\n  }", "")
# Wait, getHorariosByDia IS missing? Let's check if they had getHorariosByDia
