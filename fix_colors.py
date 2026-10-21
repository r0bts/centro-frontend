html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

import re

# Fix grid view
html = html.replace('[class.text-info]="act.elegible_para_socios === false"', '[class.text-secondary]="act.elegible_para_socios === false"')
html = html.replace('[class.bg-primary]="act.elegible_para_socios !== false"', '')
html = html.replace('[class.bg-info]="act.elegible_para_socios === false"', '')
html = html.replace('[class.border-primary]="act.elegible_para_socios !== false"', '')
html = html.replace('[class.border-info]="act.elegible_para_socios === false"', '')

# Fix list view where we might have leftover bg-primary / bg-info
# The previous script had this for list view:
#                      <input class="form-check-input m-0" type="checkbox" role="switch"
#                             [checked]="act.elegible_para_socios !== false" 
#                             (change)="toggleSocios(act)"
#                             style="cursor: pointer; width: 2.2rem; height: 1.1rem;"
#                             [class.bg-primary]="act.elegible_para_socios !== false"
#                             [class.bg-info]="act.elegible_para_socios === false">
#                      <label class="form-check-label small mb-0 fw-bold" style="cursor: pointer;" (click)="toggleSocios(act); $event.preventDefault()"
#                             [class.text-primary]="act.elegible_para_socios !== false"
#                             [class.text-info]="act.elegible_para_socios === false">

# It's already mostly handled by the global replaces above, let's verify.
with open(html_path, 'w') as f:
    f.write(html)
print("Updated colors")
