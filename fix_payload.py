import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

target1 = """              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              is_active:   true,"""

replacement1 = """              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              profesor_id: h.profesor_id ?? undefined,
              costo_interno: h.costo_interno ?? undefined,
              is_active:   true,"""
ts = ts.replace(target1, replacement1)


target2 = """            await firstValueFrom(this.svc.createHorario(eq.id!, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              is_active:   true,
            }));"""

replacement2 = """            await firstValueFrom(this.svc.createHorario(eq.id!, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              profesor_id: h.profesor_id ?? undefined,
              costo_interno: h.costo_interno ?? undefined,
              is_active:   true,
            }));"""
ts = ts.replace(target2, replacement2)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Updated payload!")
