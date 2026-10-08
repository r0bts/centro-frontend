paths = [
    'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss',
    'src/app/components/deportivo/actividades/deportivo-actividades.scss'
]

for path in paths:
    with open(path, 'r') as f:
        scss = f.read()
    
    if ".ng-value {" not in scss:
        addition = """
::ng-deep .custom-sm-select .ng-value-container {
  flex-wrap: nowrap !important;
}
::ng-deep .custom-sm-select .ng-value {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  flex-shrink: 1 !important;
  max-width: 100%;
}
::ng-deep .custom-sm-select.ng-select-single .ng-select-container .ng-value-container .ng-input {
  flex-shrink: 0 !important;
}
"""
        scss += addition
        with open(path, 'w') as f:
            f.write(scss)
        print(f"Updated truncation in {path}")

