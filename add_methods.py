path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

methods = """  openInlineForm(equipoId: number, dia: number, profesorId: number) {
    this.inlineFormEquipoId.set(equipoId);
    this.inlineFormDia.set(dia);
    this.inlineFormProfesorId.set(profesorId);
    this.horarioForm.dia_semana = dia;
    this.horarioForm.hora_inicio = '09:00';
    this.horarioForm.hora_fin = '10:00';
  }

  async saveInlineForm() {
    const equipoId = this.inlineFormEquipoId();
    const profId = this.inlineFormProfesorId();
    if (!equipoId) return;

    const act = this.selectedActividadForHorarios();
    if (!act) return;
    
    try {
      const payload: any = {
        dia_semana: Number(this.horarioForm.dia_semana),
        hora_inicio: this.horarioForm.hora_inicio + ':00',
        hora_fin: this.horarioForm.hora_fin + ':00'
      };
      
      if (profId && profId > 0) {
        payload.profesor_id = profId;
      }

      const res = await firstValueFrom(this.svc.createHorario(equipoId, payload));
      
      const g = act.grupos_categorias?.find(g => g.equipos?.some(e => e.id === equipoId));
      if (g) {
        const e = g.equipos?.find(e => e.id === equipoId);
        if (e) {
          if (!e.horarios) e.horarios = [];
          e.horarios.push(res.data);
        }
      }
      this.selectedActividadForHorarios.set({...act});
      this.showToast('Horario agregado');
      this.inlineFormEquipoId.set(null);
      this.loadActividades();
    } catch (error: any) {
      this.error.set(error.message || 'Error al agregar el horario');
      setTimeout(() => this.error.set(null), 3000);
    }
  }

  closeHorariosOffcanvas() {"""

ts = ts.replace("  closeHorariosOffcanvas() {", methods)

with open(path, 'w') as f:
    f.write(ts)
print("Added methods")
