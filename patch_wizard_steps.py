import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'r') as f:
    html = f.read()

# 1. Update step numbers for existing steps 2, 3, 4, 5 -> 3, 4, 5, 6
html = html.replace('@if (currentStep() === 5) {', '@if (currentStep() === 6) {')
html = html.replace('<!-- ════ PASO 5: Resumen ════ -->', '<!-- ════ PASO 6: Resumen ════ -->')

html = html.replace('@if (currentStep() === 4) {', '@if (currentStep() === 5) {')
html = html.replace('<!-- ════ PASO 4: Criterios ════ -->', '<!-- ════ PASO 5: Criterios ════ -->')

html = html.replace('@if (currentStep() === 3) {', '@if (currentStep() === 4) {')
html = html.replace('<!-- ════ PASO 3: Horarios ════ -->', '<!-- ════ PASO 4: Horarios ════ -->')

html = html.replace('@if (currentStep() === 2) {', '@if (currentStep() === 3) {')
html = html.replace('<!-- ════ PASO 2: Grupos ════ -->', '<!-- ════ PASO 3: Grupos ════ -->')

# 2. Split Step 1 into Step 1 and Step 2.
# Find the exact split point: `<!-- Modo Mensajería -->`
split_marker = '          <!-- Modo Mensajería -->'

if split_marker in html:
    parts = html.split(split_marker)
    
    # We close step 1 and start step 2
    closing_step_1 = """
        </div>
      }

      <!-- ════ PASO 2: Operación y Costos ════ -->
      @if (currentStep() === 2) {
        <div class="step-content">
          <h6 class="step-section-title">Operación y Costos</h6>
          <p class="text-muted small mb-4">Configura las reglas de participación, visibilidad y costos financieros asociados.</p>

          <!-- Modo Mensajería -->"""
    
    html = parts[0] + closing_step_1 + parts[1].split('<!-- Modo Mensajería -->')[0]

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html', 'w') as f:
    f.write(html)
