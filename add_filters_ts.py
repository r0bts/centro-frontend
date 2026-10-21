import re

ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

# Add FormsModule
if 'FormsModule' not in ts:
    ts = ts.replace("imports: [CommonModule, ActividadWizardComponent],", "imports: [CommonModule, ActividadWizardComponent, FormsModule],")
    ts = "import { FormsModule } from '@angular/forms';\n" + ts

# Add ActividadFormData
if 'ActividadFormData' not in ts:
    ts = ts.replace("import { Actividad } from '../../../models/deportivo/actividad.model';", "import { Actividad, ActividadFormData } from '../../../models/deportivo/actividad.model';")

# Add state variables
state_add = """  // ── State ──────────────────────────────────────────────────────────────────
  formData      = signal<ActividadFormData | null>(null);
  filterClubId  = signal<number | null>(null);
  filterAreaId  = signal<number | null>(null);
  filterHorario = signal<string>('');"""
ts = ts.replace("  // ── State ──────────────────────────────────────────────────────────────────", state_add)

# Add load formData in ngOnInit
init_add = """  ngOnInit(): void {
    this.svc.getFormData().subscribe(res => {
      this.formData.set(res.data);
    });
    this.loadActividades();
  }"""
ts = re.sub(r'  ngOnInit\(\): void \{\s*this\.loadActividades\(\);\s*\}', init_add, ts)

# Add filteredActividades computed
computed_add = """import { computed } from '@angular/core';\n"""
if 'computed' not in ts:
    ts = ts.replace("import {", "import { computed,", 1)

filtered_comp = """
  filteredActividades = computed(() => {
    let list = this.actividades();
    const cId = this.filterClubId();
    const aId = this.filterAreaId();
    const searchH = this.filterHorario()?.toLowerCase().trim();

    if (cId) {
      list = list.filter(a => a.club_id === cId);
    }
    
    if (aId || searchH) {
      list = list.filter(a => {
        // If aId is set, does any grupo > horario match this area?
        // Wait, Actividad has `grupos_categorias`, let's search them.
        let matchArea = false;
        let matchHorario = false;

        const grupos = a.grupos_categorias || [];
        for (const g of grupos) {
          const equipos = g.equipos || [];
          for (const eq of equipos) {
            const horarios = eq.horarios || [];
            for (const h of horarios) {
              if (aId && h.area_id === aId) matchArea = true;
              
              if (searchH) {
                const dayMap = [null, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                const dayName = dayMap[h.dia_semana]?.toLowerCase() || '';
                if (dayName.includes(searchH) || h.hora_inicio?.includes(searchH) || h.hora_fin?.includes(searchH)) {
                  matchHorario = true;
                }
              }
            }
          }
        }
        
        if (aId && !matchArea) return false;
        if (searchH && !matchHorario) return false;
        return true;
      });
    }

    return list;
  });
"""
ts = ts.replace("  // delete", filtered_comp + "\n  // delete")

with open(ts_path, 'w') as f:
    f.write(ts)
print("Patched TS Filters!")
