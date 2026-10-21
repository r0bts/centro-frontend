import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    content = f.read()

replacement = """const STEPS: Step[] = [
  { id: 1, label: 'Actividad',     icon: 'bi-info-circle' },
  { id: 2, label: 'Operación',     icon: 'bi-gear' },
  { id: 3, label: 'Grupos',        icon: 'bi-people' },
  { id: 4, label: 'Horarios',      icon: 'bi-clock' },
  { id: 5, label: 'Evaluación',    icon: 'bi-star' },
  { id: 6, label: 'Resumen',       icon: 'bi-check-circle' },
];"""

content = re.sub(r'const STEPS: Step\[\] = \[.*?\];', replacement, content, flags=re.DOTALL)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
    f.write(content)
