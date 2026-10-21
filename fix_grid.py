scss_path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

old_grid = """.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;"""

new_grid = """.activities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

@media (max-width: 1200px) {
  .activities-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .activities-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .activities-grid {
    grid-template-columns: 1fr;
  }"""

scss = scss.replace(old_grid, new_grid)

with open(scss_path, 'w') as f:
    f.write(scss)
print("Updated grid SCSS")
