path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# Fix vertical alignment of the Day cell
html = html.replace('<td class="bg-white text-center align-middle sticky-start border-end shadow-sm"',
                    '<td class="bg-white text-center align-top pt-4 sticky-start border-end shadow-sm"')

# Make cards slightly more compact
html = html.replace('gap: 6px;', 'gap: 4px;')
html = html.replace('card-body p-2 d-flex flex-column', 'card-body p-1 d-flex flex-column')
html = html.replace('style="min-height: 100px;"', 'style="min-height: 60px;"')

with open(path, 'w') as f:
    f.write(html)
print("Fixed align and compactness")
