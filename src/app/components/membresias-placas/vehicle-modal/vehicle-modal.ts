import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleFormData } from '../../../models/vehicle.model';

@Component({
  selector: 'app-vehicle-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-modal.html',
  styleUrls: ['./vehicle-modal.scss'],
})
export class VehicleModalComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  /** 'add' para registrar, 'edit' para editar */
  @Input() mode: 'add' | 'edit' = 'add';
  /** Datos prellenados para editar; campos vacíos para agregar */
  @Input() data!: VehicleFormData;
  /** true si el socio es patrimonial especial (puede elegir access_number) */
  @Input() isSpecial = false;

  @Output() save   = new EventEmitter<VehicleFormData>();
  @Output() cancel = new EventEmitter<void>();

  // ── Copia local editable ─────────────────────────────────────────────────
  form: VehicleFormData = {
    plates: '',
    make: '',
    model: '',
    color: '',
    accessNumber: 1,
    isInParking: false,
  };

  saving = false;
  error  = '';

  ngOnInit(): void {
    // Clonar datos de entrada para no mutar el original
    this.form = { ...this.data };
  }

  get title(): string {
    return this.mode === 'add' ? 'Registrar Vehículo' : 'Editar Vehículo';
  }

  onSubmit(): void {
    this.error = '';

    if (!this.form.plates?.trim()) {
      this.error = 'El número de placa es requerido.';
      this.cdr.markForCheck();
      return;
    }

    if (this.isSpecial && !this.form.accessNumber) {
      this.error = 'Selecciona el número de acceso.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    this.save.emit({ ...this.form, plates: this.form.plates.trim().toUpperCase() });

    // El padre manejará el cierre y posibles errores; reseteamos saving tras un tiempo
    setTimeout(() => {
      this.saving = false;
      this.cdr.markForCheck();
    }, 3000);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancel();
    }
  }
}
