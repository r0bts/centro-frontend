path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(path, 'r') as f:
    css = f.read()

old_css = """  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }"""

new_css = """  &:hover, &:has(.dropdown-menu.show) {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    z-index: 50;
  }"""

css = css.replace(old_css, new_css)

with open(path, 'w') as f:
    f.write(css)
print("Updated SCSS z-index")
