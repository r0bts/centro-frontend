import re

paths = [
    'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss',
    'src/app/components/deportivo/actividades/deportivo-actividades.scss'
]

for path in paths:
    with open(path, 'r') as f:
        scss = f.read()

    # Find the block where custom-sm-select is defined and restore it
    # I will replace everything from "::ng-deep .custom-sm-select .ng-value-container {" 
    # to the end of the file or up to ".unsaved-changes-toast {"
    
    # Actually, I know exactly what I want it to be:
    
    clean_select_css = """::ng-deep .custom-sm-select .ng-select-container {
  min-height: 31px !important;
  height: 31px !important;
  border-radius: 20px !important;
  border-color: var(--bs-border-color) !important;
}
::ng-deep .custom-sm-select .ng-value-container {
  padding-left: 0.75rem !important;
  font-size: 0.875rem !important;
}
::ng-deep .custom-sm-select .ng-input > input {
  font-size: 0.875rem !important;
  padding-left: 0 !important; /* Fixed cursor offset issue */
}
::ng-deep .custom-sm-select .ng-placeholder {
  font-size: 0.875rem !important;
}
::ng-deep .custom-sm-select.ng-select-opened > .ng-select-container {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
::ng-deep .custom-sm-select .ng-value {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100%;
}
"""
    
    # We will regex replace from "::ng-deep .custom-sm-select .ng-select-container {" 
    # until the first occurrence of ".unsaved-changes-toast {" or end of file
    
    pattern = r"::ng-deep \.custom-sm-select \.ng-select-container \{.*?(?=\.unsaved-changes-toast \{|$)"
    scss = re.sub(pattern, clean_select_css, scss, flags=re.DOTALL)
    
    with open(path, 'w') as f:
        f.write(scss)
    print(f"Reverted {path}")
