path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_func = """  getInstructoresDeActividad(act: Actividad): number[] {
    const ids = new Set<number>();
    if (act.grupos_categorias) {"""

new_func = """  getInstructoresDeActividad(act: Actividad): number[] {
    const ids = new Set<number>();
    if (act.profesor_id) ids.add(act.profesor_id);
    if (act.grupos_categorias) {"""

ts = ts.replace(old_func, new_func)

with open(path, 'w') as f:
    f.write(ts)
print("Added act.profesor_id to set")
