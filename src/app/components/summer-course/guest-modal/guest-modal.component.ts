import {
  Component, input, output, signal, computed, inject, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScGuestSyncService } from '../../../services/summer-course/sc-guest-sync.service';
import { ScGuest, CreateGuestPayload } from '../../../models/summer-course/summer-course.model';

export type GuestModalTab = 'search' | 'new';

@Component({
  selector: 'app-guest-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guest-modal.component.html',
  styleUrls: ['./guest-modal.component.scss'],
})
export class GuestModalComponent implements OnInit {
  private readonly guestSvc = inject(ScGuestSyncService);

  /** ID del socio titular */
  readonly socioId = input.required<number>();
  /** Nombre del socio para mostrar en el header */
  readonly socioName = input<string>('');

  /** IDs de invitados ya agregados al wizard (para marcarlos como 'Ya agregado') */
  readonly enrolledGuestIds = input<number[]>([]);

  /** Emite el guest seleccionado/creado para inscribirlo */
  readonly guestSelected = output<ScGuest>();
  /** Emite cuando el usuario cierra sin seleccionar */
  readonly closed = output<void>();

  // ── State ──────────────────────────────────────────────────────────────────
  readonly tab         = signal<GuestModalTab>('search');
  readonly loadingList = signal(false);
  readonly saving      = signal(false);
  readonly guests      = signal<ScGuest[]>([]);
  readonly errorMsg    = signal<string | null>(null);
  readonly successMsg  = signal<string | null>(null);

  // ── New guest form ─────────────────────────────────────────────────────────
  readonly form = signal({
    first_name:       '',
    last_name:        '',
    second_last_name: '',
    email:            '',
    phone:            '',
    birth_date:       '',
    rfc:              '',
    relationship:     '',
  });

  readonly calcAge = computed(() => {
    return ScGuestSyncService.calcAge(this.form().birth_date);
  });

  readonly ageWarning = computed(() => {
    const age = this.calcAge();
    if (age === null) return null;
    if (age < 3)  return 'El participante es menor de 3 años (fuera del rango del curso).';
    if (age > 15) return 'El participante es mayor de 15 años (fuera del rango del curso).';
    return null;
  });

  readonly formValid = computed(() => {
    const f = this.form();
    return f.first_name.trim() && f.last_name.trim() && f.email.trim() && f.phone.trim() && f.birth_date;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadGuests();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  setTab(t: GuestModalTab): void {
    this.tab.set(t);
    this.errorMsg.set(null);
    this.successMsg.set(null);
  }

  loadGuests(): void {
    this.loadingList.set(true);
    this.guestSvc.getGuestsBySocio(this.socioId()).subscribe({
      next: (r) => {
        this.guests.set(r.data?.guests ?? []);
        this.loadingList.set(false);
      },
      error: () => {
        this.loadingList.set(false);
        this.errorMsg.set('Error cargando invitados previos.');
      },
    });
  }

  isAlreadyAdded(guestId: number): boolean {
    return this.enrolledGuestIds().includes(guestId);
  }

  selectGuest(g: ScGuest): void {
    if (this.isAlreadyAdded(g.id)) return;
    this.guestSelected.emit(g);
  }

  updateForm(field: keyof ReturnType<typeof this.form>, value: string): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  saveNewGuest(): void {
    if (!this.formValid()) return;
    const f = this.form();
    const payload: CreateGuestPayload = {
      first_name:       f.first_name.trim(),
      last_name:        f.last_name.trim(),
      second_last_name: f.second_last_name.trim() || undefined,
      email:            f.email.trim(),
      phone:            f.phone.trim() || undefined,
      birth_date:       f.birth_date,
      rfc:              f.rfc.trim().toUpperCase() || undefined,
      relationship:     f.relationship.trim() || undefined,
      socio_id:         this.socioId(),
    };

    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.guestSvc.createGuest(payload).subscribe({
      next: (r) => {
        this.saving.set(false);
        const guest = r.data?.guest;
        if (guest) {
          this.successMsg.set(r.data.ns_synced
            ? `✓ ${guest.full_name} guardado y sincronizado con NetSuite`
            : `⚠ ${guest.full_name} guardado. Sync NetSuite pendiente.`);
          this.guests.update(list => [guest, ...list]);
          // Auto-select the new guest after a brief moment
          setTimeout(() => this.guestSelected.emit(guest), 1200);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al guardar el invitado.');
      },
    });
  }

  retrySync(g: ScGuest, event: Event): void {
    event.stopPropagation();
    this.guestSvc.retrySync(g.id).subscribe({
      next: (r) => {
        if (r.data?.guest) {
          this.guests.update(list => list.map(x => x.id === g.id ? r.data.guest : x));
        }
      },
      error: () => {},
    });
  }

  close(): void {
    this.closed.emit();
  }

  /** Formatea una fecha YYYY-MM-DD para mostrar */
  formatDate(d: string | null): string {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  guestAge(g: ScGuest): number | null {
    return ScGuestSyncService.calcAge(g.birth_date);
  }
}
