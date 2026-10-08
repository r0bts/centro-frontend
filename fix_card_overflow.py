path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(path, 'r') as f:
    css = f.read()

css = css.replace("overflow: hidden;\n  transition: box-shadow", "overflow: visible;\n  transition: box-shadow")

with open(path, 'w') as f:
    f.write(css)
print("Fixed card overflow")
