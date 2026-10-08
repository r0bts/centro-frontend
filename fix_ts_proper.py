path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';" in line:
        new_lines.append("import { Directive, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';\n")
    else:
        new_lines.append(line)

ts = "".join(new_lines)

state_methods = """  dropdownState = signal<Record<number, boolean>>({});

  setDropdownState(id: number, state: boolean) {
    this.dropdownState.update(s => ({ ...s, [id]: state }));
  }

  isDropdownOpen(id: number): boolean {
    return this.dropdownState()[id] || false;
  }
"""
ts = ts.replace("  viewMode = signal<'grid' | 'list' | 'calendar'>('grid');", "  viewMode = signal<'grid' | 'list' | 'calendar'>('grid');\n" + state_methods)

with open(path, 'w') as f:
    f.write(ts)
print("Fixed TS")
