import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

pattern = r'<div class="border-end border-bottom text-center text-muted fw-bold py-2 bg-light" style="font-size: 0\.85rem;">\s*\{\{ h\.toString\(\)\.padStart\(2, \'0\'\) \}\}:00\s*</div>'

replacement = """<div class="border-end border-bottom text-center text-muted py-1 bg-light d-flex flex-column align-items-center justify-content-center" style="font-size: 0.85rem;">
                         <span class="fw-bold text-dark">{{ h.toString().padStart(2, '0') }}:00</span>
                         <span class="fw-normal" style="font-size: 0.65rem;">a {{ (h+1).toString().padStart(2, '0') }}:00</span>
                      </div>"""

html = re.sub(pattern, replacement, html)

with open(path, 'w') as f:
    f.write(html)
print("Updated header labels!")
