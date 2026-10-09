path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_banner_regex = r'<!-- ── View Description Banner ── -->.*?</div>\s*</div>'

new_banner = """<!-- ── View Description Banner ── -->
    <div class="alert alert-light border shadow-sm d-flex flex-column flex-md-row align-items-md-center py-2 mb-4 gap-3" style="border-radius: 10px;">
      <div class="d-flex align-items-center flex-grow-1">
        <i class="bi bi-info-circle text-primary fs-4 me-3"></i>
        <div>
          @if (viewMode() === 'grid') {
            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Vista de Tarjetas</h6>
            <span class="text-muted" style="font-size: 0.75rem;">Explora el catálogo de actividades en formato visual para un panorama general de cada disciplina.</span>
          } @else if (viewMode() === 'list') {
            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Vista de Tabla Dinámica</h6>
            <span class="text-muted" style="font-size: 0.75rem;">Analiza los datos en formato de lista para exportar o editar campos de forma masiva.</span>
          } @else if (viewMode() === 'calendar') {
            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Línea de Tiempo (Gantt)</h6>
            <span class="text-muted" style="font-size: 0.75rem;">Visualiza la duración exacta de cada clase. Indispensable para detectar empalmes visualmente a lo largo del día.</span>
          } @else if (viewMode() === 'classic') {
            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Agenda Clásica por Bloques</h6>
            <span class="text-muted" style="font-size: 0.75rem;">Genera un horario estructurado tradicional, listo para imprimirse o compartirse individualmente.</span>
          } @else if (viewMode() === 'heatmap') {
            <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Mapa de Calor de Densidad Horaria</h6>
            <span class="text-muted" style="font-size: 0.75rem;">Vista gerencial de operaciones. Los tonos más oscuros indican las horas "pico" con mayor saturación de instalaciones.</span>
          }
        </div>
      </div>
      
      <div class="border-start-md ps-md-3 mt-2 mt-md-0" style="min-width: 280px;">
        <div class="d-flex align-items-start bg-warning bg-opacity-10 p-2 rounded border border-warning border-opacity-25">
          <i class="bi bi-lightbulb-fill text-warning me-2 mt-1"></i>
          <div>
            <span class="d-block text-dark fw-bold" style="font-size: 0.75rem;">💡 Recomendación para evitar saturación:</span>
            <span class="text-muted lh-sm d-block" style="font-size: 0.7rem; margin-top: 2px;">
              El volumen de datos es muy alto. Para una lectura clara y no sobrecargar la pantalla, <b>siempre utiliza el filtro de Área/Salón o Profesor</b> antes de cambiar de vista.
            </span>
          </div>
        </div>
      </div>
    </div>"""

html = re.sub(old_banner_regex, new_banner, html, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(html)
