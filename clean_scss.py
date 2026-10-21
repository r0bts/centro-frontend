path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(path, 'r') as f:
    scss = f.read()

import re
scss = re.sub(r'@keyframes viewSlideIn \{[\s\S]*?\}\n\n\.view-animate-slide \{[\s\S]*?\}\n', '', scss)

with open(path, 'w') as f:
    f.write(scss)
