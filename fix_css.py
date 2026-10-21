with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'r') as f:
    lines = f.readlines()

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss', 'w') as f:
    for line in lines:
        if line.strip() == '@media (max-width: 576px) {':
            continue
        if line.strip() == 'display: none;':
            continue
        f.write(line)
