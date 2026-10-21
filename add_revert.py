path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

revert = """
  revertChanges(): void {
    if (this.originalActividad()) {
      this.patchFromEdit(this.originalActividad()!);
      this.hasUnsavedChanges.set(false);
      this.savedStateHash = this.getHash();
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
"""

ts = ts.replace("  // ── Lifecycle ────────────────────────────────────────────────────────────────", revert)

with open(path, 'w') as f:
    f.write(ts)
print("Added revert changes")
