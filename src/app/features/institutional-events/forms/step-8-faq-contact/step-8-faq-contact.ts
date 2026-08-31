import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, skip, filter } from 'rxjs/operators';
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
        .pipe(filter(() => !this.state.isPatching), debounceTime(1200))
        .subscribe(autoSave),

      this.state.indicatorsArray.valueChanges
        .pipe(filter(() => !this.state.isPatching), debounceTime(1200))
        .subscribe(autoSave),

      this.state.faqContactGroup.valueChanges
        .pipe(filter(() => !this.state.isPatching), debounceTime(1200))
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

  // ── Horarios de atención ───────────────────────────────────────────────
  readonly diasSemana = [
    { key: 'L', label: 'L' },
    { key: 'M', label: 'M' },
    { key: 'X', label: 'X' },
    { key: 'J', label: 'J' },
    { key: 'V', label: 'V' },
    { key: 'S', label: 'S' },
    { key: 'D', label: 'D' },
  ];

  selectedDays: string[] = ['L', 'M', 'X', 'J', 'V'];
  horaInicio = '09:00';
  horaFin = '18:00';

  isDiaSelected(key: string): boolean {
    return this.selectedDays.includes(key);
  }

  toggleDia(key: string): void {
    const idx = this.selectedDays.indexOf(key);
    if (idx >= 0) {
      this.selectedDays = this.selectedDays.filter(d => d !== key);
    } else {
      this.selectedDays = [...this.selectedDays, key];
    }
    this.aplicarHorarioConstruido();
  }

  aplicarHorarioConstruido(): void {
    if (this.selectedDays.length === 0) return;
    const diasStr = this.selectedDays.join(', ');
    const horarioStr = `${diasStr} de ${this.horaInicio} a ${this.horaFin} hrs`;
    this.group.get('contact_schedule')?.setValue(horarioStr);
  }

  setPresetHorario(tipo: 'lv918' | 'ls914' | 'completo'): void {
    if (tipo === 'lv918') {
      this.selectedDays = ['L', 'M', 'X', 'J', 'V'];
      this.horaInicio = '09:00';
      this.horaFin = '18:00';
    } else if (tipo === 'ls914') {
      this.selectedDays = ['L', 'M', 'X', 'J', 'V', 'S'];
      this.horaInicio = '09:00';
      this.horaFin = '14:00';
    } else if (tipo === 'completo') {
      this.selectedDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      this.horaInicio = '08:00';
      this.horaFin = '20:00';
    }
    this.aplicarHorarioConstruido();
  }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
