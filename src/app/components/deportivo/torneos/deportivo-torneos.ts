import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TorneoService } from '../../../services/deportivo/torneo.service';
import {
  Torneo,
  TorneoFormato,
  TorneoFormData,
  FORMATO_META,
} from '../../../models/deportivo/torneo.model';
import { TorneoWizardComponent } from './torneo-wizard/torneo-wizard';
import { TorneoDetalleComponent } from './torneo-detalle/torneo-detalle';

@Component({
  selector: 'app-deportivo-torneos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TorneoWizardComponent, TorneoDetalleComponent],
  templateUrl: './deportivo-torneos.html',
  styleUrl: './deportivo-torneos.scss',
})
export class DeportivoTorneosComponent implements OnInit {

  // ── Signals ──────────────────────────────────────────────────────────────────
  readonly torneos    = signal<Torneo[]>([]);
  readonly formData   = signal<TorneoFormData | null>(null);
  readonly loading    = signal(false);
  readonly error      = signal<string | null>(null);

  // Filtros
  readonly filtroFormato = signal<TorneoFormato | null>(null);
  readonly filtroActivo  = signal<boolean | null>(null);

  // Wizard / detalle
  readonly showWizard   = signal(false);
  readonly showDetalle  = signal(false);
  readonly editando     = signal<Torneo | null>(null);
  readonly torneoActivo = signal<Torneo | null>(null);
  readonly successMsg   = signal<string | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly torneosFiltrados = computed(() => {
    let lista = this.torneos();
    const fmt = this.filtroFormato();
    const act = this.filtroActivo();
    if (fmt) lista = lista.filter(t => t.formato === fmt);
    if (act !== null) lista = lista.filter(t => t.is_active === act);
    return lista;
  });

  readonly formatoMeta = FORMATO_META;
  readonly formatos: TorneoFormato[] = ['americano', 'escalera', 'divisiones', 'race'];

  constructor(private svc: TorneoService) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadTorneos(), this.loadFormData()]);
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────

  async loadTorneos(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.svc.getAll());
      this.torneos.set(res.data.torneos);
    } catch {
      this.error.set('Error al cargar los torneos.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadFormData(): Promise<void> {
    try {
      const res = await firstValueFrom(this.svc.getFormData());
      this.formData.set(res.data);
    } catch { /* no bloquear */ }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────

  setFiltroFormato(fmt: TorneoFormato | null): void {
    this.filtroFormato.set(this.filtroFormato() === fmt ? null : fmt);
  }

  setFiltroActivo(val: boolean | null): void {
    this.filtroActivo.set(this.filtroActivo() === val ? null : val);
  }

  // ── Acciones ─────────────────────────────────────────────────────────────────

  openWizard(): void {
    this.editando.set(null);
    this.showWizard.set(true);
    document.body.style.overflow = 'hidden';
  }

  editTorneo(t: Torneo): void {
    this.editando.set(t);
    this.showWizard.set(true);
    document.body.style.overflow = 'hidden';
  }

  openDetalle(t: Torneo): void {
    this.torneoActivo.set(t);
    this.showDetalle.set(true);
    document.body.style.overflow = 'hidden';
  }

  onWizardSaved(msg: string): void {
    this.showWizard.set(false);
    this.editando.set(null);
    document.body.style.overflow = '';
    this.successMsg.set(msg);
    this.loadTorneos();
    setTimeout(() => this.successMsg.set(null), 4000);
  }

  onWizardCancelled(): void {
    this.showWizard.set(false);
    this.editando.set(null);
    document.body.style.overflow = '';
  }

  closeDetalle(): void {
    this.showDetalle.set(false);
    this.torneoActivo.set(null);
    document.body.style.overflow = '';
  }

  async toggleActive(t: Torneo): Promise<void> {
    try {
      await firstValueFrom(this.svc.toggleActive(t.id, !t.is_active));
      await this.loadTorneos();
    } catch {
      this.error.set('Error al cambiar el estado del torneo.');
    }
  }

  async confirmDelete(t: Torneo): Promise<void> {
    if (!confirm(`¿Eliminar el torneo "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await firstValueFrom(this.svc.delete(t.id));
      await this.loadTorneos();
    } catch {
      this.error.set('Error al eliminar el torneo.');
    }
  }

  // ── Helpers UI ───────────────────────────────────────────────────────────────

  trackById(_: number, t: Torneo): number { return t.id; }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
