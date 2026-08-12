import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AccessType,
  ACCESS_TYPE_META,
  InstitutionalEventSubevent,
  SubeventStatus,
  SUBEVENT_STATUS_META,
} from '../../models/institutional-event.model';

/** Valor de trabajo local del modal (subset editable de InstitutionalEventSubevent). */
type SubeventoForm = {
  name: string;
  start_date: string;
  end_date: string;
  venue: string;
  max_capacity: number;
  cost: number;
  access_type: AccessType;
  status: SubeventStatus;
  instructor_name: string;
  description: string;
};

function empty(): SubeventoForm {
  return {
    name: '', start_date: '', end_date: '', venue: '',
    max_capacity: 0, cost: 0, access_type: 'public', status: 'confirmed',
    instructor_name: '', description: '',
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
  imports: [CommonModule, FormsModule],
  templateUrl: './subevent-modal.html',
  styleUrl: './subevent-modal.scss',
})
export class SubeventModalComponent implements OnChanges {
  @Input() subevento: Partial<InstitutionalEventSubevent> | null = null;

  @Output() saved = new EventEmitter<SubeventoForm>();
  @Output() closed = new EventEmitter<void>();

  readonly accessTypeMeta = ACCESS_TYPE_META;
  readonly subeventStatusMeta = SUBEVENT_STATUS_META;
  readonly accessTypes: AccessType[] = ['public', 'members_only', 'registration', 'restricted', 'committee'];
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
          max_capacity: this.subevento.max_capacity ?? 0,
          cost: this.subevento.cost ?? 0,
          access_type: this.subevento.access_type ?? 'public',
          status: this.subevento.status ?? 'confirmed',
          instructor_name: this.subevento.instructor_name ?? '',
          description: this.subevento.description ?? '',
        }
      : empty();
  }

  guardar(): void {
    if (!this.form.name.trim()) {
      this.errorMsg = 'El nombre del subevento es obligatorio.';
      return;
    }
    this.saved.emit(this.form);
  }

  cerrar(): void {
    this.closed.emit();
  }
}
