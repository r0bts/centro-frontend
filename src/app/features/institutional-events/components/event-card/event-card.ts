import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventType, EVENT_TYPE_META } from '../../models/institutional-event.model';

/** Datos mínimos necesarios para pintar la vista previa (aún sin guardar, sin id). */
export interface EventCardPreviewData {
  name: string;
  kicker?: string | null;
  event_type: EventType;
  location_name?: string | null;
  start_date?: string | null;
  has_cost?: boolean;
  cost?: number | null;
  banner_image_url?: string | null;
}

/**
 * Tarjeta de vista previa de un evento institucional.
 * Usada en el paso 9 (Revisión) del wizard para mostrar cómo lucirá el Hero,
 * replicando `buildHeroPreview()` del mockup 02-event-form.html.
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss',
})
export class EventCardComponent {
  @Input({ required: true }) data!: EventCardPreviewData;

  readonly eventTypeMeta = EVENT_TYPE_META;

  get fechaFormateada(): string {
    if (!this.data.start_date) return '—';
    const d = new Date(this.data.start_date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
