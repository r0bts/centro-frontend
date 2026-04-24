import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  Torneo,
  Jornada,
  Inscripcion,
  TorneoFormData,
  FORMATO_META,
} from '../../../../models/deportivo/torneo.model';
import { TorneoService } from '../../../../services/deportivo/torneo.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';

type DetallTab = 'participantes' | 'jornadas' | 'posiciones';

@Component({
  selector: 'app-torneo-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './torneo-detalle.html',
  styleUrl:    './torneo-detalle.scss',
})
export class TorneoDetalleComponent implements OnInit, OnDestroy {

  confirmDialog = signal<{ title: string; message: string; confirmLabel?: string; action: () => void } | null>(null);
  @Input({ required: true }) torneo!: Torneo;
  @Input() formData: TorneoFormData | null = null;
  @Output() closed   = new EventEmitter<void>();
  @Output() reloaded = new EventEmitter<void>();

  private svc = inject(TorneoService);

  // ── Constantes al template ───────────────────────────────────────────────────
  readonly formatoMeta = FORMATO_META;

  // ── Estado ───────────────────────────────────────────────────────────────────
  readonly tab             = signal<DetallTab>('participantes');
  readonly inscripciones   = signal<Inscripcion[]>([]);
  readonly jornadas        = signal<Jornada[]>([]);
  readonly loadingInsc     = signal(false);
  readonly loadingJorn     = signal(false);
  readonly generando       = signal(false);
  readonly savingJornada   = signal(false);
  readonly addingInsc      = signal(false);
  readonly error           = signal<string | null>(null);
  readonly successMsg      = signal<string | null>(null);

  // ── Selección de equipo para inscribir ───────────────────────────────────────
  equipoSeleccionado: { id: number; nombre: string; color?: string | null } | null = null;
  busquedaEquipo = '';

  // ── Edición de jornada ───────────────────────────────────────────────────────
  editJornada = signal<Jornada | null>(null);
  editNombre     = '';
  editFechaInicio = '';
  editFechaFin   = '';

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly meta = computed(() => FORMATO_META[this.torneo.formato]);

  /** Inscripciones ordenadas por posicion_escalera (escalera) o puntos (otros) */
  readonly inscripcionesOrdenadas = computed(() => {
    const lista = [...this.inscripciones()];
    if (this.torneo.formato === 'escalera') {
      lista.sort((a, b) => (a.posicion_escalera ?? 999) - (b.posicion_escalera ?? 999));
    } else {
      lista.sort((a, b) => b.puntos_totales - a.puntos_totales);
    }
    return lista;
  });

  /** IDs de torneos_equipos ya inscritos para evitar duplicados */
  readonly equiposInscritos = computed(() =>
    new Set(
      this.inscripciones()
        .filter(i => i.torneo_equipo_id)
        .map(i => i.torneo_equipo_id!)
    )
  );

  /** Equipos de torneo disponibles para inscribir (filtra los ya inscritos, soporta búsqueda) */
  readonly equiposDisponibles = computed(() => {
    const ya = this.equiposInscritos();
    const q  = this.busquedaEquipo.toLowerCase();
    return (this.formData?.torneos_equipos ?? [])
      .filter(e => !ya.has(e.id))
      .filter(e => !q || e.nombre.toLowerCase().includes(q));
  });

  readonly jornadasPendientes  = computed(() => this.jornadas().filter(j => j.estado === 'pendiente'));
  readonly jornadasEnCurso     = computed(() => this.jornadas().filter(j => j.estado === 'en_curso'));
  readonly jornadasFinalizadas = computed(() => this.jornadas().filter(j => j.estado === 'finalizada'));

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadInscripciones();
    this.loadJornadas();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  // ── Carga de datos ────────────────────────────────────────────────────────────
  async loadInscripciones(): Promise<void> {
    this.loadingInsc.set(true);
    try {
      const res = await firstValueFrom(this.svc.getInscripciones(this.torneo.id));
      this.inscripciones.set(res.data.inscripciones);
    } catch { /* silencioso */ } finally {
      this.loadingInsc.set(false);
    }
  }

  async loadJornadas(): Promise<void> {
    this.loadingJorn.set(true);
    try {
      const res = await firstValueFrom(this.svc.getJornadas(this.torneo.id));
      this.jornadas.set(res.data.jornadas);
    } catch { /* silencioso */ } finally {
      this.loadingJorn.set(false);
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  setTab(t: DetallTab): void {
    this.tab.set(t);
    this.error.set(null);
  }

  // ── Inscripciones ─────────────────────────────────────────────────────────────
  selectEquipo(eq: { id: number; nombre: string; color?: string | null }): void {
    this.equipoSeleccionado = eq;
    this.busquedaEquipo = eq.nombre;
  }

  clearEquipo(): void {
    this.equipoSeleccionado = null;
    this.busquedaEquipo = '';
  }

  onBusquedaEquipo(event: Event): void {
    this.busquedaEquipo = (event.target as HTMLInputElement).value;
    if (!this.busquedaEquipo) this.equipoSeleccionado = null;
  }

  async addInscripcion(): Promise<void> {
    if (!this.equipoSeleccionado) return;
    this.addingInsc.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.addInscripcion(this.torneo.id, { torneo_equipo_id: this.equipoSeleccionado.id }));
      this.clearEquipo();
      await this.loadInscripciones();
      this.showSuccess('Equipo inscrito correctamente');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al inscribir el equipo');
    } finally {
      this.addingInsc.set(false);
    }
  }

  async removeInscripcion(insc: Inscripcion): Promise<void> {
    const nombre = insc.equipo?.nombre ?? 'este equipo';
    this.confirmDialog.set({
      title: 'Quitar equipo',
      message: `¿Quitar a "${nombre}" del torneo?`,
      confirmLabel: 'Sí, quitar',
      action: async () => {
        this.error.set(null);
        try {
          await firstValueFrom(this.svc.removeInscripcion(this.torneo.id, insc.id));
          await this.loadInscripciones();
          this.showSuccess('Inscripción eliminada');
        } catch (e: any) {
          this.error.set(e?.error?.message ?? 'Error al eliminar inscripción');
        }
      },
    });
  }

  async moverPosicion(insc: Inscripcion, direccion: 'up' | 'down'): Promise<void> {
    if (this.torneo.formato !== 'escalera') return;
    const lista = this.inscripcionesOrdenadas();
    const idx = lista.findIndex(i => i.id === insc.id);
    if (direccion === 'up'   && idx === 0) return;
    if (direccion === 'down' && idx === lista.length - 1) return;
    const swapWith = lista[direccion === 'up' ? idx - 1 : idx + 1];
    try {
      await firstValueFrom(this.svc.updatePosicion(
        this.torneo.id, insc.id, swapWith.posicion_escalera ?? 1
      ));
      await this.loadInscripciones();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al mover posición');
    }
  }

  executeConfirm(): void {
    const d = this.confirmDialog();
    this.confirmDialog.set(null);
    d?.action();
  }

  // ── Jornadas ──────────────────────────────────────────────────────────────────
  async generarJornadas(): Promise<void> {
    const doGenerar = async () => {
      this.generando.set(true);
      this.error.set(null);
      try {
        const res = await firstValueFrom(this.svc.generarJornadas(this.torneo.id));
        this.jornadas.set(res.data.jornadas);
        this.showSuccess(`${res.data.total} jornadas generadas correctamente`);
      } catch (e: any) {
        this.error.set(e?.error?.message ?? 'Error al generar jornadas');
      } finally {
        this.generando.set(false);
      }
    };
    if (this.jornadas().length > 0) {
      this.confirmDialog.set({
        title: 'Regenerar jornadas',
        message: 'Ya existen jornadas configuradas.\n¿Deseas regenerarlas? Se eliminarán las actuales.',
        confirmLabel: 'Sí, regenerar',
        action: doGenerar,
      });
    } else {
      await doGenerar();
    }
  }

  openEditJornada(j: Jornada): void {
    this.editJornada.set(j);
    this.editNombre      = j.nombre ?? '';
    this.editFechaInicio = j.fecha_inicio ?? '';
    this.editFechaFin    = j.fecha_fin ?? '';
    this.error.set(null);
  }

  cancelEditJornada(): void {
    this.editJornada.set(null);
    this.error.set(null);
  }

  async saveJornada(): Promise<void> {
    const j = this.editJornada();
    if (!j) return;
    this.savingJornada.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.updateJornada(j.id, {
        nombre:       this.editNombre || undefined,
        fecha_inicio: this.editFechaInicio || undefined,
        fecha_fin:    this.editFechaFin    || undefined,
      }));
      await this.loadJornadas();
      this.editJornada.set(null);
      this.showSuccess('Jornada actualizada');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al guardar jornada');
    } finally {
      this.savingJornada.set(false);
    }
  }

  async cambiarEstadoJornada(j: Jornada, estado: 'en_curso' | 'finalizada'): Promise<void> {
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.updateEstadoJornada(j.id, estado));
      await this.loadJornadas();
      this.showSuccess(`Jornada marcada como "${estado.replace('_', ' ')}"`);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al cambiar estado');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3500);
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  formatFechaLarga(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  nombreInscripcion(insc: Inscripcion): string {
    if (insc.torneo_equipo) return insc.torneo_equipo.nombre;
    if (insc.equipo)        return insc.equipo.nombre;
    if (insc.alumno)        return `${insc.alumno.nombre} ${insc.alumno.apellido}`;
    return `#${insc.id}`;
  }

  colorInscripcion(insc: Inscripcion): string | null {
    return insc.torneo_equipo?.color ?? null;
  }

  estadoJornadaClass(estado: string): string {
    return { pendiente: 'bg-secondary', en_curso: 'bg-warning text-dark', finalizada: 'bg-success' }[estado] ?? 'bg-secondary';
  }

  close(): void { this.closed.emit(); }
}
