path_wizard = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path_wizard, 'r') as f:
    ts_wizard = f.read()

import re

ts_wizard = ts_wizard.replace("@Output() saved     = new EventEmitter<string>();", "@Output() saved     = new EventEmitter<string>();\n  @Output() silentlySaved = new EventEmitter<void>();")

silent_emit = """        const detailRes = await firstValueFrom(this.svc.getById(actividadId!));
        this.originalActividad.set(detailRes.data);
        this.patchFromEdit(detailRes.data);
        setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        this.silentlySaved.emit();"""

ts_wizard = ts_wizard.replace("""        const detailRes = await firstValueFrom(this.svc.getById(actividadId!));
        this.originalActividad.set(detailRes.data);
        this.patchFromEdit(detailRes.data);
        setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);""", silent_emit)

with open(path_wizard, 'w') as f:
    f.write(ts_wizard)


path_parent = 'src/app/components/deportivo/actividades/deportivo-actividades.html'
with open(path_parent, 'r') as f:
    html_parent = f.read()

html_parent = html_parent.replace("(saved)=\"onWizardSaved($event)\"", "(saved)=\"onWizardSaved($event)\"\n      (silentlySaved)=\"refreshActividades()\"")

with open(path_parent, 'w') as f:
    f.write(html_parent)

print("Added silentlySaved event")
