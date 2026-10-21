import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Fix line 167 map
ts = ts.replace("area_id: h.area_id ?? null\n      }))", "area_id: h.area_id ?? null,\n        profesor_id: h.profesor_id ?? null,\n        costo_interno: h.costo_interno ?? null\n      }))")

# Fix addHorarioOnly AGAIN, because the previous replace might have failed if whitespace didn't match
old_add = "{ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null }"
new_add = "{ dia_semana: dia, hora_inicio: '08:00', hora_fin: '09:00', lugar: null, area_id: null, profesor_id: null, costo_interno: null }"
if old_add in ts:
    ts = ts.replace(old_add, new_add)
else:
    ts = re.sub(r"\{\s*dia_semana:\s*dia,\s*hora_inicio:\s*'08:00',\s*hora_fin:\s*'09:00',\s*lugar:\s*null,\s*area_id:\s*null\s*\}", new_add, ts)

with open(ts_path, 'w') as f:
    f.write(ts)

# And fix HTML Line 191
html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Lines around 191:
#         </div>
#       }
#       
# <!-- ════ PASO 3: Grupos ════ -->

html = html.replace('        </div>\n      }\n      \n<!-- ════ PASO 3: Grupos ════ -->', '        </div>\n      }\n<!-- ════ PASO 3: Grupos ════ -->')
html = re.sub(r'\s*\}\s*<!-- ════ PASO 3', '\n<!-- ════ PASO 3', html)

with open(html_path, 'w') as f:
    f.write(html)
