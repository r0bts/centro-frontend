path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

new_computed = """  timeTableHours = computed(() => {
    const days = this.calendarDays();
    const hoursMap = new Map<number, any>();

    // Initialize hours from 6 to 22
    for (let i = 6; i <= 22; i++) {
      hoursMap.set(i, {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] } as Record<number, any[]>
      });
    }

    // Assign sessions to the correct hour based on start time
    days.forEach(day => {
      day.sessions.forEach(session => {
        if (!session.start) return;
        const hour = parseInt(session.start.split(':')[0], 10);
        if (hoursMap.has(hour)) {
          hoursMap.get(hour)!.days[day.dia].push(session);
        } else {
          // If a class starts before 6 or after 22, add the row dynamically!
          hoursMap.set(hour, {
            hour,
            label: `${hour.toString().padStart(2, '0')}:00`,
            days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
          });
          hoursMap.get(hour)!.days[day.dia].push(session);
        }
      });
    });

    const sortedHours = Array.from(hoursMap.values()).sort((a, b) => a.hour - b.hour);
    
    // Sort sessions inside each cell by exact minute
    sortedHours.forEach(hRow => {
      for (let i = 1; i <= 7; i++) {
        hRow.days[i].sort((a: any, b: any) => (a.start || '').localeCompare(b.start || ''));
      }
    });

    return sortedHours;
  });"""

ts = ts.replace("  filteredActividades = computed(() => {", new_computed + "\n\n  filteredActividades = computed(() => {")

with open(path, 'w') as f:
    f.write(ts)
print("Added timeTableHours")
