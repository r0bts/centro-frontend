path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

group_fn = """  agruparPorDia(horarios: any[]): { dia: number; horarios: any[] }[] {
    if (!horarios) return [];
    const mapa = new Map<number, any[]>();
    for (const h of horarios) {
      if (!mapa.has(h.dia_semana)) mapa.set(h.dia_semana, []);
      mapa.get(h.dia_semana)!.push(h);
    }
    const result = Array.from(mapa.entries()).map(([dia, hrs]) => ({
      dia,
      horarios: hrs.sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
    }));
    result.sort((a, b) => a.dia - b.dia);
    return result;
  }

  daysMapping: Record<number, string> = {"""

ts = ts.replace("  daysMapping: Record<number, string> = {", group_fn)

with open(path, 'w') as f:
    f.write(ts)
print("Added agruparPorDia")
