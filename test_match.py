with open('src/app/components/deportivo/actividades/deportivo-actividades.html', 'r') as f:
    html = f.read()

tbody = html.split('<thead class="table-light">')[1].split('<tbody>')[1].split('</tbody>')[0]
print(tbody[1500:3000])
