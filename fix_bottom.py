import re

paths = [
    'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss',
    'src/app/components/deportivo/actividades/deportivo-actividades.scss'
]

for path in paths:
    with open(path, 'r') as f:
        scss = f.read()

    # Find where the unsaved toast is, and trim everything after it EXCEPT the toast itself!
    # Wait, deportivo-actividades.scss DOES NOT have .unsaved-changes-toast!
    
    # Let's just remove the block:
    bad_block = """::ng-deep .custom-sm-select .ng-value-container {
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
}"""
    
    bad_block2 = """::ng-deep .custom-sm-select.ng-select-single .ng-select-container .ng-value-container .ng-input {
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

    scss = scss.replace(bad_block, "")
    scss = scss.replace(bad_block2, "")
    
    with open(path, 'w') as f:
        f.write(scss)
    print(f"Cleaned {path}")
