import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

# Remove global state
ts = ts.replace('profesor_id: number | null = null;\n  costo_interno: number | null = null;', '')

# Remove from patchFromEdit
ts = ts.replace('this.profesor_id     = act.profesor_id ? Number(act.profesor_id) : null;', '')
ts = ts.replace('this.costo_interno  = act.costo_interno ?? null;', '')

# Remove from update payload
ts = ts.replace('profesor_id:     this.profesor_id || null,\n          costo_interno:   this.costo_interno || null,', '')

# Remove from create payload
ts = ts.replace('profesor_id:     this.profesor_id || undefined,\n          costo_interno:   this.costo_interno || undefined,', '')

# Ensure team payload doesn't use this.profesor_id anymore (fallback to null)
ts = ts.replace('coach_id: this.profesor_id || null', 'coach_id: null')

# Add to createHorario loop
target_horario_create = """            await firstValueFrom(this.svc.createHorario(equipoId, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              is_active:   true,
            }));"""
replacement_horario_create = """            await firstValueFrom(this.svc.createHorario(equipoId, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              profesor_id: h.profesor_id ?? undefined,
              costo_interno: h.costo_interno ?? undefined,
              is_active:   true,
            }));"""
ts = ts.replace(target_horario_create, replacement_horario_create)

# In addHorario
target_add = "area_id: null\n    });"
replacement_add = "area_id: null,\n      profesor_id: null,\n      costo_interno: null\n    });"
ts = ts.replace(target_add, replacement_add)

# In patchFromEdit mapping of horarios
target_map = "area_id: h.area_id ?? null"
replacement_map = "area_id: h.area_id ?? null,\n              profesor_id: h.profesor_id ? Number(h.profesor_id) : null,\n              costo_interno: h.costo_interno ?? null"
ts = ts.replace(target_map, replacement_map)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
    f.write(ts)
print("Patched wizard TS")
