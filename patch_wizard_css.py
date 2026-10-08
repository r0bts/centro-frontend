with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    css = f.read()

css = css.replace('max-width: 640px;', 'max-width: 800px;')

# Remove the ugly scrollbar visually
css = css.replace('overflow-x: auto;', 'overflow-x: auto;\n  scrollbar-width: none;\n  &::-webkit-scrollbar { display: none; }')

# Hide labels on mobile
css = css.replace('.step-label {\n  font-size: 0.78rem;', '.step-label {\n  font-size: 0.78rem;\n  @media (max-width: 576px) { display: none; }')

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
    f.write(css)
