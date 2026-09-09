import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges,
  Output, SimpleChanges, computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AccessType, ACCESS_TYPE_META } from '../../../../models/institutional-event.model';
import { GuestCount, GuestScopeMode } from '../../../../models/event-guest.model';
import { EventGuestsService } from '../../../../services/event-guests.service';

/**
 * Panel derecho del split-screen del guest list (mapa 16 §3.1).
 *
 * Muestra:
 *  1. Selector de alcance (evento general / subeventos) — controlado por el padre.
 *  2. Toggles auto/manual por cada `access_type` presente en el scope.
 *  3. Contadores dinámicos (`auto_count`, `manual_count`, `total`).
 *
 * Emite `scopeModeChanged` cuando el usuario alterna un toggle; el padre
 * re-carga counts y la lista del panel izquierdo.
 */
@Component({
  selector: 'app-guest-filters-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './guest-filters-panel.html',
  styleUrl: './guest-filters-panel.scss',
})
export class GuestFiltersPanelComponent implements OnChanges {
  private readonly svc = inject(EventGuestsService);

  @Input({ required: true }) eventId!: number;
  @Input() subeventId: number | null = null;
  /** access_types[] del evento/subevento actual (filtra los chips visibles). */
  @Input() scopeAccessTypes: AccessType[] = [];

  @Output() scopeModeChanged = new EventEmitter<{
    access_type: AccessType;
    mode: GuestScopeMode;
  }>();

  readonly counts = signal<GuestCount[]>([]);
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  /** Meta local para pintar labels/iconos sin depender del signal remoto. */
  readonly accessMeta = ACCESS_TYPE_META;

  /** Total agregado (suma de counts.total) para el badge de resumen. */
  readonly grandTotal = computed((): number =>
    this.counts().reduce((sum, c) => sum + (c.total ?? 0), 0),
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] || changes['subeventId']) {
      void this.reloadCounts();
    }
  }

  async reloadCounts(): Promise<void> {
    if (!this.eventId) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const res = await firstValueFrom(this.svc.getCounts(this.eventId, this.subeventId));
      this.counts.set(res?.data?.counts ?? []);
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error cargando counts.');
      this.counts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Chips visibles: solo los `access_types` que están en `scopeAccessTypes`
   * (los del evento/subevento). Se usa el orden del array del evento para
   * consistencia con el step-3 del wizard.
   */
  get visibleAccessTypes(): AccessType[] {
    return this.scopeAccessTypes;
  }

  /** Encuentra el count para un access_type, o retorna default. */
  countFor(at: AccessType): GuestCount {
    const existing = this.counts().find(c => c.access_type === at);
    if (existing) return existing;
    return {
      access_type: at,
      mode: 'auto',
      auto_count: 0,
      manual_count: 0,
      total: 0,
    };
  }

  /**
   * True cuando el toggle `auto` debe estar deshabilitado. Mapa 16 §10 P-INIT-4:
   * `committee` sin padrón backend queda forzado a `manual` (no hay a quién
   * invitar automáticamente).
   */
  isAutoDisabled(at: AccessType): boolean {
    return at === 'committee';
  }

  async toggleMode(at: AccessType, checked: boolean): Promise<void> {
    const newMode: GuestScopeMode = checked ? 'auto' : 'manual';

    // Optimistic update local
    const current = this.counts();
    const updated = current.map(c =>
      c.access_type === at ? { ...c, mode: newMode } : c,
    );
    this.counts.set(updated);

    try {
      await firstValueFrom(this.svc.updateScopes(this.eventId, this.subeventId, [
        { access_type: at, mode: newMode },
      ]));
      // Recargar counts para reflejar auto_count/manual_count reales.
      await this.reloadCounts();
      // Notificar al padre.
      this.scopeModeChanged.emit({ access_type: at, mode: newMode });
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error actualizando modo.');
      // Rollback: recarga counts para obtener estado real.
      await this.reloadCounts();
    }
  }
}
