import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

old_func_pattern = r"  getGridColumn\(start: string, end: string\): string \{.*?\n  \}"

new_func = """  getGridColumn(start: string, end: string): string {
    if (!start || !end) return '1 / span 2';
    
    const minH = this.ganttBounds().minHour;
    
    const parseTime = (time: string) => {
      const parts = time.split(':');
      return parseInt(parts[0], 10) * 2 + (parseInt(parts[1], 10) >= 30 ? 1 : 0);
    };

    let startIdx = parseTime(start) - (minH * 2);
    let endIdx = parseTime(end) - (minH * 2);

    if (startIdx < 0) startIdx = 0;
    if (endIdx <= startIdx) {
      if (endIdx === -(minH * 2)) endIdx = (24 - minH) * 2; // Midnight fallback
      else endIdx = startIdx + 2; // Default 1 hour fallback
    }

    const span = Math.max(1, endIdx - startIdx);
    return `${startIdx + 1} / span ${span}`;
  }"""

ts = re.sub(old_func_pattern, new_func, ts, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(ts)
