path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

# Replace the card container logic to include the color-mix background
old_card_start = """                          <div class="card border-0 shadow-sm session-card flex-shrink-0 overflow-hidden" 
                               [style.grid-column]="getGridColumn(session.start, session.end)"
                               [style.border-left]="'4px solid ' + session.actColor"
                               style="cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; min-width: 0;"
                               (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false"
                               (click)="openHorariosOffcanvas(session.actRef)">
                             <div class="card-body p-1 d-flex flex-column" [class.bg-light]="session.hovered" style="min-width: 0;">"""

new_card_start = """                          <div class="card shadow-sm session-card flex-shrink-0 overflow-hidden" 
                               [style.grid-column]="getGridColumn(session.start, session.end)"
                               [style.border]="'1px solid color-mix(in srgb, ' + session.actColor + ' 30%, transparent)'"
                               [style.border-left]="'4px solid ' + session.actColor"
                               [style.background-color]="session.hovered ? 'color-mix(in srgb, ' + session.actColor + ' 15%, white)' : 'color-mix(in srgb, ' + session.actColor + ' 8%, white)'"
                               style="cursor: pointer; transition: background-color 0.2s, box-shadow 0.2s; min-width: 0;"
                               (mouseenter)="session.hovered = true" (mouseleave)="session.hovered = false"
                               (click)="openHorariosOffcanvas(session.actRef)">
                             <div class="card-body p-1 d-flex flex-column" style="min-width: 0; background: transparent;">"""

if old_card_start in html:
    html = html.replace(old_card_start, new_card_start)
    with open(path, 'w') as f:
        f.write(html)
    print("Cards painted with pastel tint successfully!")
else:
    print("Could not find the exact HTML string to replace.")
