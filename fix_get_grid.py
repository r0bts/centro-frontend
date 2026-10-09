import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

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
