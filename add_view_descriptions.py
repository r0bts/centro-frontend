import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

banner_html = """    </div>
    
    <!-- ── View Description Banner ── -->
    <div class="alert alert-light border shadow-sm d-flex align-items-center py-2 mb-4" style="border-radius: 10px;">
      <i class="bi bi-info-circle text-primary fs-5 me-3"></i>
      <div>
        @if (viewMode() === 'grid') {
          <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Vista de Tarjetas</h6>
          <span class="text-muted" style="font-size: 0.75rem;">Explora todas las actividades en un formato visual, ideal para navegación general y ver el estatus rápido de cada disciplina.</span>
        } @else if (viewMode() === 'list') {
          <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Vista de Tabla Dinámica</h6>
          <span class="text-muted" style="font-size: 0.75rem;">Analiza los datos en formato de lista. Utiliza los filtros superiores para segmentar masivamente y encontrar información específica.</span>
        } @else if (viewMode() === 'calendar') {
          <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Línea de Tiempo (Gantt)</h6>
          <span class="text-muted" style="font-size: 0.75rem;">Visualiza la duración exacta y cruces de horarios a lo largo del día. Indispensable para detectar empalmes visualmente.</span>
        } @else if (viewMode() === 'classic') {
          <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Agenda Clásica por Bloques</h6>
          <span class="text-muted" style="font-size: 0.75rem;">Genera un horario estructurado tradicional. <b>Tip:</b> Filtra por un Salón o Profesor específico para revisar o imprimir su agenda semanal.</span>
        } @else if (viewMode() === 'heatmap') {
          <h6 class="mb-0 fw-bold text-dark" style="font-size: 0.85rem;">Mapa de Calor de Densidad Horaria</h6>
          <span class="text-muted" style="font-size: 0.75rem;">Vista gerencial de operaciones. Los tonos más oscuros indican las horas "pico" con mayor saturación de instalaciones simultáneas.</span>
        }
      </div>
    </div>"""

# Find the end of the filters card.
# The filters block ends with:
#           </div>
#         </div>
#       </div>
#     </div>
# Then comes `@if (viewMode() === 'grid') {`

# Let's use a regex to replace the exact spot before `@if (viewMode() === 'grid') {`
regex = r'(    </div>\s*)(@if \(viewMode\(\) === \'grid\'\) {)'

if "View Description Banner" not in html:
    html = re.sub(regex, banner_html + r'\n\n\2', html)
    with open(path, 'w') as f:
        f.write(html)
    print("Added View Description Banner!")
else:
    print("Banner already exists!")

