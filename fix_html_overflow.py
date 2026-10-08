path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

old_html = """            <div class="d-flex flex-wrap gap-1 mb-auto mt-1 pb-1" style="max-height: 28px; overflow: hidden;">"""
new_html = """            <div class="d-flex flex-wrap gap-1 mb-auto mt-1 pb-1">"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Removed overflow hidden")
