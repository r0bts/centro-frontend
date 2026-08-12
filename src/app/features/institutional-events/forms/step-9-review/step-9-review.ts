import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventFormStateService } from '../../services/event-form-state.service';
import { EventCardComponent } from '../../components/event-card/event-card';
import {
  ACCESS_TYPE_META,
  EVENT_TYPE_META,
} from '../../models/institutional-event.model';

/**
 * Paso 9 — Revisión final. Resumen de todos los datos reales capturados y
 * guardado (crear/editar) + publicación opcional, replicando `tplStep9()`.
 */
@Component({
  selector: 'app-step-9-review',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EventCardComponent],
  templateUrl: './step-9-review.html',
  styleUrl: './step-9-review.scss',
})
export class Step9ReviewComponent {
  readonly accessTypeMeta = ACCESS_TYPE_META;
  readonly eventTypeMeta = EVENT_TYPE_META;

  publicarAlGuardar = false;

  readonly previewData = computed(() => {
    const identity = this.state.identityGroup.value;
    const datetime = this.state.datetimeGroup.value;
    const access = this.state.accessGroup.value;
    const sede = this.state.locations().find(l => l.id === identity.location_id);
    return {
      name: identity.name,
      kicker: identity.kicker,
      event_type: identity.event_type,
      location_name: sede?.name ?? null,
      start_date: datetime.start_date,
      has_cost: access.has_cost,
      cost: access.cost,
    };
  });

  constructor(public state: EventFormStateService, private router: Router) {}

  get identity() { return this.state.identityGroup.value; }
  get datetime() { return this.state.datetimeGroup.value; }
  get access() { return this.state.accessGroup.value; }
  get hero() { return this.state.heroGroup.value; }

  eventTypeLabel(tipo: string): string { return (this.eventTypeMeta as Record<string, { label: string }>)[tipo]?.label ?? tipo; }

  get sedeNombre(): string {
    const loc = this.state.locations().find(l => l.id === this.identity.location_id);
    return loc?.name ?? '—';
  }

  fmtFecha(value: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  irAtras(): void { this.state.prev(); }

  cancelar(): void {
    this.router.navigate(['/eventos']);
  }

  async guardar(): Promise<void> {
    const evento = await this.state.save();
    if (!evento) return;
    if (this.publicarAlGuardar) {
      await this.state.publish();
    }
    if (!this.state.loadError()) {
      this.router.navigate(['/eventos']);
    }
  }
}
