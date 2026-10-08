path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

# Match the specific input in the card view
old_input = """                <input class="form-check-input m-0" type="checkbox" role="switch"
                       [checked]="act.elegible_para_socios !== false" 
                       (change)="toggleSocios(act)"
                       style="cursor: pointer; width: 1.8rem; height: 0.9rem;"
                       
                       
                       
                       >"""

new_input = """                <input class="form-check-input m-0" type="checkbox" role="switch"
                       [checked]="act.elegible_para_socios !== false" 
                       (change)="toggleSocios(act)"
                       style="cursor: pointer; width: 2.2rem; height: 1.1rem;">"""

html = html.replace(old_input, new_input)

with open(path, 'w') as f:
    f.write(html)
print("Updated switch size")
