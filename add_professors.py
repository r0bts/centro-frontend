path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

# Add getInstructoresDeActividad and getInstructorName
methods = """
  getInstructorName(id: number): string {
    const list = this.formData()?.instructores || [];
    const found = list.find(x => x.id === id);
    if (!found) return 'Desconocido';
    return found.full_name.split(' ').slice(0, 2).join(' '); // Show first 2 words for compactness
  }

  getInstructoresDeActividad(act: Actividad): number[] {
    const ids = new Set<number>();
    if (act.grupos_categorias) {
      for (const g of act.grupos_categorias) {
        if (g.equipos) {
          for (const e of g.equipos) {
            if (e.horarios) {
              for (const h of e.horarios) {
                if (h.profesor_id) ids.add(h.profesor_id);
              }
            }
          }
        }
      }
    }
    return Array.from(ids);
  }
"""

if "getInstructorName" not in ts:
    ts = ts.replace("  formatHora(hora: string): string {", methods + "\n  formatHora(hora: string): string {")

with open(path, 'w') as f:
    f.write(ts)
print("Added TS methods")
