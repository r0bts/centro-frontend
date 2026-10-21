path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

helper_fn = """  formatHora(hora: string): string {
    if (!hora) return '';
    const parts = hora.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  getGridColumn(start: string, end: string): string {
    if (!start || !end) return '1 / span 2';
    
    const parseTime = (time: string) => {
      const parts = time.split(':');
      return parseInt(parts[0], 10) * 2 + (parseInt(parts[1], 10) >= 30 ? 1 : 0);
    };

    let startIdx = parseTime(start);
    let endIdx = parseTime(end);

    if (endIdx <= startIdx) {
      if (endIdx === 0) endIdx = 48; // Midnight of next day
      else endIdx = startIdx + 2; // Default 1 hour fallback
    }

    const span = Math.max(1, endIdx - startIdx);
    return `${startIdx + 1} / span ${span}`;
  }"""

ts = ts.replace("  formatHora(hora: string): string {\n    if (!hora) return '';\n    const parts = hora.split(':');\n    return `${parts[0]}:${parts[1]}`;\n  }", helper_fn)

with open(path, 'w') as f:
    f.write(ts)
print("Added getGridColumn helper")
