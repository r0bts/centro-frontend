path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_creation = """      if (gruposCriteriosChanged) {
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
        }"""

new_creation = """      if (gruposCriteriosChanged) {
        const groupPromises = this.grupos().map(async (g, gi) => {
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

          const equipoPromises = equiposACrear.map(async (eq) => {
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
          });
          
          await Promise.all(equipoPromises);
        });
        
        await Promise.all(groupPromises);"""

ts = ts.replace(old_creation, new_creation)

with open(path, 'w') as f:
    f.write(ts)
print("Updated parallel creation")
