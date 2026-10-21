import re

scss_path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

# Make card-action-btn not flex:1 when in d-flex
# I'll just change flex: 1; to flex: none; and let padding handle the size.
scss = scss.replace("  flex: 1;", "  flex: none;")

with open(scss_path, 'w') as f:
    f.write(scss)
