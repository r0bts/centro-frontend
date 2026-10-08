path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

mapping = """
  daysMapping: Record<number, string> = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
  };
"""

# Just add it right before the last closing brace
ts = ts.rsplit("}", 1)[0] + mapping + "}\n"

with open(path, 'w') as f:
    f.write(ts)
print("Forced append of daysMapping")
