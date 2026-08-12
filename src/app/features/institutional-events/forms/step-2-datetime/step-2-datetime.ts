import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { EventFormStateService } from '../../services/event-form-state.service';
import { EventModality } from '../../models/institutional-event.model';

@Component({
  selector: 'app-step-2-datetime',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-2-datetime.html',
  styleUrl: './step-2-datetime.scss',
})
export class Step2DatetimeComponent {
  readonly state = inject(EventFormStateService);

  get group() { return this.state.datetimeGroup; }

  /** Modalidad activa (reactiva). */
  readonly modalidad = toSignal(
    this.state.datetimeGroup.get('event_modality')!.valueChanges.pipe(
      map(v => v as EventModality)
    ),
    { initialValue: (this.state.datetimeGroup.get('event_modality')!.value as EventModality) ?? 'presencial' }
  );

  /** Nombre de la sede seleccionada en el Paso 1. */
  readonly sedeNombre = toSignal(
    this.state.identityGroup.get('location_id')!.valueChanges.pipe(
      map(id => this.state.locations().find(l => l.id === Number(id))?.name ?? 'la sede seleccionada')
    ),
    { initialValue: (() => {
        const id = this.state.identityGroup.get('location_id')?.value;
        return this.state.locations().find(l => l.id === Number(id))?.name ?? 'la sede seleccionada';
      })()
    }
  );

  selectModalidad(val: EventModality): void {
    this.group.get('event_modality')!.setValue(val);
  }

  submitted = false;

  irSiguiente(): void {
    this.submitted = true;
    this.state.tryNext(this.group);
  }
  irAtras(): void { this.state.prev(); }
}
