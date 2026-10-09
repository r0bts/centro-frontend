import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

# 1. Add ganttBounds computed
gantt_bounds_code = """
  ganttBounds = computed(() => {
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
    }
    
    if (!hasClasses) {
      minH = 6; maxH = 21;
    } else {
      minH = Math.max(0, minH - 1);
      maxH = Math.min(23, maxH + 1);
    }
    
    const hours = [];
    for (let i = minH; i <= maxH; i++) {
      hours.push(i);
    }
    
    return {
      minHour: minH,
      maxHour: maxH,
      hours: hours
    };
  });

  getGridColumn(start: string, end: string): string {"""

ts = ts.replace("  getGridColumn(start: string, end: string): string {", gantt_bounds_code)

# 2. Update getGridColumn to use minHour
old_get_grid = """  getGridColumn(start: string, end: string): string {
    if (!start || !end) return '1 / span 2';
    
    const parseTime = (time: string) => {
      const parts = time.split(':');
      return parseInt(parts[0], 10) * 2 + (parseInt(parts[1], 10) >= 30 ? 1 : 0);
    };

    const startIdx = parseTime(start);
    let endIdx = parseTime(end);
    if (endIdx <= startIdx) endIdx = startIdx + 1; // min 30 mins
    
    // Convert 0-indexed half-hours to 1-indexed CSS grid columns
    return `${startIdx + 1} / ${endIdx + 1}`;
  }"""

new_get_grid = """  getGridColumn(start: string, end: string): string {
    if (!start || !end) return '1 / span 2';
    
    const minH = this.ganttBounds().minHour;
    
    const parseTime = (time: string) => {
      const parts = time.split(':');
      return parseInt(parts[0], 10) * 2 + (parseInt(parts[1], 10) >= 30 ? 1 : 0);
    };

    let startIdx = parseTime(start) - (minH * 2);
    let endIdx = parseTime(end) - (minH * 2);
    
    if (startIdx < 0) startIdx = 0; // Guard against events starting before minH
    if (endIdx <= startIdx) endIdx = startIdx + 1; // min 30 mins
    
    // Convert 0-indexed half-hours to 1-indexed CSS grid columns
    return `${startIdx + 1} / ${endIdx + 1}`;
  }"""

ts = ts.replace(old_get_grid, new_get_grid)

with open(path, 'w') as f:
    f.write(ts)

