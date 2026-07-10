import {
  Component, input, output, signal, computed, inject, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScGuestSyncService } from '../../../services/summer-course/sc-guest-sync.service';
import { ScGuest, CreateGuestPayload, UpdateGuestPayload } from '../../../models/summer-course/summer-course.model';

export type GuestModalTab = 'search' | 'new' | 'edit';

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

  /** ID del socio titular o número de empleado */
  readonly socioId = input.required<number | string>();
  /** Nombre del socio para mostrar en el header */
  readonly socioName = input<string>('');
  
  /** Datos del socio para autocompletado */
  readonly socioEmail = input<string>('');
  readonly socioPhone = input<string>('');

  /** IDs de invitados ya agregados al wizard (para marcarlos como 'Ya agregado') */
  readonly enrolledGuestIds = input<number[]>([]);

  /** Si se proporciona, el modal abre directamente en modo edición */
  readonly guestToEdit = input<ScGuest | null>(null);

  /** Emite el guest seleccionado/creado para inscribirlo */
  readonly guestSelected = output<ScGuest>();
  /** Emite el guest actualizado (modo edición) */
  readonly guestUpdated = output<ScGuest>();
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

  readonly isEmp = computed(() => {
    const sId = this.socioId();
    return typeof sId === 'string' && sId.startsWith('EMP-');
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
    return !!(f.first_name.trim() && f.last_name.trim() && f.birth_date && f.relationship.trim() && f.phone.trim());
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const editGuest = this.guestToEdit();
    if (editGuest) {
      // Modo edición: prefill y abrir en pestaña edit
      this.tab.set('edit');
      this.form.set({
        first_name:       editGuest.first_name ?? '',
        last_name:        editGuest.last_name ?? '',
        second_last_name: editGuest.second_last_name ?? '',
        email:            editGuest.email ?? '',
        phone:            editGuest.phone ?? '',
        birth_date:       editGuest.birth_date ?? '',
        rfc:              editGuest.rfc ?? '',
        relationship:     editGuest.relationship ?? '',
      });
    } else {
      this.loadGuests();
      if (!this.isEmp()) {
        this.form.update(f => ({
          ...f,
          email: this.socioEmail() || '',
          phone: this.socioPhone() || '',
        }));
      }
    }
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
    if (field === 'first_name' || field === 'last_name' || field === 'second_last_name' || field === 'birth_date') {
      this.tryAutoCompleteCURP();
    }
  }

  private tryAutoCompleteCURP(): void {
    const f = this.form();
    if (!f.first_name || !f.last_name || !f.birth_date || f.birth_date.length !== 10) return;
    
    // Si ya escribió un CURP completo (más de 10 chars), no lo sobreescribimos
    if (f.rfc && f.rfc.length > 10) return;

    const clean = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const pat = clean(f.last_name);
    const mat = f.second_last_name ? clean(f.second_last_name) : 'X';
    const nom = clean(f.first_name);
    
    if (!pat || !nom) return;
    
    const firstLetterPat = pat.charAt(0);
    let firstVowelPat = 'X';
    for (let i = 1; i < pat.length; i++) {
       if (['A','E','I','O','U'].includes(pat.charAt(i))) {
           firstVowelPat = pat.charAt(i);
           break;
       }
    }
    const firstLetterMat = mat.charAt(0) || 'X';
    const firstLetterName = nom.charAt(0) || 'X';
    
    const parts = f.birth_date.split('-');
    if (parts.length !== 3) return;
    const yy = parts[0].slice(2,4);
    const mm = parts[1];
    const dd = parts[2];
    
    const generated = `${firstLetterPat}${firstVowelPat}${firstLetterMat}${firstLetterName}${yy}${mm}${dd}`;
    
    if (f.rfc !== generated) {
      this.form.update(curr => ({ ...curr, rfc: generated }));
    }
  }

  saveNewGuest(): void {
    if (!this.formValid()) return;
    const f = this.form();
    const sId = this.socioId();
    const isEmp = typeof sId === 'string' && sId.startsWith('EMP-');

    const payload: CreateGuestPayload = {
      first_name:       f.first_name.trim(),
      last_name:        f.last_name.trim(),
      second_last_name: f.second_last_name.trim() || undefined,
      email:            f.email.trim(),
      phone:            f.phone.trim() || undefined,
      birth_date:       f.birth_date,
      rfc:              f.rfc.trim().toUpperCase() || undefined,
      relationship:     isEmp ? `${f.relationship.trim()} (EMP: ${sId} - ${this.socioName()})` : f.relationship.trim(),
      socio_id:         isEmp ? (null as any) : (sId as number),
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

  saveEditGuest(): void {
    const editGuest = this.guestToEdit();
    if (!editGuest) return;
    const f = this.form();
    const payload: UpdateGuestPayload = {
      first_name:       f.first_name.trim()        || undefined,
      last_name:        f.last_name.trim()          || undefined,
      second_last_name: f.second_last_name.trim()  || undefined,
      email:            f.email.trim()              || undefined,
      phone:            f.phone.trim()              || undefined,
      birth_date:       f.birth_date               || undefined,
      rfc:              f.rfc.trim().toUpperCase()  || undefined,
      relationship:     f.relationship.trim()       || undefined,
    };
    this.saving.set(true);
    this.errorMsg.set(null);
    this.guestSvc.updateGuest(editGuest.id, payload).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.data?.guest) {
          this.successMsg.set(`✓ ${r.data.guest.full_name} actualizado correctamente`);
          setTimeout(() => this.guestUpdated.emit(r.data.guest), 900);
        }
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al actualizar el invitado.');
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
