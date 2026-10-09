path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    lines = f.readlines()

new_view_selector = """      <div class="d-flex align-items-center bg-white border rounded-pill p-1 shadow-sm" style="position: relative; isolation: isolate;">
        <div class="position-absolute bg-primary rounded-pill shadow-sm" 
             style="height: 32px; width: 36px; top: 0.25rem; left: 0.25rem; z-index: 0; transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);"
             [ngStyle]="{'transform': viewMode() === 'grid' ? 'translateX(0px)' : (viewMode() === 'list' ? 'translateX(40px)' : (viewMode() === 'calendar' ? 'translateX(80px)' : (viewMode() === 'classic' ? 'translateX(120px)' : 'translateX(160px)')))}">
        </div>
        <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'grid'" [class.text-secondary]="viewMode() !== 'grid'"
                (click)="viewMode.set('grid')" title="Cuadrícula">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill mx-1 position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'list'" [class.text-secondary]="viewMode() !== 'list'"
                (click)="viewMode.set('list')" title="Lista">
          <i class="bi bi-list-ul" style="font-size: 1.1rem;"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'calendar'" [class.text-secondary]="viewMode() !== 'calendar'"
                (click)="viewMode.set('calendar')" title="Línea de tiempo">
          <i class="bi bi-distribute-horizontal"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill mx-1 position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'classic'" [class.text-secondary]="viewMode() !== 'classic'"
                (click)="viewMode.set('classic')" title="Agenda Clásica">
          <i class="bi bi-calendar-week"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'heatmap'" [class.text-secondary]="viewMode() !== 'heatmap'"
                (click)="viewMode.set('heatmap')" title="Mapa de Calor">
          <i class="bi bi-grid-3x3-gap-fill"></i>
        </button>
      </div>\n"""

# Replace lines 13 to 33 (0-indexed 13 to 33 is slice 13:34)
lines[13:34] = [new_view_selector]

# Write back
with open(path, 'w') as f:
    f.writelines(lines)
