path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

new_listener = """
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOffcanvasOpen()) {
      this.closeHorariosOffcanvas();
    }
  }

  openHorariosOffcanvas(act: Actividad) {
"""

if "onEscapeKey(" not in ts:
    ts = ts.replace("  openHorariosOffcanvas(act: Actividad) {", new_listener)

with open(path, 'w') as f:
    f.write(ts)
print("Added escape key listener")
