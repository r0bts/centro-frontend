import re

ts_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Update STEPS
old_steps = """const STEPS: Step[] = [
  { id: 1, label: 'Identidad',   icon: 'bi-person-badge' },
  { id: 2, label: 'Grupos',      icon: 'bi-people' },
  { id: 3, label: 'Horarios',    icon: 'bi-clock' },
  { id: 4, label: 'Evaluación',  icon: 'bi-star' },
  { id: 5, label: 'Resumen',     icon: 'bi-check-circle' },
];"""

new_steps = """const STEPS: Step[] = [
  { id: 1, label: 'General',     icon: 'bi-info-circle' },
  { id: 2, label: 'Operación',   icon: 'bi-gear' },
  { id: 3, label: 'Grupos',      icon: 'bi-people' },
  { id: 4, label: 'Horarios',    icon: 'bi-clock' },
  { id: 5, label: 'Evaluación',  icon: 'bi-star' },
  { id: 6, label: 'Resumen',     icon: 'bi-check-circle' },
];"""
ts = ts.replace(old_steps, new_steps)
with open(ts_path, 'w') as f:
    f.write(ts)

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace Identidad with General
html = html.replace('<!-- ════ PASO 1: Identidad ════ -->', '<!-- ════ PASO 1: General ════ -->')

# Extract Modo Mensajeria and Cobro from Step 1, and make it Step 2
mensajeria_cobro = re.search(r'(<div class="mb-3">\s*<label class="form-label fw-semibold">Modo de mensajería</label>.*?</div>\s*</div>)', html, re.DOTALL)
if mensajeria_cobro:
    chunk = mensajeria_cobro.group(1)
    # Remove it from step 1
    html = html.replace(chunk, '')
    
    # Add step 2
    step2 = f"""      <!-- ════ PASO 2: Operación ════ -->
      @if (currentStep() === 2) {{
        <div class="step-content">
          <h6 class="step-section-title">Reglas de Operación</h6>
          
          <div class="mb-3">
            <label class="form-label fw-semibold">Elegibilidad</label>
            <label class="mensajeria-option" [class.selected]="elegible_para_socios">
              <div>
                <div class="fw-semibold">¿Exclusivo para Socios?</div>
                <small class="text-muted">Desactiva esta opción si la actividad está abierta a invitados o externos.</small>
              </div>
              <div class="form-check form-switch ms-auto mb-0">
                <input class="form-check-input" type="checkbox" role="switch"
                       [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer">
              </div>
            </label>
          </div>

{chunk}
        </div>
      }}
"""
    
    # Insert Step 2 before Step 2: Grupos
    html = html.replace('<!-- ════ PASO 2: Grupos ════ -->', step2 + '\n      <!-- ════ PASO 3: Grupos ════ -->')
    
    # Update step numbers
    html = html.replace('@if (currentStep() === 2) {', '@if (currentStep() === 3) {', 1)
    html = html.replace('<!-- ════ PASO 3: Horarios ════ -->', '<!-- ════ PASO 4: Horarios ════ -->')
    html = html.replace('@if (currentStep() === 3) {', '@if (currentStep() === 4) {')
    html = html.replace('<!-- ════ PASO 4: Evaluación ════ -->', '<!-- ════ PASO 5: Evaluación ════ -->')
    html = html.replace('@if (currentStep() === 4) {', '@if (currentStep() === 5) {')
    html = html.replace('<!-- ════ PASO 5: Resumen ════ -->', '<!-- ════ PASO 6: Resumen ════ -->')
    html = html.replace('@if (currentStep() === 5) {', '@if (currentStep() === 6) {')

with open(html_path, 'w') as f:
    f.write(html)
print("Updated Wizard Structure successfully!")
