path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_fn = """  agruparPorDia(horarios: any[]): { dia: number; horarios: any[] }[] {
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
  }"""

new_fn = """  agruparPorDia(horarios: any[]): any[] {
    if (!horarios) return [];
    
    // Group by Day
    const mapaDia = new Map<number, any[]>();
    for (const h of horarios) {
      if (!mapaDia.has(h.dia_semana)) mapaDia.set(h.dia_semana, []);
      mapaDia.get(h.dia_semana)!.push(h);
    }
    
    const result = Array.from(mapaDia.entries()).map(([dia, hrs]) => {
      // Group by Professor within the day
      const mapaProf = new Map<number, any[]>();
      for (const h of hrs) {
        const pId = h.profesor_id || 0;
        if (!mapaProf.has(pId)) mapaProf.set(pId, []);
        mapaProf.get(pId)!.push(h);
      }
      
      const profesores = Array.from(mapaProf.entries()).map(([pId, p_hrs]) => {
        p_hrs.sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
        
        const minHora = p_hrs[0].hora_inicio ? p_hrs[0].hora_inicio.substring(0,5) : '';
        const maxHora = p_hrs[p_hrs.length - 1].hora_fin ? p_hrs[p_hrs.length - 1].hora_fin.substring(0,5) : '';
        const rango_horas = `${minHora} - ${maxHora}`;
        
        return {
          profesor_id: pId,
          profesor_nombre: pId ? this.getInstructorName(pId, true) : 'Sin asignar',
          rango_horas: rango_horas,
          horarios: p_hrs
        };
      });
      
      profesores.sort((a, b) => a.horarios[0].hora_inicio.localeCompare(b.horarios[0].hora_inicio));

      return {
        dia,
        profesores
      };
    });
    
    result.sort((a, b) => a.dia - b.dia);
    return result;
  }"""

ts = ts.replace(old_fn, new_fn)

with open(path, 'w') as f:
    f.write(ts)
print("Updated agruparPorDia for Professor grouping")
