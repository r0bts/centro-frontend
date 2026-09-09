import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import {
  AccessType,
  InstitutionalEvent,
  InstitutionalEventSubevent,
} from '../../models/institutional-event.model';
import { GuestScopeMode } from '../../models/event-guest.model';
import { EventGuestsService } from '../../services/event-guests.service';
import { GuestFiltersPanelComponent } from './components/guest-filters-panel/guest-filters-panel';
import { GuestListPanelComponent } from './components/guest-list-panel/guest-list-panel';

/**
 * SCR-008 — Guest list del evento con pantalla dividida (mapa 16).
 *
 * Shell del split-screen: orquesta los dos sub-componentes
 * `guest-filters-panel` (panel derecho, filtros y scope) y `guest-list-panel`
 * (panel izquierdo, listado activo + buscador manual).
 *
 * Ver `docs/Events/16-GUEST-LIST-SPLIT-SCREEN.md`.
 */
@Component({
  selector: 'app-event-guests-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, GuestFiltersPanelComponent, GuestListPanelComponent],
  templateUrl: './event-guests-page.html',
  styleUrl: './event-guests-page.scss',
})
export class EventGuestsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(InstitutionalEventsService);
  private readonly guestsSvc = inject(EventGuestsService);

  readonly eventId = signal<number | null>(null);
  readonly event = signal<InstitutionalEvent | null>(null);
  readonly loading = signal(true);
  readonly errorMsg = signal<string | null>(null);

  /** Estado del panel derecho: colapsado/expandido (patrón requisition split). */
  readonly isFiltersCollapsed = signal(false);

  /** Alcance seleccionado: `null` = evento general; otro int = subevento. */
  readonly selectedSubeventId = signal<number | null>(null);

  /** Subeventos activos del evento (excluye cancelados). */
  readonly subevents = computed((): InstitutionalEventSubevent[] =>
    (this.event()?.institutional_event_subevents ?? []).filter(s => s.status !== 'cancelled'),
  );

  /** Etiqueta del alcance actual para el título contextual. */
  readonly scopeLabel = computed((): string => {
    const id = this.selectedSubeventId();
    if (id === null) return '— Evento general —';
    const sv = this.subevents().find(s => s.id === id);
    return sv?.name ?? `Subevento #${id}`;
  });

  /**
   * Access types del alcance actual (evento general → event.access_types,
   * subevento seleccionado → subevento.access_types).
   */
  readonly scopeAccessTypes = computed((): AccessType[] => {
    const id = this.selectedSubeventId();
    if (id === null) {
      return this.event()?.access_types ?? [];
    }
    const sv = this.subevents().find(s => s.id === id);
    return sv?.access_types ?? [];
  });

  /**
   * Marca de recarga incrementable: cambiar este signal fuerza al panel
   * izquierdo (M6) a re-cargar el listado cuando cambia un scope.
   */
  readonly listReloadTick = signal(0);

  // ── Acciones batch (M7): send invitations + export ──────────────────────

  readonly showSendModal = signal(false);
  readonly sendingInvitations = signal(false);
  readonly lastSendResult = signal<{ ok: boolean; message: string; updatedCount?: number } | null>(null);

  readonly exporting = signal(false);
  readonly lastExportError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMsg.set('Falta el id del evento en la URL.');
      this.loading.set(false);
      return;
    }
    const id = Number(idParam);
    this.eventId.set(id);
    await this.loadEvent(id);
  }

  private async loadEvent(id: number): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const res = await firstValueFrom(this.svc.getById(id));
      const ev = res?.data?.event ?? null;
      if (!ev) {
        this.errorMsg.set('Evento no encontrado.');
      }
      this.event.set(ev);
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error de red al cargar el evento.');
    } finally {
      this.loading.set(false);
    }
  }

  toggleFiltersPanel(): void {
    this.isFiltersCollapsed.update(v => !v);
  }

  onSubeventChange(value: string): void {
    const parsed = value === '' || value === 'null' ? null : Number(value);
    this.selectedSubeventId.set(parsed);
    this.listReloadTick.update(n => n + 1);
  }

  onScopeModeChanged(evt: { access_type: AccessType; mode: GuestScopeMode }): void {
    // El panel derecho ya persistió el cambio. Solo forzamos recarga del panel izquierdo.
    this.listReloadTick.update(n => n + 1);
  }

  goBack(): void {
    this.router.navigate(['/eventos']);
  }

  // ── Send invitations ────────────────────────────────────────────────────

  openSendModal(): void {
    this.lastSendResult.set(null);
    this.showSendModal.set(true);
  }

  closeSendModal(): void {
    if (this.sendingInvitations()) return;
    this.showSendModal.set(false);
  }

  async confirmSend(): Promise<void> {
    const id = this.eventId();
    if (!id) return;
    this.sendingInvitations.set(true);
    this.lastSendResult.set(null);
    try {
      const res = await firstValueFrom(this.guestsSvc.sendInvitations(id, this.selectedSubeventId()));
      this.lastSendResult.set({
        ok: !!res?.success,
        message: res?.message ?? 'Enviado',
        updatedCount: res?.data?.updated_count,
      });
      // Refresca la lista para reflejar los nuevos status='invited'.
      this.listReloadTick.update(n => n + 1);
    } catch (err: any) {
      this.lastSendResult.set({
        ok: false,
        message: err?.error?.message ?? 'Error al enviar invitaciones.',
      });
    } finally {
      this.sendingInvitations.set(false);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────

  async exportList(): Promise<void> {
    const id = this.eventId();
    if (!id || this.exporting()) return;
    this.exporting.set(true);
    this.lastExportError.set(null);
    try {
      const res = await firstValueFrom(this.guestsSvc.export(id, this.selectedSubeventId()));
      const guests = (res as any)?.data?.guests ?? [];
      // Descarga como JSON (fase 1). Fase 2: XLSX server-side.
      const blob = new Blob([JSON.stringify(guests, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const subLabel = this.selectedSubeventId() === null ? 'general' : `subevento-${this.selectedSubeventId()}`;
      a.download = `invitados-evento-${id}-${subLabel}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      this.lastExportError.set(err?.error?.message ?? 'Error al exportar.');
    } finally {
      this.exporting.set(false);
    }
  }
}
