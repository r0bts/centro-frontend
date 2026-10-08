import re

with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'r') as f:
    ts = f.read()

target = """      if (this.fecha_fin && this.fecha_fin < this.fecha_inicio) {
        this.error.set('La fecha fin no puede ser anterior a la fecha inicio.');
        return false;
      }
      if (this.tiene_costo && !this.monto) {
        this.error.set('Debes ingresar el monto a cobrar.');
        return false;
      }
    }
    return true;"""

replacement = """      if (this.fecha_fin && this.fecha_fin < this.fecha_inicio) {
        this.error.set('La fecha fin no puede ser anterior a la fecha inicio.');
        return false;
      }
    }
    if (this.currentStep() === 2) {
      if (this.tiene_costo && !this.monto) {
        this.error.set('Debes ingresar el monto a cobrar al socio.');
        return false;
      }
    }
    return true;"""

if target in ts:
    ts = ts.replace(target, replacement)
    with open('src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts', 'w') as f:
        f.write(ts)
    print("Patched validateCurrentStep.")
else:
    print("Could not find validation logic.")
