html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace diaReplicando() === d.num with replicandoDia()?.grupoIdx === gIdx && replicandoDia()?.dia === d.num
html = html.replace("diaReplicando() === d.num", "replicandoDia()?.grupoIdx === gIdx && replicandoDia()?.dia === d.num")

# Replace iniciarReplica(d.num) with toggleReplicar(gIdx, d.num)
html = html.replace("iniciarReplica(d.num)", "toggleReplicar(gIdx, d.num)")

with open(html_path, 'w') as f:
    f.write(html)
print("Fixed HTML bindings")
