import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EventFormStateService } from '../../services/event-form-state.service';
import { SubeventModalComponent } from '../../components/subevent-modal/subevent-modal';
import { ACCESS_TYPE_META, SUBEVENT_STATUS_META, InstitutionalEventSubevent, AccessType, SubeventStatus } from '../../models/institutional-event.model';

@Component({
  selector: 'app-step-4-subevents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, SubeventModalComponent],
  templateUrl: './step-4-subevents.html',
  styleUrl: './step-4-subevents.scss',
})
export class Step4SubeventsComponent {
  readonly accessTypeMeta = ACCESS_TYPE_META;
  readonly subeventStatusMeta = SUBEVENT_STATUS_META;

  readonly modalOpen = signal(false);
  readonly editIndex = signal<number | null>(null);
  readonly confirmarEliminarIndex = signal<number | null>(null);

  constructor(public state: EventFormStateService) {}

  get subeventos() { return this.state.subeventsArray.controls; }

  accessMeta(tipo: string) { return this.accessTypeMeta[tipo as AccessType]; }
  statusMeta(status: string) { return this.subeventStatusMeta[status as SubeventStatus]; }

  abrirModal(index: number | null): void {
    this.editIndex.set(index);
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
    this.editIndex.set(null);
  }

  get subeventoEnEdicion(): Partial<InstitutionalEventSubevent> | null {
    const i = this.editIndex();
    return i === null ? null : this.subeventos[i].value;
  }

  guardarSubevento(data: any): void {
    const i = this.editIndex();
    if (i === null) {
      this.state.addSubevent(data);
    } else {
      this.subeventos[i].patchValue(data);
    }
    this.cerrarModal();
  }

  pedirConfirmacionEliminar(index: number): void {
    this.confirmarEliminarIndex.set(index);
  }

  cancelarEliminar(): void {
    this.confirmarEliminarIndex.set(null);
  }

  confirmarEliminar(): void {
    const i = this.confirmarEliminarIndex();
    if (i !== null) {
      this.state.removeSubevent(i);
      this.confirmarEliminarIndex.set(null);
    }
  }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
