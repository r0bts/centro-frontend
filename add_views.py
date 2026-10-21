path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

# Add filterArea and update viewMode
ts = re.sub(r"filterProfesorId = signal<number \| null>\(null\);",
            "filterProfesorId = signal<number | null>(null);\n  filterArea = signal<string | null>(null);", ts)

ts = re.sub(r"viewMode = signal<'grid' \| 'list' \| 'calendar'>\(\s*'grid'\s*\);",
            "viewMode = signal<'grid' | 'list' | 'calendar' | 'classic' | 'heatmap'>('calendar');", ts)

ts = re.sub(r"viewMode = signal<'grid' \| 'list' \| 'calendar'>\(",
            "viewMode = signal<'grid' | 'list' | 'calendar' | 'classic' | 'heatmap'>(", ts)

# Add uniqueAreas computed property
areas_computed = """  uniqueAreas = computed(() => {
    const list = this.actividades();
    const areasSet = new Set<string>();
    list.forEach(a => {
      a.grupos_categorias?.forEach(g => {
        g.equipos?.forEach(eq => {
          eq.horarios_entrenamiento?.forEach(h => {
            if (h.area_id) {
              const aName = this.formData()?.areas_mapeadas?.find(ma => ma.area_id === h.area_id)?.area_name;
              if (aName) areasSet.add(aName);
            } else if (h.lugar) {
              areasSet.add(h.lugar);
            }
          });
        });
      });
    });
    return Array.from(areasSet).sort();
  });

  filteredActividades = computed(() => {"""

ts = ts.replace("  filteredActividades = computed(() => {", areas_computed)

# Update filteredActividades to use filterArea
filter_area_logic = """    const searchH = this.filterHorario()?.toLowerCase().trim();
    const filterAcceso = this.filterAcceso();
    const areaF = this.filterArea();

    if (qName) {"""

ts = ts.replace("""    const searchH = this.filterHorario()?.toLowerCase().trim();
    const filterAcceso = this.filterAcceso();

    if (qName) {""", filter_area_logic)

filter_area_apply = """    if (areaF) {
      list = list.filter(a => {
        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            const horarios = eq.horarios_entrenamiento || [];
            for (const h of horarios) {
              let locName = h.lugar || '';
              if (h.area_id) {
                const mapA = this.formData()?.areas_mapeadas?.find(ma => ma.area_id === h.area_id);
                if (mapA) locName = mapA.area_name;
              }
              if (locName === areaF) return true;
            }
          }
        }
        return false;
      });
    }

    if (searchH || pId) {"""

ts = ts.replace("""    if (searchH || pId) {""", filter_area_apply)

# Add heatmap max metric
heatmap_max = """  heatmapMax = computed(() => {
    const hours = this.timeTableHours();
    let max = 0;
    hours.forEach(row => {
      Object.values(row.days).forEach((sessions: any) => {
        if (sessions.length > max) max = sessions.length;
      });
    });
    return max || 1;
  });

  timeTableHours = computed(() => {"""

ts = ts.replace("  timeTableHours = computed(() => {", heatmap_max)

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS with new view modes and filters!")
