import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Add HostListener to imports from @angular/core
if 'HostListener' not in ts:
    ts = re.sub(r'(import \{[^}]*)\}( from \'@angular/core\';)', r'\1, HostListener\2', ts)

# Add methods to the class
methods = """  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.cancel();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('wizard-overlay')) {
      this.cancel();
    }
  }

  cancel(): void {"""

ts = ts.replace('  cancel(): void {', methods)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Updated TS")
