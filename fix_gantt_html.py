import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# 1. Update the header grid (th)
old_th_grid = """                <th class="p-0 border-0 bg-white">
                  <div style="display: grid; grid-template-columns: repeat(24, 120px);">
                    @for (h of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]; track h) {"""

new_th_grid = """                <th class="p-0 border-0 bg-white">
                  <div [style.display]="'grid'" [style.grid-template-columns]="'repeat(' + ganttBounds().hours.length + ', 120px)'">
                    @for (h of ganttBounds().hours; track h) {"""

html = html.replace(old_th_grid, new_th_grid)

# 2. Update the background guides grid
old_bg_grid = """                      <!-- Background Guides -->
                      <div class="position-absolute top-0 bottom-0 start-0" style="display: grid; grid-template-columns: repeat(24, 120px); pointer-events: none;">
                        @for (h of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]; track h) {"""

new_bg_grid = """                      <!-- Background Guides -->
                      <div class="position-absolute top-0 bottom-0 start-0" [style.display]="'grid'" [style.grid-template-columns]="'repeat(' + ganttBounds().hours.length + ', 120px)'" style="pointer-events: none;">
                        @for (h of ganttBounds().hours; track h) {"""

html = html.replace(old_bg_grid, new_bg_grid)

# 3. Update the events grid
old_events_grid = """                      <!-- Events Grid -->
                      <div class="py-1 px-0 position-relative" style="display: grid; grid-template-columns: repeat(48, 60px); grid-auto-rows: min-content; row-gap: 4px; column-gap: 0; min-height: 60px;">"""

new_events_grid = """                      <!-- Events Grid -->
                      <div class="py-1 px-0 position-relative" [style.display]="'grid'" [style.grid-template-columns]="'repeat(' + (ganttBounds().hours.length * 2) + ', 60px)'" style="grid-auto-rows: min-content; row-gap: 4px; column-gap: 0; min-height: 60px;">"""

html = html.replace(old_events_grid, new_events_grid)

with open(path, 'w') as f:
    f.write(html)
