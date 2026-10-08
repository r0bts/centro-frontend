import re

scss_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

target = """// Homologar input-group y selects con el border-radius global (20px)
.input-group {
  .input-group-text:first-child {
    border-top-left-radius: 20px !important;
    border-bottom-left-radius: 20px !important;
  }
  .form-control:not(:first-child) {
    border-top-right-radius: 20px !important;
    border-bottom-right-radius: 20px !important;
  }
}

.form-select-sm, .form-control-sm {
  border-radius: 20px !important;
}"""

replacement = """// Homologar input-group y selects con el border-radius global (20px)
.form-select-sm, .form-control-sm {
  border-radius: 20px !important;
}

.input-group {
  .input-group-text:first-child {
    border-top-left-radius: 20px !important;
    border-bottom-left-radius: 20px !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
  .form-control:not(:first-child) {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    border-top-right-radius: 20px !important;
    border-bottom-right-radius: 20px !important;
  }
}"""

scss = scss.replace(target, replacement)
with open(scss_path, 'w') as f:
    f.write(scss)
print("Fixed input group separation!")
