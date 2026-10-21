paths = [
    'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss',
    'src/app/components/deportivo/actividades/deportivo-actividades.scss'
]

old_str = """::ng-deep .custom-sm-select.ng-select-single .ng-select-container .ng-value-container .ng-input {
  /* Removed relative positioning to prevent pushing the text out */
  padding-left: 0 !important; /* This fixes the cursor offset */
}"""

new_str = """::ng-deep .custom-sm-select.ng-select-single .ng-select-container .ng-value-container .ng-input {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  padding-left: 0 !important;
  opacity: 1 !important;
}
::ng-deep .custom-sm-select.ng-select-single.ng-select-focused .ng-select-container .ng-value-container .ng-value {
  visibility: hidden; /* Hide the selected text when searching so they don't overlap awkwardly */
}"""

for path in paths:
    with open(path, 'r') as f:
        scss = f.read()
    scss = scss.replace(old_str, new_str)
    with open(path, 'w') as f:
        f.write(scss)
    print(f"Updated {path}")
