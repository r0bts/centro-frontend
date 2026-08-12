import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { EventFormStateService } from '../../services/event-form-state.service';

@Component({
  selector: 'app-step-1-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './step-1-identity.html',
  styleUrl: './step-1-identity.scss',
})
export class Step1IdentityComponent {

  frecuencias: string[] = [];
  leyendaDon = '';
  nuevoMonto: number | null = null;

  constructor(public state: EventFormStateService) {}

  get group() { return this.state.identityGroup; }
  get montos(): number[] { return this.group.get('donation_amounts')!.value ?? []; }

  selectSede(id: number): void {
    this.group.get('location_id')!.setValue(id);
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
