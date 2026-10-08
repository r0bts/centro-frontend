import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

methods = """
  // ── Replicar y Horarios ──────────────────────────────────────────────────
  getHorariosByDia(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(x => x.item.dia_semana === dia) ?? [];
  }

  diaReplicando = signal<number | null>(null);
  diasParaReplicar = signal<number[]>([]);

  iniciarReplica(dia: number): void {
    this.diaReplicando.set(dia);
    this.diasParaReplicar.set([]);
  }

  cerrarReplicar(): void {
    this.diaReplicando.set(null);
    this.diasParaReplicar.set([]);
  }

  toggleDiaReplica(dia: number, checked: boolean): void {
    this.diasParaReplicar.update((list: number[]) =>
      checked ? [...list, dia] : list.filter((d: number) => d !== dia)
    );
  }

  isDiaParaReplicar(dia: number): boolean {
    return this.diasParaReplicar().includes(dia);
  }

  tieneDestinosConConflicto(grupoIdx: number): boolean {
    const destinos = this.diasParaReplicar();
    return destinos.some(d => this.isDiaSelected(grupoIdx, d));
  }

  aplicarReplica(grupoIdx: number, diaFuente: number): void {
    const destinos = this.diasParaReplicar();
    if (!destinos.length) return;

    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: g.horarios.map(h => ({ ...h })) }));
      const fuente = copy[grupoIdx].horarios.filter(h => h.dia_semana === diaFuente);

      for (const dest of destinos) {
        // Quitar horarios del día destino
        copy[grupoIdx].horarios = copy[grupoIdx].horarios.filter(h => h.dia_semana !== dest);
        // Copiar los del fuente con el día destino
        for (const h of fuente) {
          copy[grupoIdx].horarios.push({ ...h, dia_semana: dest });
        }
      }
      copy[grupoIdx].horarios.sort((a, b) => a.dia_semana - b.dia_semana);
      return copy;
    });

    this.cerrarReplicar();
  }
"""

# Replace the last } with the methods + }
last_brace_idx = ts.rfind('}')
if last_brace_idx != -1:
    ts = ts[:last_brace_idx] + methods + '\n}\n'

with open(ts_path, 'w') as f:
    f.write(ts)
print("Forced append!")
