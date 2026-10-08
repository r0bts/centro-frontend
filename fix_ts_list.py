import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Replace isDiaSelected logic
old_logic = """  isDiaSelected(grupoIdx: number, dia: number): boolean {
    return this.grupos()[grupoIdx]?.horarios.some(h => h.dia_semana === dia) ?? false;
  }"""
  
if old_logic in ts:
    print("Logic was already using schedules!")
else:
    print("Wait, let's find isDiaSelected")
