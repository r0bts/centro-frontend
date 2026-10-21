path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_func = """  getInstructorName(id: number): string {
    const list = this.formData()?.instructores || [];
    const found = list.find(x => x.id === id);
    if (!found) return 'Desconocido';
    return found.full_name.split(' ').slice(0, 2).join(' '); // Show first 2 words for compactness
  }"""

new_func = """  getInstructorName(id: number, full: boolean = false): string {
    const list = this.formData()?.instructores || [];
    const found = list.find(x => x.id === id);
    if (!found) return 'Desconocido';
    return full ? found.full_name : found.full_name.split(' ').slice(0, 2).join(' '); // Show first 2 words for compactness
  }"""

ts = ts.replace(old_func, new_func)

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS with full flag")
