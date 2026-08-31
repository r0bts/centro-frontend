import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EventFormStateService } from '../../services/event-form-state.service';
import { AccessType, ACCESS_TYPE_META } from '../../models/institutional-event.model';

@Component({
  selector: 'app-step-3-access',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-3-access.html',
  styleUrl: './step-3-access.scss',
})
export class Step3AccessComponent {
  /** Metadatos locales de UI (fallback si el API tarda en cargar) */
  readonly accessTypeMeta = ACCESS_TYPE_META;

  /** Lista dinámica desde el API — se usa en el template */
  get accessTypes() { return this.state.accessTypes(); }

  constructor(public state: EventFormStateService) {}

  get group() { return this.state.accessGroup; }
  get seleccionados(): AccessType[] { return this.group.get('access_types')!.value ?? []; }
  get seleccionadosLabel(): string {
    return this.seleccionados
      .map(t => this.accessTypes.find(a => a.id === t)?.label ?? this.accessTypeMeta[t]?.label ?? t)
      .join(', ');
  }

  toggleAcceso(tipo: AccessType): void {
    const actuales = this.seleccionados;
    const idx = actuales.indexOf(tipo);
    const nuevos = idx >= 0 ? actuales.filter(a => a !== tipo) : [...actuales, tipo];
    this.group.get('access_types')!.setValue(nuevos);
  }

  toggleHasCost(checked: boolean): void {
    this.group.get('has_cost')!.setValue(checked);
    if (!checked) this.group.get('cost')!.setValue(null);
  }

  submitted = false;

  irSiguiente(): void {
    this.submitted = true;
    if (this.seleccionados.length === 0) return;
    this.state.tryNext(this.group);
  }
  irAtras(): void { this.state.prev(); }
}
