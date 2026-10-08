path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(path, 'r') as f:
    html = f.read()

toast = """
    <!-- Toast de cambios sin guardar -->
    @if (hasUnsavedChanges()) {
      <div class="unsaved-changes-toast">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-info-circle-fill text-warning"></i>
            <span class="fw-semibold">Tienes cambios sin guardar</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-light" (click)="revertChanges()">Descartar</button>
            <button class="btn btn-sm btn-dark" [disabled]="saving()" (click)="publish(false)">
              @if (saving()) {
                <span class="spinner-border spinner-border-sm me-1"></span>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Footer con navegación ─────────────────────────────────────────── -->"""

html = html.replace("    <!-- ── Footer con navegación ─────────────────────────────────────────── -->", toast)

with open(path, 'w') as f:
    f.write(html)
print("Added toast to HTML")
