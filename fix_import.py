ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Fix the broken import
# Replace `, HostListener from '@angular/core';` with `  HostListener\n} from '@angular/core';`
ts = ts.replace(", HostListener from '@angular/core';", "  HostListener\n} from '@angular/core';")

with open(ts_path, 'w') as f:
    f.write(ts)
print("Fixed import")
