import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

bulk_methods = """  // ── Bulk Add State (Step 4) ─────────────────────────────────────────────────
  bulkSelectedDays: number[] = [];
  bulkHoraInicio: string = '08:00';
  bulkHoraFin: string = '09:00';
  bulkAreaId: number | null = null;
  bulkProfesorId: number | null = null;
  bulkCosto: number | null = null;

  toggleBulkDay(dia: number): void {
    if (this.bulkSelectedDays.includes(dia)) {
      this.bulkSelectedDays = this.bulkSelectedDays.filter(d => d !== dia);
    } else {
      this.bulkSelectedDays.push(dia);
    }
  }

  addBulkHorarios(grupoIdx: number): void {
    if (this.bulkSelectedDays.length === 0) return;
    this.grupos.update(list => {
      const copy = list.map(g => ({ ...g, horarios: [...g.horarios] }));
      for (const d of this.bulkSelectedDays) {
        // Prevent duplicate day insertion, or allow multiple per day? 
        // We probably want to allow multiple blocks per day, so just push.
        copy[grupoIdx].horarios.push({
          dia_semana: d,
          hora_inicio: this.bulkHoraInicio,
          hora_fin: this.bulkHoraFin,
          lugar: null,
          area_id: this.bulkAreaId,
          profesor_id: this.bulkProfesorId,
          costo_interno: this.bulkCosto,
        });
      }
      copy[grupoIdx].horarios.sort((a,b) => a.dia_semana - b.dia_semana);
      return copy;
    });
    // Reset selection after adding
    this.bulkSelectedDays = [];
  }

  getDiaNombre(dia: number): string {
    return this.dias.find(d => d.id === dia)?.label ?? 'Día desconocido';
  }
"""

# Insert before '  // ── Paso 1: Identidad ' or just at the bottom of the methods.
# Let's replace getHorariosByDia with our new methods since we don't need getHorariosByDia anymore.

target_methods = """  getHorariosByDia(grupoIdx: number, dia: number) {
    return this.grupos()[grupoIdx]?.horarios
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(x => x.item.dia_semana === dia) ?? [];
  }"""

ts = ts.replace(target_methods, bulk_methods)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Updated TS methods!")
