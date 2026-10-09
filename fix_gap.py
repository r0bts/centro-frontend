path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# Fix the padding and gap on the events grid
old_grid = 'class="p-2 position-relative" style="display: grid; grid-template-columns: repeat(48, 60px); grid-auto-rows: min-content; gap: 4px; min-height: 60px;"'
new_grid = 'class="py-1 px-0 position-relative" style="display: grid; grid-template-columns: repeat(48, 60px); grid-auto-rows: min-content; row-gap: 4px; column-gap: 0; min-height: 60px;"'

html = html.replace(old_grid, new_grid)

with open(path, 'w') as f:
    f.write(html)
print("Fixed CSS Grid gaps!")
