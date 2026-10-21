ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

calendar_logic = """  formatHora(hora: string): string {
    if (!hora) return '';
    const parts = hora.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  calendarDays = computed(() => {
    const list = this.filteredActividades();
    const days = [
      { dia: 1, nombre: 'Lunes', eventos: [] as any[] },
      { dia: 2, nombre: 'Martes', eventos: [] as any[] },
      { dia: 3, nombre: 'Miércoles', eventos: [] as any[] },
      { dia: 4, nombre: 'Jueves', eventos: [] as any[] },
      { dia: 5, nombre: 'Viernes', eventos: [] as any[] },
      { dia: 6, nombre: 'Sábado', eventos: [] as any[] },
      { dia: 7, nombre: 'Domingo', eventos: [] as any[] },
    ];

    for (const act of list) {
      if (!act.grupos_categorias) continue;
      for (const gc of act.grupos_categorias) {
        if (!gc.equipos) continue;
        for (const eq of gc.equipos) {
          if (!eq.horarios) continue;
          for (const h of eq.horarios) {
            const day = days.find(d => d.dia === h.dia_semana);
            if (day) {
              day.eventos.push({ act, h, equipoNombre: eq.nombre, grupoNombre: gc.nombre });
            }
          }
        }
      }
    }

    days.forEach(d => {
      d.eventos.sort((a, b) => (a.h.hora_inicio || '').localeCompare(b.h.hora_inicio || ''));
    });

    return days;
  });

  filteredActividades = computed(() => {"""

if "calendarDays =" not in ts:
    ts = ts.replace("  filteredActividades = computed(() => {", calendar_logic)
    with open(ts_path, 'w') as f:
        f.write(ts)
    print("Inserted calendar logic")
else:
    print("Already inserted")

