path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_html = """      <div class="d-flex align-items-center bg-white border rounded-pill p-1 shadow-sm">
        <button type="button" class="btn btn-sm border-0 rounded-pill" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                [class.btn-primary]="viewMode() === 'grid'" [class.text-secondary]="viewMode() !== 'grid'" [class.bg-transparent]="viewMode() !== 'grid'"
                (click)="viewMode.set('grid')" title="Vista de cuadrícula">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill mx-1" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                [class.btn-primary]="viewMode() === 'list'" [class.text-secondary]="viewMode() !== 'list'" [class.bg-transparent]="viewMode() !== 'list'"
                (click)="viewMode.set('list')" title="Vista de lista">
          <i class="bi bi-list-ul" style="font-size: 1.1rem;"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                [class.btn-primary]="viewMode() === 'calendar'" [class.text-secondary]="viewMode() !== 'calendar'" [class.bg-transparent]="viewMode() !== 'calendar'"
                (click)="viewMode.set('calendar')" title="Vista de calendario">
          <i class="bi bi-calendar-week"></i>
        </button>
      </div>"""

new_html = """      <div class="d-flex align-items-center bg-white border rounded-pill p-1 shadow-sm" style="position: relative; isolation: isolate;">
        <div class="position-absolute bg-primary rounded-pill shadow-sm" 
             style="height: 32px; width: 36px; top: 3px; left: 3px; z-index: 0; transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);"
             [ngStyle]="{'transform': viewMode() === 'grid' ? 'translateX(0px)' : (viewMode() === 'list' ? 'translateX(40px)' : 'translateX(80px)')}">
        </div>
        <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'grid'" [class.text-secondary]="viewMode() !== 'grid'"
                (click)="viewMode.set('grid')" title="Vista de cuadrícula">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill mx-1 position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'list'" [class.text-secondary]="viewMode() !== 'list'"
                (click)="viewMode.set('list')" title="Vista de lista">
          <i class="bi bi-list-ul" style="font-size: 1.1rem;"></i>
        </button>
        <button type="button" class="btn btn-sm border-0 rounded-pill position-relative" style="width: 36px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 1; transition: color 0.3s;"
                [class.text-white]="viewMode() === 'calendar'" [class.text-secondary]="viewMode() !== 'calendar'"
                (click)="viewMode.set('calendar')" title="Vista de calendario">
          <i class="bi bi-calendar-week"></i>
        </button>
      </div>"""

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated segmented control to bubble style")
