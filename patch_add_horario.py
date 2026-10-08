import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

target = """        lugar: null,
        area_id: null
      });"""
replacement = """        lugar: null,
        area_id: null,
        profesor_id: null,
        costo_interno: null
      });"""
if target in ts:
    ts = ts.replace(target, replacement)

target2 = """            await firstValueFrom(this.svc.createHorario(equipoId, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              is_active:   true,
            }));"""
replacement2 = """            await firstValueFrom(this.svc.createHorario(equipoId, {
              dia_semana:  h.dia_semana,
              hora_inicio: h.hora_inicio,
              hora_fin:    h.hora_fin,
              lugar:       h.lugar ?? undefined,
              area_id:     h.area_id ?? undefined,
              profesor_id: h.profesor_id ?? undefined,
              costo_interno: h.costo_interno ?? undefined,
              is_active:   true,
            }));"""
if target2 in ts:
    ts = ts.replace(target2, replacement2)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
    f.write(ts)
print("Patched addHorario")
