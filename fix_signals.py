path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

new_signals = """  deleteTarget  = signal<Actividad | null>(null);
  selectedActividadForHorarios = signal<Actividad | null>(null);
  isOffcanvasOpen = signal(false);
  horarioForm = {
    dia_semana: 1,
    hora_inicio: '08:00',
    hora_fin: '09:00',
    profesor_id: null as number | null
  };"""

ts = re.sub(r'  deleteTarget\s*=\s*signal<Actividad \| null>\(null\);', new_signals, ts)

with open(path, 'w') as f:
    f.write(ts)
print("Added signals")
