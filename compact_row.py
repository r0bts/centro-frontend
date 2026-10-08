html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace <div class="row g-2 align-items-center p-2 rounded bg-light border border-light-subtle mb-2">
# with <div class="row g-2 align-items-center mb-1">
html = html.replace('<div class="row g-2 align-items-center p-2 rounded bg-light border border-light-subtle mb-2">', '<div class="row g-2 align-items-center mb-2">')

# Also, the header row has px-2, which we should remove so it aligns with the inputs perfectly.
html = html.replace('<div class="row g-2 px-2 d-none d-md-flex">', '<div class="row g-2 d-none d-md-flex mb-1">')

with open(html_path, 'w') as f:
    f.write(html)
print("Compacted rows")
