# Remove the old text rows in the card
sed -i '' -e '/@if (act.elegible_para_socios) {/,/}/d' src/app/components/deportivo/actividades/deportivo-actividades.html

# Add badge to the top row of the card (next to Activa)
sed -i '' -e '/<span class="badge bg-secondary-subtle text-secondary rounded-pill px-2 border border-secondary-subtle">Inactiva<\/span>/a\
              }\
              @if (act.elegible_para_socios) {\
                <span class="badge bg-primary-subtle text-primary rounded-pill px-2 border border-primary-subtle" title="Visible para Socios"><i class="bi bi-person-check"></i> Socios</span>\
              } @else {\
                <span class="badge bg-warning-subtle text-warning rounded-pill px-2 border border-warning-subtle" title="Uso Interno / Staff"><i class="bi bi-person-workspace"></i> Staff</span>\
' src/app/components/deportivo/actividades/deportivo-actividades.html

# Also remove the duplicate trailing `}` that the `a\` will leave if I'm not careful. Actually, wait.
