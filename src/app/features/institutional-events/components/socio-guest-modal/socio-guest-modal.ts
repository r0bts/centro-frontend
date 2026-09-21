import { Component, EventEmitter, Input, Output, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SocioGuest } from '../../../../models/socio-guest.model';
import { SocioGuestsService } from '../../../../services/socio-guests.service';

type GuestModalTab = 'search' | 'new' | 'edit';

@Component({
  selector: 'app-socio-guest-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './socio-guest-modal.html',
  styleUrl: './socio-guest-modal.scss'
})
export class SocioGuestModal implements OnInit {
  @Input({ required: true }) socioId!: number;
  @Input() socioName: string = '';
  @Input() socioEmail: string = '';
  @Input() socioPhone: string = '';
  
  /** IDs de invitados que ya se seleccionaron en el parent (para deshabilitarlos) */
  @Input() enrolledGuestIds: number[] = [];
  
  @Output() guestSelected = new EventEmitter<SocioGuest>();
  @Output() closed = new EventEmitter<void>();

  readonly tab = signal<GuestModalTab>('search');
  readonly guests = signal<SocioGuest[]>([]);
  readonly loadingList = signal(true);
  readonly saving = signal(false);

  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  readonly form = signal({
    first_name: '',
    last_name: '',
    second_last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    rfc: '',
    relationship: '',
  });

  readonly relationships = [
    'Hijo(a)',
    'Sobrino(a)',
    'Nieto(a)',
    'Amigo(a)',
    'Otro'
  ];

  readonly formValid = computed(() => {
    const f = this.form();
    return !!(
      f.first_name.trim() &&
      f.last_name.trim() &&
      f.second_last_name.trim() &&
      f.email.trim() &&
      f.phone.trim() &&
      f.birth_date &&
      f.rfc.trim() &&
      f.relationship.trim()
    );
  });

  constructor(private guestSvc: SocioGuestsService) {}

  ngOnInit(): void {
    this.loadGuests();
    this.form.update(f => ({
      ...f,
      email: this.socioEmail || '',
      phone: this.socioPhone || '',
    }));
  }

  setTab(t: GuestModalTab): void {
    this.tab.set(t);
    this.errorMsg.set(null);
    this.successMsg.set(null);
  }

  async loadGuests(): Promise<void> {
    this.loadingList.set(true);
    try {
      const res = await firstValueFrom<any>(this.guestSvc.getBySocio(this.socioId));
      if (res.success && res.data) {
        this.guests.set(res.data);
      }
    } catch (err: any) {
      this.errorMsg.set('Error cargando invitados previos.');
    } finally {
      this.loadingList.set(false);
    }
  }

  isAlreadyAdded(guestId: number): boolean {
    return this.enrolledGuestIds.includes(guestId);
  }

  selectGuest(g: SocioGuest): void {
    if (g.id && this.isAlreadyAdded(g.id)) return;
    this.guestSelected.emit(g);
  }

  updateForm(field: keyof ReturnType<typeof this.form>, value: string): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  async saveNewGuest(): Promise<void> {
    if (!this.formValid()) return;
    const f = this.form();

    const payload: SocioGuest = {
      first_name:       f.first_name.trim(),
      last_name:        f.last_name.trim(),
      second_last_name: f.second_last_name.trim() || undefined,
      email:            f.email.trim(),
      phone:            f.phone.trim() || undefined,
      birth_date:       f.birth_date || undefined,
      rfc:              f.rfc.trim() || undefined,
      relationship:     f.relationship.trim(),
      socio_id:         this.socioId,
    };

    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    try {
      const r = await firstValueFrom<any>(this.guestSvc.create(payload));
      if (r.success && r.data) {
        this.successMsg.set(`✓ ${r.data.first_name} ${r.data.last_name} guardado correctamente`);
        this.guests.update(list => [r.data, ...list]);
        // Select newly created guest after a delay
        setTimeout(() => this.guestSelected.emit(r.data), 1200);
      }
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message ?? 'Error al guardar el invitado.');
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.closed.emit();
  }
}
