path = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path, 'r') as f:
    html = f.read()

import re

old_tail = """              }
            </div>
          }
            </div>

        }
      </div>
    </div>
  }
  <!-- ── Wizard ── -->"""

new_tail = """              }
            </div>
            </div> <!-- CIERRA .equipo-section-wrapper -->
          }
        }
      </div>
    </div>
  }
  <!-- ── Wizard ── -->"""

html = html.replace(old_tail, new_tail)

with open(path, 'w') as f:
    f.write(html)
print("Updated tail")
