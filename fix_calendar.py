path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_calendar = """  calendarDays = computed(() => {
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
  });"""

new_calendar = """  calendarDays = computed(() => {
    const list = this.filteredActividades();
    const instructores = this.formData()?.instructores || [];
    const areas = this.formData()?.areas_mapeadas || [];
    const clubes = this.formData()?.acceso_clubes || [];

    const days = [
      { dia: 1, nombre: 'Lunes', sessions: [] as any[], total: 0 },
      { dia: 2, nombre: 'Martes', sessions: [] as any[], total: 0 },
      { dia: 3, nombre: 'Miércoles', sessions: [] as any[], total: 0 },
      { dia: 4, nombre: 'Jueves', sessions: [] as any[], total: 0 },
      { dia: 5, nombre: 'Viernes', sessions: [] as any[], total: 0 },
      { dia: 6, nombre: 'Sábado', sessions: [] as any[], total: 0 },
      { dia: 7, nombre: 'Domingo', sessions: [] as any[], total: 0 },
    ];

    for (const act of list) {
      if (!act.grupos_categorias) continue;
      
      const clubName = clubes.find(c => c.id === act.club_id)?.name || null;

      for (const gc of act.grupos_categorias) {
        if (!gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (!eq.horarios) continue;
          for (const h of eq.horarios) {
            const day = days.find(d => d.dia === h.dia_semana);
            if (!day) continue;

            const profId = h.profesor_id || eq.coach_id || act.profesor_id;
            const profName = instructores.find(i => i.id === profId)?.full_name || 'Sin asignar';

            let locName = 'Sin ubicación';
            if (h.area_id) {
              locName = areas.find(a => a.area_id === h.area_id)?.area_name || locName;
            } else if (h.lugar) {
              locName = h.lugar;
            } else if (clubName) {
              locName = clubName;
            }

            day.sessions.push({
              id: `${act.id}-${gc.id}-${eq.id}-${h.id}`,
              actId: act.id,
              actNombre: act.nombre,
              actIcono: act.icono || '🏆',
              actColor: eq.color || act.color || '#6366f1',
              grupoNombre: gc.nombre + (eq.nombre !== 'General' ? ` - ${eq.nombre}` : ''),
              start: h.hora_inicio,
              end: h.hora_fin,
              profesor: profName,
              ubicacion: locName,
              actRef: act // para poder abrir offcanvas/editar
            });
            day.total++;
          }
        }
      }
    }

    days.forEach(d => {
      d.sessions.sort((a, b) => {
        const timeDiff = (a.start || '').localeCompare(b.start || '');
        if (timeDiff !== 0) return timeDiff;
        return a.actNombre.localeCompare(b.actNombre);
      });
    });

    return days;
  });"""

ts = ts.replace(old_calendar, new_calendar)

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS calendar logic")
