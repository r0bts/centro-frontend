path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

# Add state variables
if "selectedActividadForHorarios = signal" not in ts:
    ts = ts.replace("deleteTarget = signal<Actividad | null>(null);", 
                    "deleteTarget = signal<Actividad | null>(null);\n  selectedActividadForHorarios = signal<Actividad | null>(null);\n  isOffcanvasOpen = signal(false);\n  horarioForm = {\n    dia_semana: 1,\n    hora_inicio: '08:00',\n    hora_fin: '09:00',\n    profesor_id: null as number | null\n  };")

# Add methods
if "openHorariosOffcanvas" not in ts:
    methods = """
  openHorariosOffcanvas(act: Actividad) {
    this.selectedActividadForHorarios.set(act);
    this.isOffcanvasOpen.set(true);
    // Reset form
    this.horarioForm = { dia_semana: 1, hora_inicio: '08:00', hora_fin: '09:00', profesor_id: null };
  }

  closeHorariosOffcanvas() {
    this.isOffcanvasOpen.set(false);
    setTimeout(() => this.selectedActividadForHorarios.set(null), 300);
  }

  async deleteHorarioRapido(actId: number, equipoId: number, horarioId: number) {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await firstValueFrom(this.svc.deleteHorario(equipoId, horarioId));
      this.showToast('Horario eliminado.');
      this.loadActividades(); // Reload to reflect changes
      // Update local state for offcanvas directly
      this.selectedActividadForHorarios.update(act => {
        if (!act) return null;
        for (const g of act.grupos_categorias ?? []) {
          for (const e of g.equipos ?? []) {
            if (e.id === equipoId && e.horarios) {
              e.horarios = e.horarios.filter(h => h.id !== horarioId);
            }
          }
        }
        return { ...act };
      });
    } catch (e) {
      this.showToast('Error al eliminar horario');
    }
  }

  async addHorarioRapido(equipoId: number) {
    const act = this.selectedActividadForHorarios();
    if (!act) return;
    
    try {
      const res = await firstValueFrom(this.svc.createHorario(equipoId, {
        dia_semana: Number(this.horarioForm.dia_semana),
        hora_inicio: this.horarioForm.hora_inicio + ':00',
        hora_fin: this.horarioForm.hora_fin + ':00',
        profesor_id: this.horarioForm.profesor_id || undefined,
        is_active: true
      }));
      
      this.showToast('Horario agregado.');
      this.loadActividades();
      
      this.selectedActividadForHorarios.update(a => {
        if (!a) return null;
        for (const g of a.grupos_categorias ?? []) {
          for (const e of g.equipos ?? []) {
            if (e.id === equipoId) {
              if (!e.horarios) e.horarios = [];
              e.horarios.push(res.data);
            }
          }
        }
        return { ...a };
      });
    } catch (e) {
      this.showToast('Error al agregar horario');
    }
  }
"""
    ts = ts.replace("executeDelete(): void {", methods + "\n  executeDelete(): void {")

# we need `firstValueFrom` from rxjs. Let's make sure it's imported.
if "firstValueFrom" not in ts:
    ts = ts.replace("import { Observable, Subscription } from 'rxjs';", "import { Observable, Subscription, firstValueFrom } from 'rxjs';")

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS with offcanvas logic")
