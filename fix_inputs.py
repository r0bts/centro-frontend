import re

scss_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss'
with open(scss_path, 'r') as f:
    scss = f.read()

# Make sure we didn't duplicate the .input-group rule
if '.input-group' in scss:
    pass
else:
    scss += """
// Homologar input-group con el border-radius global (20px)
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
"""
    with open(scss_path, 'w') as f:
        f.write(scss)
print("SCSS updated!")
