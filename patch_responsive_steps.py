import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    css = f.read()

replacement = """  .step-label {
    font-size: 0.85rem;
    color: var(--bs-gray-600);
    @media (max-width: 576px) {
      display: none;
    }
  }"""

css = re.sub(r'\.step-label\s*\{[^}]*\}', replacement, css)

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
    f.write(css)
