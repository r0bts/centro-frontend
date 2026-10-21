import re

html_path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(html_path, 'r') as f:
    html = f.read()

# We will replace the content of <div class="activity-card" ...> to match the image.

# First, find the block for the card.
# It starts with: <div class="activity-card" [class.inactive]="!act.is_active">
# And ends before: <!-- Estado vacío -->

card_template = """        <div class="activity-card" [class.inactive]="!act.is_active" style="display: flex; flex-direction: column; height: 100%; border-radius: 12px; padding: 1.25rem;">
          
          <!-- Top Row -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="activity-icon-wrap" [style.background]="act.color || '#e83e8c'" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <span>{{ act.icono || '💃' }}</span>
            </div>
            <div class="d-flex flex-column align-items-end gap-1">
              @if (act.is_active) {
                <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1" style="font-size: 0.75rem; font-weight: 700;">Activa</span>
              } @else {
                <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2 py-1" style="font-size: 0.75rem; font-weight: 700;">Inactiva</span>
              }
              
              @if (act.elegible_para_socios !== false) {
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 d-flex align-items-center gap-1" style="font-size: 0.75rem; font-weight: 700;">
                  <i class="bi bi-person-check"></i> Socios
                </span>
              } @else {
                <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2 py-1 d-flex align-items-center gap-1" style="font-size: 0.75rem; font-weight: 700;">
                  <i class="bi bi-building"></i> Staff
                </span>
              }
            </div>
          </div>

          <!-- Info -->
          <div class="mb-3">
            <h6 class="mb-1 fw-bold text-uppercase" style="font-size: 1rem; color: #333;">{{ act.nombre }}</h6>
            <p class="text-muted small mb-0" style="font-size: 0.85rem;">{{ act.descripcion || 'Sin descripción' }}</p>
          </div>

          <!-- Meta list -->
          <div class="d-flex flex-column gap-2 mb-3" style="font-size: 0.85rem; color: #6c757d;">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-geo-alt"></i>
              <span>Todas las unidades</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-people"></i>
              <span>{{ (act.grupos_categorias?.length ?? 0) }} grupos configurados</span>
            </div>
          </div>

          <!-- Badges below list -->
          <div class="d-flex flex-wrap gap-2 mb-auto pb-3">
            <span class="badge border text-dark fw-normal rounded-pill px-2 py-1" style="font-size: 0.75rem; background: #fff;">{{ act.tipo || 'deporte_individual' }}</span>
          </div>

          <hr class="mt-0 mb-3" style="border-color: #e9ecef;">

          <!-- Footer -->
          <div class="d-flex justify-content-between align-items-center">
            <!-- Switch -->
            <div class="form-check form-switch mb-0 d-flex align-items-center gap-2" style="padding-left: 0;" [title]="act.is_active ? 'Desactivar actividad' : 'Activar actividad'">
              <input class="form-check-input m-0" type="checkbox" role="switch"
                     [checked]="act.is_active" 
                     (change)="toggleActive(act)"
                     style="cursor: pointer; width: 2.2rem; height: 1.1rem;">
              <label class="form-check-label small text-dark mb-0" style="cursor: pointer; font-size: 0.85rem;" (click)="toggleActive(act); $event.preventDefault()">
                Activa
              </label>
            </div>
            
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center text-muted"
                      style="width: 32px; height: 32px; border-radius: 6px; background-color: #f8f9fa;"
                      title="Duplicar"
                      (click)="duplicateActividad(act)">
                <i class="bi bi-files"></i>
              </button>
              <button class="btn btn-sm btn-light border d-flex align-items-center justify-content-center text-danger"
                      style="width: 32px; height: 32px; border-radius: 6px; background-color: #f8f9fa;"
                      title="Eliminar"
                      (click)="confirmDelete(act)">
                <i class="bi bi-trash"></i>
              </button>
              <button class="btn btn-sm btn-primary px-3"
                      style="border-radius: 16px; font-weight: 600; font-size: 0.85rem; background-color: #3b71ca; border-color: #3b71ca;"
                      title="Editar"
                      (click)="editActividad(act)">
                Editar
              </button>
            </div>
          </div>
        </div>"""

pattern = re.compile(r'<div class="activity-card" \[class\.inactive\]="!act\.is_active">.*?</div>\s*</div>\s*\}', re.DOTALL)
html = pattern.sub(card_template + "\n      }", html)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML")
