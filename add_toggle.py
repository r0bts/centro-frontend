ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

toggle_method = """  toggleSocios(act: Actividad) {
    const newVal = act.elegible_para_socios === false ? true : false;
    act.elegible_para_socios = newVal;
    this.svc.update(act.id, act).subscribe({
      next: () => this.showToast(`Actividad cambiada a ${newVal ? 'Socios' : 'Staff'}.`),
      error: err => {
        console.error(err);
        act.elegible_para_socios = !newVal; // revert
        this.showToast('Error al actualizar acceso.');
      }
    });
  }

  toggleActive(act: Actividad): void {"""

ts = ts.replace("  toggleActive(act: Actividad): void {", toggle_method)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Added toggleSocios")
