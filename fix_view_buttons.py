path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_html = """      <div class="btn-group bg-white border rounded shadow-sm" role="group" style="padding: 2px;">
        <button type="button" class="btn btn-sm btn-light border-0" style="border-radius: 4px;" [class.bg-light]="viewMode() !== 'grid'" [class.bg-white]="viewMode() === 'grid'" [class.shadow-sm]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Vista de cuadrícula">
          <i class="bi bi-grid-fill" [class.text-primary]="viewMode() === 'grid'" [class.text-secondary]="viewMode() !== 'grid'"></i>
        </button>
        <button type="button" class="btn btn-sm btn-light border-0 mx-1" style="border-radius: 4px;" [class.bg-light]="viewMode() !== 'list'" [class.bg-white]="viewMode() === 'list'" [class.shadow-sm]="viewMode() === 'list'" (click)="viewMode.set('list')" title="Vista de lista">
          <i class="bi bi-list-ul" [class.text-primary]="viewMode() === 'list'" [class.text-secondary]="viewMode() !== 'list'"></i>
        </button>
        <button type="button" class="btn btn-sm btn-light border-0" style="border-radius: 4px;" [class.bg-light]="viewMode() !== 'calendar'" [class.bg-white]="viewMode() === 'calendar'" [class.shadow-sm]="viewMode() === 'calendar'" (click)="viewMode.set('calendar')" title="Vista de calendario">
          <i class="bi bi-calendar-week" [class.text-primary]="viewMode() === 'calendar'" [class.text-secondary]="viewMode() !== 'calendar'"></i>
        </button>
      </div>"""

new_html = """      <div class="d-flex align-items-center bg-white border rounded-pill p-1 shadow-sm">
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

html = html.replace(old_html, new_html)

with open(path, 'w') as f:
    f.write(html)
print("Updated view mode buttons")
