path = 'src/app/models/deportivo/actividad.model.ts'
with open(path, 'r') as f:
    content = f.read()

content = content.replace("monto?: number | null;           // importe a cobrar, solo si tiene_costo", "monto?: number | null;           // importe a cobrar, solo si tiene_costo\\n  costo_interno?: number | null;   // nomina del profesor\\n  profesor_id?: number | null;")
content = content.replace("monto?: number;", "monto?: number;\\n  costo_interno?: number;\\n  profesor_id?: number;")

with open(path, 'w') as f:
    f.write(content)
print("Updated model")
