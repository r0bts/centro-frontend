import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TorneoEquipoService } from '../../../services/deportivo/torneo-equipo.service';
import { TorneoService } from '../../../services/deportivo/torneo.service';
import { TorneoEquipo, EquipoTorneoInscripcion } from '../../../models/deportivo/torneo-equipo.model';
import { Torneo, FORMATO_META } from '../../../models/deportivo/torneo.model';
import { EquipoTorneoWizardComponent } from './equipo-torneo-wizard/equipo-torneo-wizard';
import { EquipoTorneoDetalleComponent } from './equipo-torneo-detalle/equipo-torneo-detalle';

@Component({
  selector: 'app-deportivo-equipos-torneo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, EquipoTorneoWizardComponent, EquipoTorneoDetalleComponent],
  templateUrl: './deportivo-equipos-torneo.html',
  styleUrl: './deportivo-equipos-torneo.scss',
})
export class DeportivoEquiposTorneoComponent implements OnInit {

  // ── Signals ──────────────────────────────────────────────────────────────────
  readonly equipos   = signal<TorneoEquipo[]>([]);
  readonly loading   = signal(false);
  readonly error     = signal<string | null>(null);

  // Filtros
  readonly filtroActivo  = signal<boolean | null>(null);
  readonly busqueda      = signal('');

  // Wizard / detalle
  readonly showWizard    = signal(false);
  readonly showDetalle   = signal(false);
  readonly editando      = signal<TorneoEquipo | null>(null);
  readonly equipoActivo  = signal<TorneoEquipo | null>(null);
  readonly successMsg    = signal<string | null>(null);

  // Modal de inscripción a torneo
  readonly torneos             = signal<Torneo[]>([]);
  readonly showInscribir       = signal(false);
  readonly equipoParaInscribir = signal<TorneoEquipo | null>(null);
  readonly torneosDelEquipo    = signal<EquipoTorneoInscripcion[]>([]);
  readonly loadingTorneos      = signal(false);
  readonly inscribiendoError   = signal<string | null>(null);
  readonly inscribiendoOk      = signal<string | null>(null);
  readonly inscribiendo        = signal(false);
  torneoIdSeleccionado: number | null = null;

  // Modal de confirmación de eliminar
  readonly deleteTarget        = signal<TorneoEquipo | null>(null);
  readonly deleting            = signal(false);

  // Confirmación inline de desinscribir
  readonly desinscribirTarget  = signal<EquipoTorneoInscripcion | null>(null);
  readonly desinscribiendo     = signal(false);

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly equiposFiltrados = computed(() => {
    let lista = this.equipos();
    const act = this.filtroActivo();
    const q   = this.busqueda().toLowerCase().trim();
    if (act !== null) lista = lista.filter(e => e.is_active === act);
    if (q) lista = lista.filter(e => e.nombre.toLowerCase().includes(q));
    return lista;
  });

  /** Torneos activos donde el equipo NO está inscrito */
  readonly torneosDisponibles = computed(() => {
    const inscritos = new Set(this.torneosDelEquipo().map(t => t.torneo_id));
    return this.torneos().filter(t => !inscritos.has(t.id) && t.is_active);
  });

  readonly formatoMeta = FORMATO_META;

  private equipoSvc  = inject(TorneoEquipoService);
  private torneoSvc  = inject(TorneoService);

  constructor() {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadEquipos(), this.loadTorneos()]);
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────

  async loadEquipos(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.equipoSvc.getAll());
      this.equipos.set(res.data.equipos);
    } catch {
      this.error.set('Error al cargar los equipos de torneo.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTorneos(): Promise<void> {
    try {
      const res = await firstValueFrom(this.torneoSvc.getAll());
      this.torneos.set(res.data.torneos);
    } catch { /* silencioso */ }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────

  setFiltroActivo(val: boolean | null): void {
    this.filtroActivo.set(this.filtroActivo() === val ? null : val);
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  // ── Acciones ─────────────────────────────────────────────────────────────────

  openWizard(): void {
    this.editando.set(null);
    this.showWizard.set(true);
    document.body.style.overflow = 'hidden';
  }

  editEquipo(e: TorneoEquipo): void {
    this.editando.set(e);
    this.showWizard.set(true);
    document.body.style.overflow = 'hidden';
  }

  openDetalle(e: TorneoEquipo): void {
    this.equipoActivo.set(e);
    this.showDetalle.set(true);
    document.body.style.overflow = 'hidden';
  }

  // ── Modal Inscripción a Torneo ────────────────────────────────────────────────

  openInscribir(eq: TorneoEquipo): void {
    this.equipoParaInscribir.set(eq);
    this.torneosDelEquipo.set([]);
    this.torneoIdSeleccionado = null;
    this.inscribiendoError.set(null);
    this.inscribiendoOk.set(null);
    this.showInscribir.set(true);
    this.loadTorneosDelEquipo(eq);
  }

  closeInscribir(): void {
    this.showInscribir.set(false);
    this.equipoParaInscribir.set(null);
    this.torneoIdSeleccionado = null;
  }

  async loadTorneosDelEquipo(eq: TorneoEquipo): Promise<void> {
    this.loadingTorneos.set(true);
    try {
      const res = await firstValueFrom(this.equipoSvc.getTorneos(eq.id));
      this.torneosDelEquipo.set(res.data.torneos);
    } catch { /* silencioso */ } finally {
      this.loadingTorneos.set(false);
    }
  }

  async doInscribir(): Promise<void> {
    if (!this.torneoIdSeleccionado || !this.equipoParaInscribir()) return;
    this.inscribiendo.set(true);
    this.inscribiendoError.set(null);
    try {
      await firstValueFrom(this.torneoSvc.addInscripcion(
        +this.torneoIdSeleccionado,
        { torneo_equipo_id: this.equipoParaInscribir()!.id }
      ));
      this.inscribiendoOk.set('¡Equipo inscrito exitosamente!');
      this.torneoIdSeleccionado = null;
      await this.loadTorneosDelEquipo(this.equipoParaInscribir()!);
      await this.loadEquipos(); // actualiza num_torneos
      setTimeout(() => this.inscribiendoOk.set(null), 3000);
    } catch (e: any) {
      this.inscribiendoError.set(e?.error?.message ?? 'Error al inscribir el equipo');
    } finally {
      this.inscribiendo.set(false);
    }
  }

  desinscribirDeTorneo(insc: EquipoTorneoInscripcion): void {
    this.desinscribirTarget.set(insc);
  }

  cancelDesinscribir(): void {
    this.desinscribirTarget.set(null);
  }

  async executeDesinscribir(): Promise<void> {
    const insc = this.desinscribirTarget();
    if (!insc) return;
    this.desinscribiendo.set(true);
    this.inscribiendoError.set(null);
    try {
      await firstValueFrom(this.torneoSvc.removeInscripcion(insc.torneo_id, insc.inscripcion_id));
      this.desinscribirTarget.set(null);
      await this.loadTorneosDelEquipo(this.equipoParaInscribir()!);
      await this.loadEquipos();
    } catch (e: any) {
      this.inscribiendoError.set(e?.error?.message ?? 'Error al desinscribir');
      this.desinscribirTarget.set(null);
    } finally {
      this.desinscribiendo.set(false);
    }
  }

  onWizardSaved(msg: string): void {
    this.showWizard.set(false);
    this.editando.set(null);
    document.body.style.overflow = '';
    this.successMsg.set(msg);
    this.loadEquipos();
    setTimeout(() => this.successMsg.set(null), 4000);
  }

  onWizardCancelled(): void {
    this.showWizard.set(false);
    this.editando.set(null);
    document.body.style.overflow = '';
  }

  closeDetalle(): void {
    this.showDetalle.set(false);
    this.equipoActivo.set(null);
    document.body.style.overflow = '';
  }

  onDetalleReloaded(): void {
    this.loadEquipos();
  }

  async toggleActive(e: TorneoEquipo): Promise<void> {
    try {
      await firstValueFrom(this.equipoSvc.toggleActive(e.id, !e.is_active));
      await this.loadEquipos();
    } catch {
      this.error.set('Error al cambiar el estado del equipo.');
    }
  }

  confirmDelete(e: TorneoEquipo): void {
    this.deleteTarget.set(e);
    document.body.style.overflow = 'hidden';
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
    document.body.style.overflow = '';
  }

  async executeDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    try {
      await firstValueFrom(this.equipoSvc.delete(target.id));
      this.deleteTarget.set(null);
      document.body.style.overflow = '';
      await this.loadEquipos();
      this.successMsg.set('Equipo eliminado correctamente');
      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al eliminar el equipo.');
      this.deleteTarget.set(null);
      document.body.style.overflow = '';
    } finally {
      this.deleting.set(false);
    }
  }
}
