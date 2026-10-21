sed -i '' -e '/<span class="badge bg-secondary-subtle text-secondary rounded-pill" style="font-size: 0.65rem;">Inactiva<\/span>/a\
                  }\
                  @if (act.elegible_para_socios) {\
                    <span class="badge bg-primary-subtle text-primary rounded-pill" style="font-size: 0.65rem;" title="Visible para Socios"><i class="bi bi-person-check"></i> Socios</span>\
                  } @else {\
                    <span class="badge bg-warning-subtle text-warning rounded-pill" style="font-size: 0.65rem;" title="Uso Interno / Staff"><i class="bi bi-person-workspace"></i> Staff</span>\
' src/app/components/deportivo/actividades/deportivo-actividades.html
