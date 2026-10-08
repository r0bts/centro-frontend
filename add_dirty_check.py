path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

state_methods = """
  // ── Detección de cambios sin guardar ────────────────────────────────────────
  savedStateHash = '';
  hasUnsavedChanges = signal(false);

  getHash(): string {
    return JSON.stringify({
      club_id: this.club_id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      icono: this.icono,
      color: this.color,
      tipo: this.tipo,
      modo_mensajeria: this.modo_mensajeria,
      tiene_costo: this.tiene_costo,
      elegible_para_socios: this.elegible_para_socios,
      fecha_inicio: this.fecha_inicio,
      fecha_fin: this.fecha_fin,
      monto: this.monto,
      grupos: this.grupos(),
      criterios: this.criterios()
    });
  }

  ngDoCheck(): void {
    if (this.isEditing() && this.savedStateHash) {
      const currentHash = this.getHash();
      this.hasUnsavedChanges.set(currentHash !== this.savedStateHash);
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
"""

ts = ts.replace("  // ── Lifecycle ────────────────────────────────────────────────────────────────", state_methods)

# In ngOnInit, after patchFromEdit or initially:
ngoninit_end = """        if (detailRes) {
          this.originalActividad.set(detailRes.data);
          this.patchFromEdit(detailRes.data);
          // Wait a tick for signals to propagate before hashing
          setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        } else {
          setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
        }
        this.loadingDetail.set(false);"""

ts = ts.replace("""        if (detailRes) {
          this.originalActividad.set(detailRes.data);
          this.patchFromEdit(detailRes.data);
        }
        this.loadingDetail.set(false);""", ngoninit_end)


# Publish signature
ts = ts.replace("  async publish(): Promise<void> {", "  async publish(closeModal = true): Promise<void> {")

# Publish end
publish_end = """      this.saving.set(false);
      if (closeModal) {
        document.body.style.overflow = '';
        this.saved.emit(this.isEditing() ? 'Actividad actualizada' : 'Actividad creada correctamente');
      } else {
        // Refrescar estado silenciosamente para seguir editando
        const detailRes = await firstValueFrom(this.svc.getById(actividadId!));
        this.originalActividad.set(detailRes.data);
        this.patchFromEdit(detailRes.data);
        setTimeout(() => { this.savedStateHash = this.getHash(); this.hasUnsavedChanges.set(false); }, 0);
      }

    } catch (err: any) {"""

ts = ts.replace("""      this.saving.set(false);
      document.body.style.overflow = '';
      this.saved.emit(this.isEditing() ? 'Actividad actualizada' : 'Actividad creada correctamente');

    } catch (err: any) {""", publish_end)

# We need ngDoCheck in imports and implements
if "DoCheck" not in ts:
    ts = ts.replace("OnInit,", "OnInit, DoCheck,")
    ts = ts.replace("implements OnInit {", "implements OnInit, DoCheck {")

with open(path, 'w') as f:
    f.write(ts)
print("Added unsaved changes logic")
