import re

# --- Update STEPS array in TS ---
ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Replace the STEPS array
old_steps = """const STEPS: Step[] = [
  { id: 1, label: 'Actividad',     icon: 'bi-info-circle' },
  { id: 2, label: 'Operación',     icon: 'bi-gear' },
  { id: 3, label: 'Grupos',        icon: 'bi-people' },
  { id: 4, label: 'Horarios',      icon: 'bi-clock' },
  { id: 5, label: 'Evaluación',    icon: 'bi-star' },
  { id: 6, label: 'Resumen',       icon: 'bi-check-circle' },
];"""

new_steps = """const STEPS: Step[] = [
  { id: 1, label: 'General',       icon: 'bi-info-circle' },
  { id: 2, label: 'Operación',     icon: 'bi-gear' },
  { id: 3, label: 'Grupos',        icon: 'bi-people' },
  { id: 4, label: 'Horarios',      icon: 'bi-clock' },
];"""

ts = ts.replace(old_steps, new_steps)

with open(ts_path, 'w') as f:
    f.write(ts)


# --- Reconstruct the HTML ---
html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    current_html = f.read()

# Extract exactly the 4 Steps content block from current HTML
# We can find `<!-- ════ PASO 1: General ════ -->` and capture everything until `</div>\n\n    <!-- Footer -->`
content_match = re.search(r'(<!-- ════ PASO 1: General ════ -->.*?)</div>\s*<!-- Footer -->', current_html, re.DOTALL)
if not content_match:
    print("Could not extract steps content!")
    exit(1)
steps_content = content_match.group(1)

# Construct the full final HTML
final_html = f"""<div class="wizard-overlay">
  <div class="wizard-container">

    <!-- ── Header del wizard ──────────────────────────────────────────────── -->
    <div class="wizard-header">
      <div class="wizard-title">
        <div class="wizard-icon-wrap" [style.background]="color">
          <span>{{{{ icono }}}}</span>
        </div>
        <div>
          <h5 class="mb-0">{{{{ isEditing() ? 'Editar actividad' : 'Nueva actividad' }}}}</h5>
          <small class="text-muted">{{{{ nombre || 'Sin nombre' }}}}</small>
        </div>
      </div>
      <button class="btn-close" (click)="cancel()"></button>
    </div>

    <!-- ── Progress ───────────────────────────────────────────────────────── -->
    <div class="wizard-progress-bar">
      <div class="progress-fill" [style.width.%]="progressPct()"></div>
    </div>

    <!-- ── Steps indicator ────────────────────────────────────────────────── -->
    <div class="wizard-steps">
      @for (step of steps; track step.id) {{
        <div class="step-item"
             [class.active]="currentStep() === step.id"
             [class.done]="currentStep() > step.id"
             (click)="goTo(step.id)"
             role="button">
          <div class="step-bubble">
            @if (currentStep() > step.id) {{
              <i class="bi bi-check-lg"></i>
            }} @else {{
              <i class="bi" [class]="step.icon"></i>
            }}
          </div>
          <span class="step-label d-none d-md-inline">{{{{ step.label }}}}</span>
        </div>
      }}
    </div>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    @if (error()) {{
      <div class="alert alert-danger alert-sm mx-4 mt-3 mb-0 d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-circle-fill"></i>
        {{{{ error() }}}}
      </div>
    }}

    <div class="wizard-body p-4" style="overflow-y: auto;">
      @if (loadingDetail()) {{
        <div class="d-flex justify-content-center align-items-center py-5">
          <div class="spinner-border text-primary me-2" role="status"></div>
          <span class="text-muted">Cargando datos…</span>
        </div>
      }} @else {{
{steps_content}
      }}
    </div><!-- /wizard-body -->

    <!-- ── Footer con navegación ─────────────────────────────────────────── -->
    <div class="wizard-footer">
      <button class="btn btn-outline-secondary" (click)="cancel()">
        Cancelar
      </button>
      <div class="d-flex gap-2">
        @if (currentStep() > 1) {{
          <button class="btn btn-outline-primary" (click)="prev()">
            <i class="bi bi-chevron-left me-1"></i>Anterior
          </button>
        }}
        @if (currentStep() < steps.length) {{
          <button class="btn btn-primary" (click)="next()">
            Siguiente<i class="bi bi-chevron-right ms-1"></i>
          </button>
        }}
        @if (currentStep() === steps.length) {{
          <button class="btn btn-success" [disabled]="saving()" (click)="publish()">
            @if (saving()) {{
              <span class="spinner-border spinner-border-sm me-2"></span>
            }} @else {{
              <i class="bi bi-rocket-takeoff me-2"></i>
            }}
            {{{{ isEditing() ? 'Guardar cambios' : 'Publicar actividad' }}}}
          </button>
        }}
      </div>
    </div>

  </div>
</div>
"""

with open(html_path, 'w') as f:
    f.write(final_html)

print("Restored UI shell successfully!")
