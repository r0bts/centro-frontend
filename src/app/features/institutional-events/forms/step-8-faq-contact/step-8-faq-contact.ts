import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, skip } from 'rxjs/operators';
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
export class Step8FaqContactComponent implements OnInit, OnDestroy {
  private _subs: Subscription[] = [];

  constructor(public state: EventFormStateService) {}

  get group() { return this.state.faqContactGroup; }
  get faqs() { return this.state.faqsArray.controls; }
  get indicators() { return this.state.indicatorsArray.controls; }

  ngOnInit(): void {
    // Auto-guardar borrador 1.2 s después de que el usuario deje de escribir
    const autoSave = () => this.state.saveDraft();

    this._subs.push(
      this.state.faqsArray.valueChanges
        .pipe(debounceTime(1200), skip(0))
        .subscribe(autoSave),

      this.state.indicatorsArray.valueChanges
        .pipe(debounceTime(1200), skip(0))
        .subscribe(autoSave),

      this.state.faqContactGroup.valueChanges
        .pipe(debounceTime(1200), skip(0))
        .subscribe(autoSave),
    );
  }

  ngOnDestroy(): void {
    this._subs.forEach(s => s.unsubscribe());
  }

  agregarFaq(): void { this.state.addFaq(); }
  eliminarFaq(index: number): void { this.state.removeFaq(index); }

  agregarIndicador(): void { this.state.addIndicator(); }
  eliminarIndicador(index: number): void { this.state.removeIndicator(index); }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
