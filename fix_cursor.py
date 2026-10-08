paths = [
    'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss',
    'src/app/components/deportivo/actividades/deportivo-actividades.scss'
]

old_input = """::ng-deep .custom-sm-select .ng-input > input {
  padding-left: 0.75rem !important;
  font-size: 0.875rem !important;
}"""

new_input = """::ng-deep .custom-sm-select .ng-input > input {
  font-size: 0.875rem !important;
}
::ng-deep .custom-sm-select.ng-select-single .ng-select-container .ng-value-container .ng-input {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  padding-left: 0.25rem !important;
}"""

for path in paths:
    with open(path, 'r') as f:
        scss = f.read()
    scss = scss.replace(old_input, new_input)
    with open(path, 'w') as f:
        f.write(scss)
    print(f"Updated {path}")

