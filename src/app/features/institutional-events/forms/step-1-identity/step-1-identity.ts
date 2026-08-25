import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { EventFormStateService } from '../../services/event-form-state.service';
import { EventPlace } from '../../models/institutional-event.model';
import { EventPlaceModalComponent } from '../../components/event-place-modal/event-place-modal';

@Component({
  selector: 'app-step-1-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, EventPlaceModalComponent],
  templateUrl: './step-1-identity.html',
  styleUrl: './step-1-identity.scss',
})
export class Step1IdentityComponent {

  frecuencias: string[] = [];
  leyendaDon = '';
  nuevoMonto: number | null = null;

  readonly showPlaceModal = signal(false);
  readonly seleccionandoOtro = signal(false);
  placeToEdit: EventPlace | null = null;

  constructor(public state: EventFormStateService) {}

  get group() { return this.state.identityGroup; }
  get montos(): number[] { return this.group.get('donation_amounts')!.value ?? []; }

  get modoOtro(): boolean {
    return this.seleccionandoOtro() || !!this.group.get('place_id')?.value;
  }

  selectSede(id: number): void {
    this.group.get('location_id')!.setValue(id);
    this.group.get('place_id')!.setValue(null);
    this.seleccionandoOtro.set(false);
    const sin = this.state.camposInvalidos().filter(c => c !== 'Sede o Lugar del evento');
    this.state.camposInvalidos.set(sin);
  }

  selectOtro(): void {
    this.group.get('location_id')!.setValue(null);
    this.seleccionandoOtro.set(true);
  }

  onPlaceChange(place: EventPlace | null): void {
    if (place) {
      this.group.get('location_id')!.setValue(null);
      // Quitar el error visual de sede/lugar al seleccionar
      const sin = this.state.camposInvalidos().filter(c => c !== 'Sede o Lugar del evento');
      this.state.camposInvalidos.set(sin);
    }
  }

  abrirModalNuevo(): void {
    this.placeToEdit = null;
    this.showPlaceModal.set(true);
  }

  abrirModalEditar(): void {
    const id = this.group.get('place_id')?.value;
    this.placeToEdit = this.state.places().find(p => p.id === id) ?? null;
    this.showPlaceModal.set(true);
  }

  onPlaceSaved(place: EventPlace): void {
    this.state.loadPlaces().then(() => {
      this.group.get('place_id')!.setValue(place.id);
    });
    this.showPlaceModal.set(false);
  }

  toggleDonativos(checked: boolean): void {
    this.group.get('has_donations')!.setValue(checked);
  }

  toggleFrecuencia(val: string): void {
    if (this.frecuencias.includes(val)) {
      this.frecuencias = this.frecuencias.filter(f => f !== val);
    } else {
      this.frecuencias = [...this.frecuencias, val];
    }
  }

  agregarMonto(): void {
    if (!this.nuevoMonto || this.nuevoMonto <= 0) return;
    const actuales = this.montos;
    if (!actuales.includes(this.nuevoMonto)) {
      const nuevos = [...actuales, this.nuevoMonto].sort((a, b) => a - b);
      this.group.get('donation_amounts')!.setValue(nuevos);
    }
    this.nuevoMonto = null;
  }

  quitarMonto(valor: number): void {
    this.group.get('donation_amounts')!.setValue(this.montos.filter(m => m !== valor));
  }

  submitted = false;

  irSiguiente(): void {
    this.submitted = true;
    this.state.tryNext(this.group);
  }
}
