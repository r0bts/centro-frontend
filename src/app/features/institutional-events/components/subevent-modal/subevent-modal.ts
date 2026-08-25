import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  AccessType,
  ACCESS_TYPE_META,
  EventAccessType,
  InstitutionalEventSubevent,
  SubeventStatus,
  SUBEVENT_STATUS_META,
} from '../../models/institutional-event.model';
import { EventFormStateService } from '../../services/event-form-state.service';
import { EventArea } from '../../models/institutional-event.model';

/** Valor de trabajo local del modal (subset editable de InstitutionalEventSubevent). */
type SubeventoForm = {
  name: string;
  start_date: string;
  end_date: string;
  venue: string;
  area_id: number | null;
  max_capacity: number;
  cost: number;
  access_type: AccessType;
  status: SubeventStatus;
  instructor_name:  string;
  instructor_phone: string;
  instructor_email: string;
  instructor_notes: string;
  description: string;
};

function empty(): SubeventoForm {
  return {
    name: '', start_date: '', end_date: '', venue: '',
    area_id: null,
    max_capacity: 0, cost: 0, access_type: 'public', status: 'confirmed',
    instructor_name: '', instructor_phone: '', instructor_email: '', instructor_notes: '',
    description: '',
  };
}

/**
 * Modal de alta/edición de un subevento (paso 4 del wizard).
 * Componente controlado: el padre decide cuándo mostrarlo (`@if`) y le pasa
 * el subevento a editar (o ninguno para "agregar"); emite `saved`/`closed`.
 */
@Component({
  selector: 'app-subevent-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './subevent-modal.html',
  styleUrl: './subevent-modal.scss',
})
export class SubeventModalComponent implements OnChanges {
  readonly state = inject(EventFormStateService);

  @Input() subevento: Partial<InstitutionalEventSubevent> | null = null;

  @Output() saved = new EventEmitter<SubeventoForm>();
  @Output() closed = new EventEmitter<void>();

  readonly accessTypeMeta = ACCESS_TYPE_META;
  readonly subeventStatusMeta = SUBEVENT_STATUS_META;
  /** Lista dinámica desde el API — igual que en step-3-access */
  get accessTypes(): EventAccessType[] { return this.state.accessTypes(); }
  readonly statuses: SubeventStatus[] = ['confirmed', 'tentative', 'cancelled'];

  form: SubeventoForm = empty();
  errorMsg = '';

  ngOnChanges(): void {
    this.errorMsg = '';
    this.form = this.subevento
      ? {
          name: this.subevento.name ?? '',
          start_date: this.subevento.start_date ?? '',
          end_date: this.subevento.end_date ?? '',
          venue: this.subevento.venue ?? '',
          area_id: this.subevento.area_id ?? null,
          max_capacity: this.subevento.max_capacity ?? 0,
          cost: this.subevento.cost ?? 0,
          access_type: this.subevento.access_type ?? 'public',
          status: this.subevento.status ?? 'confirmed',
          instructor_name:  this.subevento.instructor_name  ?? '',
          instructor_phone: this.subevento.instructor_phone ?? '',
          instructor_email: this.subevento.instructor_email ?? '',
          instructor_notes: this.subevento.instructor_notes ?? '',
          description: this.subevento.description ?? '',
        }
      : empty();
  }

  /** Al seleccionar un área, también guarda el nombre en `venue` para mostrar en la tabla. */
  onAreaChange(area: EventArea | null): void {
    this.form.venue = area?.name ?? '';
  }

  /** Permite solo dígitos, máx 10 */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = clean;
    this.form.instructor_phone = clean;
  }

  guardar(): void {
    if (!this.form.name.trim()) {
      this.errorMsg = 'El nombre del subevento es obligatorio.';
      return;
    }
    if (!this.form.area_id) {
      this.errorMsg = 'El lugar (\u00e1rea) es obligatorio.';
      return;
    }    const phone = this.form.instructor_phone?.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
      this.errorMsg = 'El teléfono debe tener exactamente 10 dígitos numéricos.';
      return;
    }
    const email = this.form.instructor_email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMsg = 'Ingresa un correo electrónico válido.';
      return;
    }
    this.errorMsg = '';    this.saved.emit(this.form);
  }

  cerrar(): void {
    this.closed.emit();
  }
}
