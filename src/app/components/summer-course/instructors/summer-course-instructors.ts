import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScInstructorsService } from '../../../services/summer-course/sc-instructors.service';
import { ScInstructor } from '../../../models/summer-course/summer-course.model';

@Component({
  selector: 'app-summer-course-instructors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './summer-course-instructors.html',
  styleUrl: './summer-course-instructors.scss',
})
export class SummerCourseInstructorsComponent implements OnInit {
  private svc = inject(ScInstructorsService);

  // ── State ──────────────────────────────────────────────────────────────────
  instructors   = signal<ScInstructor[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);
  toastType     = signal<'success' | 'danger'>('success');

  // Modal
  formOpen      = signal(false);
  editTarget    = signal<ScInstructor | null>(null);
  deleteTarget  = signal<ScInstructor | null>(null);
  deleting      = signal(false);
  formSaving    = signal(false);

  // Filtro
  search        = signal('');

  get filteredInstructors(): ScInstructor[] {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.instructors();
    return this.instructors().filter(i =>
      i.first_name.toLowerCase().includes(q) ||
      i.last_name.toLowerCase().includes(q)  ||
      (i.specialty ?? '').toLowerCase().includes(q) ||
      (i.email ?? '').toLowerCase().includes(q)
    );
  }

  // Form fields
  formFirstName  = signal('');
  formLastName   = signal('');
  formEmail      = signal('');
  formSpecialty  = signal('');

  // Last created credentials (shown once after create)
  createdCredentials = signal<{username: string; password: string} | null>(null);

  get isEdit(): boolean { return this.editTarget() !== null; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadInstructors();
  }

  loadInstructors(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: res => {
        this.instructors.set(res.data.instructors ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar instructores.');
        this.loading.set(false);
      },
    });
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editTarget.set(null);
    this.formFirstName.set('');
    this.formLastName.set('');
    this.formEmail.set('');
    this.formSpecialty.set('');
    this.formSaving.set(false);
    this.formOpen.set(true);
  }

  openEdit(inst: ScInstructor): void {
    this.editTarget.set(inst);
    this.formFirstName.set(inst.first_name);
    this.formLastName.set(inst.last_name);
    this.formEmail.set(inst.email ?? '');
    this.formSpecialty.set(inst.specialty ?? '');
    this.formSaving.set(false);
    this.formOpen.set(true);
  }

  cancelForm(): void { this.formOpen.set(false); }

  saveInstructor(): void {
    const fn = this.formFirstName().trim();
    const ln = this.formLastName().trim();
    if (!fn || !ln) {
      this.error.set('El nombre y apellido son requeridos.');
      return;
    }

    this.formSaving.set(true);
    const payload = {
      first_name: fn,
      last_name:  ln,
      email:      this.formEmail().trim(),
      specialty:  this.formSpecialty().trim(),
    };

    if (this.isEdit) {
      const id = this.editTarget()!.id;
      this.svc.update(id, payload).subscribe({
        next: res => {
          this.instructors.update(list => list.map(i => i.id === id ? res.data : i));
          this.formSaving.set(false);
          this.formOpen.set(false);
          this.showToast('Instructor actualizado.', 'success');
        },
        error: () => {
          this.formSaving.set(false);
          this.error.set('Error al actualizar instructor.');
        },
      });
    } else {
      this.svc.create(payload).subscribe({
        next: res => {
          this.instructors.update(list => [...list, res.data]);
          this.formSaving.set(false);
          this.formOpen.set(false);
          // Show credentials if backend returns them
          if ((res as any).credentials) {
            this.createdCredentials.set((res as any).credentials);
          }
          this.showToast('Instructor creado correctamente.', 'success');
        },
        error: () => {
          this.formSaving.set(false);
          this.error.set('Error al crear instructor.');
        },
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(inst: ScInstructor): void { this.deleteTarget.set(inst); }
  cancelDelete(): void                   { this.deleteTarget.set(null); }

  executeDelete(): void {
    const t = this.deleteTarget();
    if (!t) return;
    this.deleting.set(true);
    this.svc.delete(t.id).subscribe({
      next: () => {
        this.instructors.update(list => list.filter(i => i.id !== t.id));
        this.deleteTarget.set(null);
        this.deleting.set(false);
        this.showToast('Instructor eliminado.', 'success');
      },
      error: () => {
        this.deleting.set(false);
        this.showToast('Error al eliminar.', 'danger');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  initials(inst: ScInstructor): string {
    return `${inst.first_name[0] ?? ''}${inst.last_name[0] ?? ''}`.toUpperCase();
  }

  fullName(inst: ScInstructor): string {
    return `${inst.first_name} ${inst.last_name}`;
  }

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 3500);
  }

  clearError(): void { this.error.set(null); }
}
