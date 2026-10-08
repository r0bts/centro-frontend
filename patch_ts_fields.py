import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Add elegible_para_socios to component state if missing
if 'elegible_para_socios = true;' not in ts:
    ts = re.sub(r'tiene_costo\s*=\s*false;\s*monto\s*=\s*0;', 'tiene_costo = false;\n  monto = 0;\n  elegible_para_socios = true;', ts)

# Update the patchFromEdit to bind elegible_para_socios
if 'this.elegible_para_socios =' not in ts:
    ts = re.sub(r'this\.is_active\s*=\s*act\.is_active;', 'this.is_active = act.is_active;\n    this.elegible_para_socios = act.elegible_para_socios ?? true;', ts)

# Update buildCreatePayload and buildUpdatePayload
ts = re.sub(r'is_active:\s*this\.is_active,', 'is_active: this.is_active,\n          elegible_para_socios: this.elegible_para_socios,', ts)

# Update addHorarioOnly to include profesor_id and costo_interno
old_add = "{ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null }"
new_add = "{ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null, profesor_id: null, costo_interno: null }"
ts = ts.replace(old_add, new_add)

# Update addReplicas to include profesor_id and costo_interno
# It pushes Object.assign({}, h, { dia_semana: d }) which should naturally copy profesor_id and costo_interno, so no change needed there!

with open(ts_path, 'w') as f:
    f.write(ts)
print("Patched TS logic!")
