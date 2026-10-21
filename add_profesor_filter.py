path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

# Add signal
ts = ts.replace("filterHorario = signal<string>('');", "filterHorario = signal<string>('');\n  filterProfesorId = signal<number | null>(null);")

old_computed = """  filteredActividades = computed(() => {
    let list = this.actividades();
    const qName = this.filterNombre()?.toLowerCase().trim();
    const cId = this.filterClubId();
    const aId = this.filterAreaId();
    const searchH = this.filterHorario()?.toLowerCase().trim();

    if (qName) {
      list = list.filter(a => a.nombre.toLowerCase().includes(qName));
    }

    if (cId) {
      list = list.filter(a => a.club_id === cId);
    }
    
    if (aId || searchH) {
      list = list.filter(a => {
        // If aId is set, does any grupo > horario match this area?
        // Wait, Actividad has `grupos_categorias`, let's search them.
        let matchArea = false;
        let matchHorario = false;

        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (aId && h.area_id === aId) matchArea = true;
              
              if (searchH) {
                const dayMap = [null, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                const dayName = dayMap[h.dia_semana]?.toLowerCase() || '';
                if (dayName.includes(searchH) || h.hora_inicio?.includes(searchH) || h.hora_fin?.includes(searchH)) {
                  matchHorario = true;
                }
              }
            }
          }
        }
        
        if (aId && !matchArea) return false;
        if (searchH && !matchHorario) return false;
        return true;
      });
    }

    return list;
  });"""

new_computed = """  filteredActividades = computed(() => {
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
    
    if (aId || searchH || pId) {
      list = list.filter(a => {
        let matchArea = false;
        let matchHorario = false;
        let matchProfesor = false;

        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            if (pId && eq.coach_id === pId) matchProfesor = true;
            
            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (aId && h.area_id === aId) matchArea = true;
              if (pId && h.profesor_id === pId) matchProfesor = true;
              
              if (searchH) {
                const dayMap = [null, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                const dayName = dayMap[h.dia_semana]?.toLowerCase() || '';
                if (dayName.includes(searchH) || h.hora_inicio?.includes(searchH) || h.hora_fin?.includes(searchH)) {
                  matchHorario = true;
                }
              }
            }
          }
        }
        
        if (aId && !matchArea) return false;
        if (pId && !matchProfesor) return false;
        if (searchH && !matchHorario) return false;
        return true;
      });
    }

    return list;
  });"""

ts = ts.replace(old_computed, new_computed)

with open(path, 'w') as f:
    f.write(ts)
print("Added TS logic for profesor filter")
