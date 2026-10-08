path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_costo = """  setGrupoCosto(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g }));
      copy[grupoIdx].costo_interno = value;
      return copy;
    });
  }"""

new_costo = """  setGrupoCosto(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      copy[grupoIdx].costo_interno = value;
      copy[grupoIdx].horarios = copy[grupoIdx].horarios.map(h => ({ ...h, costo_interno: value }));
      return copy;
    });
  }"""

ts = ts.replace(old_costo, new_costo)

old_instructor = """  setGrupoInstructor(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g }));
      copy[grupoIdx].instructor_id = value;
      return copy;
    });
  }"""

new_instructor = """  setGrupoInstructor(grupoIdx: number, value: number | null): void {
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      copy[grupoIdx].instructor_id = value;
      copy[grupoIdx].horarios = copy[grupoIdx].horarios.map(h => ({ ...h, profesor_id: value }));
      return copy;
    });
  }"""

ts = ts.replace(old_instructor, new_instructor)

with open(path, 'w') as f:
    f.write(ts)
print("Fixed cascade")
