ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

duplicate_method = """  editActividad(act: Actividad): void {
    this.wizardEditTarget.set(act);
    this.wizardOpen.set(true);
  }

  duplicateActividad(act: Actividad): void {
    if (confirm(`¿Estás seguro de duplicar "${act.nombre}"?`)) {
      this.actividadSvc.duplicate(act.id).subscribe({
        next: () => {
          this.showToast('Actividad duplicada exitosamente');
          this.refreshActividades();
        },
        error: () => this.showToast('Error al duplicar', 'error')
      });
    }
  }"""

ts = ts.replace("""  editActividad(act: Actividad): void {
    this.wizardEditTarget.set(act);
    this.wizardOpen.set(true);
  }""", duplicate_method)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Added duplicate method")
