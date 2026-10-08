import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Inject elegible_para_socios
if 'elegible_para_socios = true;' not in ts:
    ts = ts.replace("tiene_costo     = false;", "tiene_costo     = false;\n  elegible_para_socios = true;")

# Inject into patchFromEdit
if 'this.elegible_para_socios = act.elegible_para_socios' not in ts:
    ts = ts.replace("this.color           = act.color;", "this.color           = act.color;\n    this.elegible_para_socios = act.elegible_para_socios ?? true;")

# Inject into payload
if 'elegible_para_socios: this.elegible_para_socios,' not in ts:
    ts = ts.replace("is_active: true,", "is_active: true,\n          elegible_para_socios: this.elegible_para_socios,")
    ts = ts.replace("is_active: act.is_active,", "is_active: act.is_active,\n          elegible_para_socios: this.elegible_para_socios,")

# Fix line 167 missing profesor_id and costo_interno
map_target = """        lugar: h.lugar ?? null,
        area_id: h.area_id ?? null
      }))"""
map_replacement = """        lugar: h.lugar ?? null,
        area_id: h.area_id ?? null,
        profesor_id: h.profesor_id ?? null,
        costo_interno: h.costo_interno ?? null
      }))"""
if map_target in ts:
    ts = ts.replace(map_target, map_replacement)

# Fix addHorarioOnly
old_add = "{ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null }"
new_add = "{ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null, profesor_id: null, costo_interno: null }"
ts = ts.replace(old_add, new_add)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Fixed TS completely!")
