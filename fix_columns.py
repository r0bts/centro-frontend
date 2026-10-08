import re

html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Elegibilidad
target1 = """            <label class="mensajeria-option" [class.selected]="elegible_para_socios">
              <div>
                <div class="fw-semibold">¿Exclusivo para Socios?</div>
                <small class="text-muted">Desactiva esta opción si la actividad está abierta a invitados o externos.</small>
              </div>
              <div class="form-check form-switch ms-auto mb-0">
                <input class="form-check-input" type="checkbox" role="switch"
                       [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer">
              </div>
            </label>"""

replacement1 = """            <label class="mensajeria-option" [class.selected]="elegible_para_socios">
              <div class="fw-semibold" style="flex: 0 0 220px;">¿Exclusivo para Socios?</div>
              <small class="text-muted" style="flex: 1;">Desactiva esta opción si la actividad está abierta a invitados o externos.</small>
              <div class="form-check form-switch ms-auto mb-0" style="padding-left: 2.5rem;">
                <input class="form-check-input m-0" type="checkbox" role="switch"
                       [(ngModel)]="elegible_para_socios" style="width:2.5rem;height:1.25rem;cursor:pointer; margin-left: -2.5rem !important;">
              </div>
            </label>"""
html = html.replace(target1, replacement1)


# Mensajería
target2 = """                <label class="mensajeria-option" [class.selected]="modo_mensajeria === opt.val">
                  <input type="radio" [(ngModel)]="modo_mensajeria" [value]="opt.val" class="visually-hidden">
                  <div>
                    <div class="fw-semibold">{{ opt.label }}</div>
                    <small class="text-muted">{{ opt.desc }}</small>
                  </div>
                  @if (modo_mensajeria === opt.val) {
                    <i class="bi bi-check-circle-fill text-primary ms-auto"></i>
                  }
                </label>"""

replacement2 = """                <label class="mensajeria-option" [class.selected]="modo_mensajeria === opt.val">
                  <input type="radio" [(ngModel)]="modo_mensajeria" [value]="opt.val" class="visually-hidden">
                  <div class="fw-semibold" style="flex: 0 0 220px;">{{ opt.label }}</div>
                  <small class="text-muted" style="flex: 1;">{{ opt.desc }}</small>
                  @if (modo_mensajeria === opt.val) {
                    <i class="bi bi-check-circle-fill text-primary fs-5 ms-auto"></i>
                  } @else {
                    <i class="bi bi-circle text-muted fs-5 ms-auto" style="opacity: 0.3;"></i>
                  }
                </label>"""
html = html.replace(target2, replacement2)

with open(html_path, 'w') as f:
    f.write(html)
print("Updated columns!")
