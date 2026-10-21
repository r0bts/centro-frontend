import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

old_time = """  timeTableHours = computed(() => {
    const days = this.calendarDays();
    const hoursMap = new Map<number, any>();

    // Initialize hours from 6 to 22
    for (let i = 6; i <= 22; i++) {
      hoursMap.set(i, {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] } as Record<number, any[]>
      });
    }"""

new_time = """  timeTableHours = computed(() => {
    const days = this.calendarDays();
    const bounds = this.ganttBounds();
    const hoursMap = new Map<number, any>();

    // Initialize hours dynamically based on bounds
    for (const i of bounds.hours) {
      hoursMap.set(i, {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] } as Record<number, any[]>
      });
    }"""

ts = ts.replace(old_time, new_time)

with open(path, 'w') as f:
    f.write(ts)
