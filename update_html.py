html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

import re

# 1. Update the club line
html = html.replace("<span>{{ act.club?.nombre || 'Todas las sedes' }}</span>", "<span>{{ getClubName(act.club_id) }}</span>")

# 2. Remove the "grupos configurados" line
# It looks like:
#             <div class="d-flex align-items-center gap-2">
#               <i class="bi bi-people"></i>
#               <span>{{ (act.grupos_categorias?.length ?? 0) }} grupos configurados</span>
#             </div>
html = re.sub(r'<div class="d-flex align-items-center gap-2">\s*<i class="bi bi-people"></i>\s*<span>\{\{ \(act\.grupos_categorias\?\.length \?\? 0\) \}\} grupos configurados</span>\s*</div>', '', html)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML")
