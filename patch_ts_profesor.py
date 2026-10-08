import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

# Add to state:
ts = ts.replace('monto: number | null = null;\n  costo_interno: number | null = null;', 'monto: number | null = null;\n  profesor_id: number | null = null;\n  costo_interno: number | null = null;')

# Add to patchFromEdit:
ts = ts.replace('this.monto           = act.monto        ?? null;', 'this.monto           = act.monto        ?? null;\n    this.profesor_id     = act.profesor_id  ?? null;')

# Add to payload update:
update_payload = """          fecha_fin:       this.fecha_fin    || null,
          monto:           this.tiene_costo ? (this.monto ?? null) : null,
          costo_interno:   this.costo_interno || null,"""
update_replacement = """          fecha_fin:       this.fecha_fin    || null,
          monto:           this.tiene_costo ? (this.monto ?? null) : null,
          profesor_id:     this.profesor_id || null,
          costo_interno:   this.costo_interno || null,"""
ts = ts.replace(update_payload, update_replacement)

# Add to payload create:
create_payload = """          fecha_inicio:    this.fecha_inicio || undefined,
          fecha_fin:       this.fecha_fin    || undefined,
          monto:           this.tiene_costo ? (this.monto ?? undefined) : undefined,
          costo_interno:   this.costo_interno || undefined,"""
create_replacement = """          fecha_inicio:    this.fecha_inicio || undefined,
          fecha_fin:       this.fecha_fin    || undefined,
          monto:           this.tiene_costo ? (this.monto ?? undefined) : undefined,
          profesor_id:     this.profesor_id || undefined,
          costo_interno:   this.costo_interno || undefined,"""
ts = ts.replace(create_payload, create_replacement)

# When creating "General" team, use the global profesor_id instead of group's instructor
team_payload = """        const equiposACrear = g.horarios.length > 0
          ? [{ nombre: 'General', color: this.color, coach_id: g.instructor_id }]
          : [];"""
team_replacement = """        const equiposACrear = g.horarios.length > 0
          ? [{ nombre: 'General', color: this.color, coach_id: this.profesor_id || null }]
          : [];"""
ts = ts.replace(team_payload, team_replacement)


with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
    f.write(ts)
print("Patched TS")
