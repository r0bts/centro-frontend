import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventFormStateService } from '../../services/event-form-state.service';

/**
 * Paso 6 — Memoria Post-Evento.
 * Galería de fotos, métricas/logros alcanzados y resumen narrativo.
 * Almacenado en la columna JSON `post_event_data` de la tabla institutional_events.
 */
@Component({
  selector: 'app-step-6-participants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './step-6-participants.html',
  styleUrl: './step-6-participants.scss',
})
export class Step6ParticipantsComponent {
  nuevaFotoUrl = '';
  nuevaFotoCaption = '';
  nuevaMetricaValor = '';
  nuevaMetricaLabel = '';
  nuevaMetricaPrefijo = '';

  constructor(public state: EventFormStateService) {}

  get group() { return this.state.postEventGroup; }
  get gallery() { return this.state.postGalleryArray.controls; }
  get metrics() { return this.state.postMetricsArray.controls; }

  agregarFoto(): void {
    if (!this.nuevaFotoUrl.trim()) return;
    this.state.addGalleryItem(this.nuevaFotoUrl.trim(), this.nuevaFotoCaption.trim());
    this.nuevaFotoUrl = '';
    this.nuevaFotoCaption = '';
  }

  eliminarFoto(index: number): void {
    this.state.removeGalleryItem(index);
  }

  agregarMetrica(): void {
    if (!this.nuevaMetricaValor.trim() || !this.nuevaMetricaLabel.trim()) return;
    this.state.addPostMetric(this.nuevaMetricaValor.trim(), this.nuevaMetricaLabel.trim(), this.nuevaMetricaPrefijo.trim());
    this.nuevaMetricaValor = '';
    this.nuevaMetricaLabel = '';
    this.nuevaMetricaPrefijo = '';
  }

  eliminarMetrica(index: number): void {
    this.state.removePostMetric(index);
  }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
