import re

path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

# We'll replace the entire publish method
publish_regex = re.compile(r'  async publish\(closeModal = true\): Promise<void> \{.*?\n  \}\n', re.DOTALL)

new_publish = """  async publish(closeModal = true): Promise<void> {
    if (!this.validateCurrentStep()) return;
    this.saving.set(true);
    this.error.set(null);

    const user = this.auth.getCurrentUser();
    const userId = user?.id ?? 0;

    try {
      let actividadId: number;
      
      let oldState: any = null;
      if (this.isEditing() && this.savedStateHash) {
         try { oldState = JSON.parse(this.savedStateHash); } catch(e){}
      }
      const gruposCriteriosChanged = !oldState || 
          JSON.stringify(this.grupos()) !== JSON.stringify(oldState.grupos) ||
          JSON.stringify(this.criterios()) !== JSON.stringify(oldState.criterios);

      if (this.isEditing()) {
        const res = await firstValueFrom(this.svc.update(this.editActividad!.id, {
          nombre:          this.nombre.trim(),
          descripcion:     this.descripcion.trim() || undefined,
          icono:           this.icono,
          color:           this.color,
          tipo:            this.tipo,
          modo_mensajeria: this.modo_mensajeria,
          tiene_costo:     this.tiene_costo,
          fecha_inicio:    this.fecha_inicio || null,
          fecha_fin:       this.fecha_fin    || null,
          monto:           this.tiene_costo ? (this.monto ?? null) : null,
        }));
        actividadId = res.data.id;

        if (gruposCriteriosChanged) {
          const current = this.originalActividad();
          if (current) {
            const delHorarios = [];
            for (const g of current.grupos_categorias ?? [])
              for (const e of g.equipos ?? [])
                for (const h of e.horarios ?? [])
                  delHorarios.push(firstValueFrom(this.svc.deleteHorario(e.id, h.id)));
            await Promise.all(delHorarios);

            const delEquipos = [];
            for (const g of current.grupos_categorias ?? [])
              for (const e of g.equipos ?? [])
                delEquipos.push(firstValueFrom(this.svc.deleteEquipo(e.id)));
            await Promise.all(delEquipos);

            const delGrupos = [];
            for (const g of current.grupos_categorias ?? [])
              delGrupos.push(firstValueFrom(this.svc.deleteGrupo(g.id)));
            await Promise.all(delGrupos);

            const delCriterios = [];
            for (const c of current.criterios_evaluacion ?? [])
              delCriterios.push(firstValueFrom(this.svc.deleteCriterio(c.id)));
            await Promise.all(delCriterios);
          }
        }
      } else {
        const res = await firstValueFrom(this.svc.create({
          club_id:         this.club_id!,
          nombre:          this.nombre.trim(),
          descripcion:     this.descripcion.trim() || undefined,
          icono:           this.icono,
          color:           this.color,
          tipo:            this.tipo,
          modo_mensajeria: this.modo_mensajeria,
          tiene_costo:     this.tiene_costo,
          fecha_inicio:    this.fecha_inicio || undefined,
          fecha_fin:       this.fecha_fin    || undefined,
          monto:           this.tiene_costo ? (this.monto ?? undefined) : undefined,
          is_active:       true,
          created_by:      userId,
        }));
        actividadId = res.data.id;
      }

      if (gruposCriteriosChanged) {
        // Create Grupos sequentially so `orden` implies creation order, or we can just pass `orden` explicitly.
        // Actually, let's keep it sequential for creation to be safe with DB constraints and IDs.
        for (let gi = 0; gi < this.grupos().length; gi++) {
          const g = this.grupos()[gi];
          const gRes = await firstValueFrom(this.svc.createGrupo({
            actividad_id: actividadId!,
            nombre:       g.nombre,
            descripcion:  g.descripcion || undefined,
            edad_min:     g.edad_min ?? undefined,
            edad_max:     g.edad_max ?? undefined,
            tiene_cupo:   g.tiene_cupo,
            cupo_maximo:  g.tiene_cupo ? (g.cupo_maximo ?? undefined) : undefined,
            orden:        gi,
            is_active:    true,
          }));
          const grupoId = gRes.data.id;

          const equiposACrear = g.horarios.length > 0
            ? [{ nombre: 'General', color: this.color, coach_id: g.instructor_id }]
            : [];

          for (const eq of equiposACrear) {
            const eRes = await firstValueFrom(this.svc.createEquipo({
              grupo_id:  grupoId,
              nombre:    eq.nombre,
              color:     eq.color || undefined,
              coach_id:  eq.coach_id ?? undefined,
              is_active: true,
              elegible_para_socios: this.elegible_para_socios,
            }));
            const equipoId = eRes.data.id;

            const postHorarios = g.horarios.map(h => firstValueFrom(this.svc.createHorario(equipoId, {
                dia_semana:  h.dia_semana,
                hora_inicio: h.hora_inicio,
                hora_fin:    h.hora_fin,
                lugar:       h.lugar ?? undefined,
                area_id:     h.area_id ?? undefined,
                profesor_id: h.profesor_id ?? undefined,
                costo_interno: h.costo_interno ?? undefined,
                is_active:   true,
              })));
            await Promise.all(postHorarios);
          }
        }

        const postCriterios = this.criterios().map((c, ci) => firstValueFrom(this.svc.createCriterio({
            actividad_id: actividadId!,
            nombre:       c.nombre,
            descripcion:  c.descripcion || undefined,
            escala_min:   c.escala_min,
            escala_max:   c.escala_max,
            orden:        ci,
            is_active:    true,
          })));
        await Promise.all(postCriterios);
      }

      this.saving.set(false);
      if (closeModal) {
        document.body.style.overflow = '';
        this.saved.emit(this.isEditing() ? 'Actividad actualizada' : 'Actividad creada correctamente');
      } else {
        const detailRes = await firstValueFrom(this.svc.getById(actividadId!));
        this.originalActividad.set(detailRes.data);
        if (gruposCriteriosChanged) {
           this.patchFromEdit(detailRes.data);
        }
        setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        this.silentlySaved.emit();
      }

    } catch (err: any) {
      this.saving.set(false);
      this.error.set('Error al guardar la actividad. Verifica los datos e intenta de nuevo.');
    }
  }
"""

ts = publish_regex.sub(new_publish, ts)

with open(path, 'w') as f:
    f.write(ts)
print("Optimized publish()")
