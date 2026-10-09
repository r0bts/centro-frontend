import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

# Replace calendarDays logic to filter inner sessions
old_cal_days = """            let locName = 'Sin ubicación';
            if (h.area_id) {
              locName = areas.find(a => a.area_id === h.area_id)?.area_name || locName;
            } else if (h.lugar) {
              locName = h.lugar;
            } else if (clubName) {
              locName = clubName;
            }

            day.sessions.push({"""

new_cal_days = """            let locName = 'Sin ubicación';
            if (h.area_id) {
              locName = areas.find(a => a.area_id === h.area_id)?.area_name || locName;
            } else if (h.lugar) {
              locName = h.lugar;
            } else if (clubName) {
              locName = clubName;
            }

            const areaF = this.filterArea();
            if (areaF && locName !== areaF) continue;

            const pId = this.filterProfesorId();
            const profId = h.profesor_id || eq.coach_id || act.profesor_id;
            if (pId && profId !== pId) continue;

            day.sessions.push({"""

ts = ts.replace(old_cal_days, new_cal_days)

# Replace ganttBounds logic to use calendarDays!
old_gantt_bounds = """  ganttBounds = computed(() => {
    let minH = 24;
    let maxH = 0;
    let hasClasses = false;
    
    const acts = this.filteredActividades();
    for (const act of acts) {
      for (const cat of act.grupos_categorias || []) {
        for (const eq of cat.equipos || []) {
          for (const hor of eq.horarios || []) {
            if (hor.hora_inicio && hor.hora_fin) {
              const sh = parseInt(hor.hora_inicio.split(':')[0], 10);
              const eh = parseInt(hor.hora_fin.split(':')[0], 10);
              if (!isNaN(sh)) {
                if (sh < minH) minH = sh;
              }
              if (!isNaN(eh)) {
                const em = parseInt(hor.hora_fin.split(':')[1], 10) || 0;
                const effectiveEh = (em === 0 && eh > 0) ? eh - 1 : eh;
                if (effectiveEh > maxH) maxH = effectiveEh;
              }
              hasClasses = true;
            }
          }
        }
      }
    }"""

new_gantt_bounds = """  ganttBounds = computed(() => {
    let minH = 24;
    let maxH = 0;
    let hasClasses = false;
    
    const days = this.calendarDays();
    for (const day of days) {
      for (const session of day.sessions) {
        if (session.start && session.end) {
          const sh = parseInt(session.start.split(':')[0], 10);
          const eh = parseInt(session.end.split(':')[0], 10);
          if (!isNaN(sh)) {
            if (sh < minH) minH = sh;
          }
          if (!isNaN(eh)) {
            const em = parseInt(session.end.split(':')[1], 10) || 0;
            const effectiveEh = (em === 0 && eh > 0) ? eh - 1 : eh;
            if (effectiveEh > maxH) maxH = effectiveEh;
          }
          hasClasses = true;
        }
      }
    }"""

ts = ts.replace(old_gantt_bounds, new_gantt_bounds)

with open(path, 'w') as f:
    f.write(ts)
