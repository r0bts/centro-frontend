path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

html = html.replace('td class="bg-white text-center align-middle fw-semibold text-secondary sticky-top border-end shadow-sm"',
                    'td class="bg-white text-center align-top pt-3 fw-semibold text-secondary sticky-top border-end shadow-sm"')

with open(path, 'w') as f:
    f.write(html)
print("Fixed vertical align")
