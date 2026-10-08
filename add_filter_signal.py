path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

# Add the signal declaration
ts = ts.replace("filterHorario = signal<string>('');", "filterNombre  = signal<string>('');\n  filterHorario = signal<string>('');")

# Add the filter logic
old_filter = """    let list = this.actividades();
    const cId = this.filterClubId();
    const aId = this.filterAreaId();
    const searchH = this.filterHorario()?.toLowerCase().trim();

    if (cId) {"""

new_filter = """    let list = this.actividades();
    const qName = this.filterNombre()?.toLowerCase().trim();
    const cId = this.filterClubId();
    const aId = this.filterAreaId();
    const searchH = this.filterHorario()?.toLowerCase().trim();

    if (qName) {
      list = list.filter(a => a.nombre.toLowerCase().includes(qName));
    }

    if (cId) {"""

ts = ts.replace(old_filter, new_filter)

with open(path, 'w') as f:
    f.write(ts)
print("Added filter signal to TS")
