import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventFormStateService } from '../../services/event-form-state.service';

/**
 * Paso 8 — Indicadores de impacto, FAQ y datos de contacto del evento.
 * Replica tplStep8() del mockup 02-event-form.html, mapeado a:
 *   - indicators: JSON en extra_data
 *   - faqs: columna JSON faqs
 *   - contact_email, contact_phone: columnas propias
 *   - contact_person, contact_schedule, maps_url, social_*: JSON en extra_data
 */
@Component({
  selector: 'app-step-8-faq-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './step-8-faq-contact.html',
  styleUrl: './step-8-faq-contact.scss',
})
export class Step8FaqContactComponent {
  constructor(public state: EventFormStateService) {}

  get group() { return this.state.faqContactGroup; }
  get faqs() { return this.state.faqsArray.controls; }
  get indicators() { return this.state.indicatorsArray.controls; }

  agregarFaq(): void { this.state.addFaq(); }
  eliminarFaq(index: number): void { this.state.removeFaq(index); }

  agregarIndicador(): void { this.state.addIndicator(); }
  eliminarIndicador(index: number): void { this.state.removeIndicator(index); }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
