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
  TorneoEquipo,
  TorneoIntegrante,
  SocioSearch,
} from '../../../../models/deportivo/torneo-equipo.model';
import { TorneoEquipoService } from '../../../../services/deportivo/torneo-equipo.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';

type DetalleTab = 'integrantes' | 'info';

@Component({
  selector: 'app-equipo-torneo-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './equipo-torneo-detalle.html',
  styleUrl:    './equipo-torneo-detalle.scss',
})
export class EquipoTorneoDetalleComponent implements OnInit, OnDestroy {
  @Input({ required: true }) equipo!: TorneoEquipo;
  @Output() closed   = new EventEmitter<void>();

  confirmDialog = signal<{ title: string; message: string; confirmLabel?: string; action: () => void } | null>(null);
  @Output() reloaded = new EventEmitter<void>();

  private svc = inject(TorneoEquipoService);

  // ── Estado ───────────────────────────────────────────────────────────────────
  readonly tab              = signal<DetalleTab>('integrantes');
  readonly integrantes      = signal<TorneoIntegrante[]>([]);
  readonly loadingInts      = signal(false);
  readonly error            = signal<string | null>(null);
  readonly successMsg       = signal<string | null>(null);

  // ── Búsqueda de socios ───────────────────────────────────────────────────────
  busquedaSocio      = '';
  readonly searching = signal(false);
  readonly socios    = signal<SocioSearch[]>([]);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Agregar integrante ───────────────────────────────────────────────────────
  readonly addingInt      = signal(false);
  selectedSocio: SocioSearch | null = null;
  newJersey   = '';
  newPosicion = '';
  newCapitan  = false;

  // ── Edición inline de integrante ──────────────────────────────────────────
  readonly editingInt     = signal<TorneoIntegrante | null>(null);
  readonly savingInt      = signal(false);
  editJersey   = '';
  editPosicion = '';
  editCapitan  = false;

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly capitanActual = computed(() =>
    this.integrantes().find(i => i.es_capitan) ?? null
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadIntegrantes();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  setTab(t: DetalleTab): void {
    this.tab.set(t);
    this.error.set(null);
  }

  close(): void {
    this.closed.emit();
  }

  // ── Carga de integrantes ───────────────────────────────────────────────────
  async loadIntegrantes(): Promise<void> {
    this.loadingInts.set(true);
    try {
      const res = await firstValueFrom(this.svc.getById(this.equipo.id));
      this.integrantes.set(res.data.integrantes ?? []);
    } catch { /* silencioso */ } finally {
      this.loadingInts.set(false);
    }
  }

  // ── Búsqueda de socios (debounce 400 ms) ─────────────────────────────────
  onBusquedaSocio(event: Event): void {
    this.busquedaSocio = (event.target as HTMLInputElement).value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.busquedaSocio.trim().length < 2) {
      this.socios.set([]);
      return;
    }
    this.searching.set(true);
    this.searchTimer = setTimeout(async () => {
      try {
        const res = await firstValueFrom(
          this.svc.searchSocios(this.busquedaSocio.trim(), this.equipo.id)
        );
        this.socios.set(res.data.socios);
      } catch { this.socios.set([]); } finally {
        this.searching.set(false);
      }
    }, 400);
  }

  selectSocio(s: SocioSearch): void {
    this.selectedSocio = s;
    this.busquedaSocio = s.nombre;
    this.socios.set([]);
  }

  clearSocio(): void {
    this.selectedSocio = null;
    this.busquedaSocio = '';
    this.socios.set([]);
    this.newJersey   = '';
    this.newPosicion = '';
    this.newCapitan  = false;
  }

  // ── Agregar integrante ────────────────────────────────────────────────────
  async addIntegrante(): Promise<void> {
    if (!this.selectedSocio) return;
    this.addingInt.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.addIntegrante(this.equipo.id, {
        socio_id:       this.selectedSocio.id,
        numero_jersey:  this.newJersey  || null,
        posicion:       this.newPosicion || null,
        es_capitan:     this.newCapitan,
      }));
      this.clearSocio();
      await this.loadIntegrantes();
      this.reloaded.emit();
      this.showSuccess('Integrante agregado correctamente');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al agregar integrante');
    } finally {
      this.addingInt.set(false);
    }
  }

  // ── Edición de integrante ──────────────────────────────────────────────────
  startEditInt(i: TorneoIntegrante): void {
    this.editingInt.set(i);
    this.editJersey   = i.numero_jersey  ?? '';
    this.editPosicion = i.posicion       ?? '';
    this.editCapitan  = i.es_capitan;
    this.error.set(null);
  }

  cancelEditInt(): void {
    this.editingInt.set(null);
  }

  async saveEditInt(): Promise<void> {
    const i = this.editingInt();
    if (!i) return;
    this.savingInt.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.editIntegrante(this.equipo.id, i.id, {
        numero_jersey: this.editJersey  || null,
        posicion:      this.editPosicion || null,
        es_capitan:    this.editCapitan,
      }));
      this.editingInt.set(null);
      await this.loadIntegrantes();
      this.showSuccess('Integrante actualizado');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al actualizar integrante');
    } finally {
      this.savingInt.set(false);
    }
  }

  // ── Quitar integrante ─────────────────────────────────────────────────────
  async removeIntegrante(i: TorneoIntegrante): Promise<void> {
    const nombre = i.socio?.nombre ?? 'este socio';
    this.confirmDialog.set({
      title: 'Quitar integrante',
      message: `¿Quitar a "${nombre}" del equipo?`,
      confirmLabel: 'Sí, quitar',
      action: async () => {
        this.error.set(null);
        try {
          await firstValueFrom(this.svc.removeIntegrante(this.equipo.id, i.id));
          await this.loadIntegrantes();
          this.reloaded.emit();
          this.showSuccess('Integrante eliminado del equipo');
        } catch (e: any) {
          this.error.set(e?.error?.message ?? 'Error al eliminar integrante');
        }
      },
    });
  }

  executeConfirm(): void {
    const d = this.confirmDialog();
    this.confirmDialog.set(null);
    d?.action();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3500);
  }
}
