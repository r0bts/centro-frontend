path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

# 1. Change filterAreaId to filterAcceso
ts = ts.replace("filterAreaId  = signal<number | null>(null);", "filterAcceso  = signal<boolean | null>(null);")

# 2. Update computed filter
old_computed = """  filteredActividades = computed(() => {
    let list = this.actividades();
    const qName = this.filterNombre()?.toLowerCase().trim();
    const cId = this.filterClubId();
    const aId = this.filterAreaId();
    const pId = this.filterProfesorId();
    const searchH = this.filterHorario()?.toLowerCase().trim();

    if (qName) {
      list = list.filter(a => a.nombre.toLowerCase().includes(qName));
    }

    if (cId) {
      list = list.filter(a => a.club_id === cId);
    }
    
    if (aId || searchH || pId) {"""

new_computed = """  filteredActividades = computed(() => {
    let list = this.actividades();
    const qName = this.filterNombre()?.toLowerCase().trim();
    const cId = this.filterClubId();
    const pId = this.filterProfesorId();
    const searchH = this.filterHorario()?.toLowerCase().trim();
    const filterAcceso = this.filterAcceso();

    if (qName) {
      list = list.filter(a => a.nombre.toLowerCase().includes(qName));
    }

    if (cId) {
      list = list.filter(a => a.club_id === cId);
    }

    if (filterAcceso !== null) {
      if (filterAcceso) {
        list = list.filter(a => a.elegible_para_socios !== false);
      } else {
        list = list.filter(a => a.elegible_para_socios === false);
      }
    }
    
    if (searchH || pId) {"""

ts = ts.replace(old_computed, new_computed)

old_horarios = """            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (aId && h.area_id === aId) matchArea = true;
              if (pId && h.profesor_id === pId) matchProfesor = true;"""

new_horarios = """            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (pId && h.profesor_id === pId) matchProfesor = true;"""

ts = ts.replace(old_horarios, new_horarios)

old_return = """        if (aId && !matchArea) return false;
        if (pId && !matchProfesor) return false;
        if (searchH && !matchHorario) return false;
        return true;"""

new_return = """        if (pId && !matchProfesor) return false;
        if (searchH && !matchHorario) return false;
        return true;"""

ts = ts.replace(old_return, new_return)

# Also remove matchArea definition
ts = ts.replace("        let matchArea = false;\n", "")

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS")
