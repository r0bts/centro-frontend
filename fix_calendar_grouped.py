ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

import re

old_logic_pattern = re.compile(r'  calendarDays = computed\(\(\) => \{.*?(?=  filteredActividades = computed)', re.DOTALL)

new_logic = """  calendarDays = computed(() => {
    const list = this.filteredActividades();
    const days = [
      { dia: 1, nombre: 'Lunes', acts: [] as any[], total: 0 },
      { dia: 2, nombre: 'Martes', acts: [] as any[], total: 0 },
      { dia: 3, nombre: 'Miércoles', acts: [] as any[], total: 0 },
      { dia: 4, nombre: 'Jueves', acts: [] as any[], total: 0 },
      { dia: 5, nombre: 'Viernes', acts: [] as any[], total: 0 },
      { dia: 6, nombre: 'Sábado', acts: [] as any[], total: 0 },
      { dia: 7, nombre: 'Domingo', acts: [] as any[], total: 0 },
    ];

    for (const act of list) {
      if (!act.grupos_categorias) continue;
      
      const porDia: Record<number, any[]> = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[] };

      for (const gc of act.grupos_categorias) {
        if (!gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (!eq.horarios) continue;
          for (const h of eq.horarios) {
            if (porDia[h.dia_semana]) {
              porDia[h.dia_semana].push(h);
            }
          }
        }
      }

      for (const diaStr in porDia) {
        const dia = parseInt(diaStr);
        const horarios = porDia[dia];
        if (horarios.length > 0) {
          const day = days.find(d => d.dia === dia);
          if (day) {
            day.total += horarios.length;
            
            // Group identical time slots
            const slots: Record<string, any> = {};
            for (const h of horarios) {
               const key = `${h.hora_inicio}-${h.hora_fin}`;
               if (!slots[key]) {
                  slots[key] = { start: h.hora_inicio, end: h.hora_fin, count: 0 };
               }
               slots[key].count++;
            }
            
            day.acts.push({
               act,
               totalSesiones: horarios.length,
               slots: Object.values(slots).sort((a: any, b: any) => (a.start||'').localeCompare(b.start||''))
            });
          }
        }
      }
    }

    days.forEach(d => {
      d.acts.sort((a, b) => a.act.nombre.localeCompare(b.act.nombre));
    });

    return days;
  });

"""

ts = old_logic_pattern.sub(new_logic, ts)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Updated TS with grouped logic")
