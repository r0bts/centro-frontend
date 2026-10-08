path = 'src/app/models/deportivo/actividad.model.ts'
with open(path, 'r') as f:
    content = f.read()

content = content.replace("\\n", "\n")

with open(path, 'w') as f:
    f.write(content)
print("Fixed syntax")
