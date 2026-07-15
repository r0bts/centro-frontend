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
import { ScCoursesService } from '../../../services/summer-course/sc-courses.service';
import { ScLevelGroupsService } from '../../../services/summer-course/sc-level-groups.service';
import {
  ScInstructor,
  ScInstructorCredentialPreview,
  ScCourse,
  ScLevelGroupByLevel,
} from '../../../models/summer-course/summer-course.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-summer-course-instructors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './summer-course-instructors.html',
  styleUrl: './summer-course-instructors.scss',
})
export class SummerCourseInstructorsComponent implements OnInit {
  private svc          = inject(ScInstructorsService);
  private coursesSvc   = inject(ScCoursesService);
  private lgSvc        = inject(ScLevelGroupsService);

  // ── State ──────────────────────────────────────────────────────────────────
  instructors   = signal<ScInstructor[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<string | null>(null);
  toastType     = signal<'success' | 'danger'>('success');

  // Modal crear/editar
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

  // Nivel y grupo en el formulario
  formGroupId    = signal<number | null>(null);   // grupo seleccionado (id)
  formLevelId    = signal<number | null>(null);   // nivel seleccionado (level_id)
  levelGroupsAll = signal<ScLevelGroupByLevel[]>([]);
  levelGroupsLoading = signal(false);

  get formLevels(): ScLevelGroupByLevel[] {
    return this.levelGroupsAll();
  }

  get formGroupsForLevel(): { id: number; alias: string }[] {
    const lvl = this.formLevelId();
    if (!lvl) return [];
    return (this.levelGroupsAll().find(l => l.level_id === lvl)?.groups ?? [])
      .map(g => ({ id: g.id, alias: g.alias }));
  }

  private _loadLevelGroups(): void {
    if (this.levelGroupsAll().length > 0) return;
    this.levelGroupsLoading.set(true);
    this.lgSvc.getAll().subscribe({
      next: res => {
        this.levelGroupsAll.set(res.data?.groups_by_level ?? []);
        this.levelGroupsLoading.set(false);
        // Si estamos editando, re-calcular level_id ahora que tenemos datos
        const target = this.editTarget();
        if (target && this.formLevelId() === null && target.level_number != null) {
          const lvl = this.levelGroupsAll().find(l => l.level_number === target.level_number);
          this.formLevelId.set(lvl?.level_id ?? null);
        }
      },
      error: () => this.levelGroupsLoading.set(false),
    });
  }

  // Credenciales generadas al crear
  createdCredentials = signal<{username: string; password: string} | null>(null);

  get isEdit(): boolean { return this.editTarget() !== null; }

  // ── Credencial ─────────────────────────────────────────────────────────────
  courses            = signal<ScCourse[]>([]);
  credModalOpen      = signal(false);
  credModalLoading   = signal(false);
  credModalData      = signal<ScInstructorCredentialPreview | null>(null);
  credInstructor     = signal<ScInstructor | null>(null);
  credSelectedCourse = signal<number | null>(null);   // course_id seleccionado en el modal
  credNotes          = signal('');
  credDelivering     = signal(false);
  // Cámara
  credCameraStream   = signal<MediaStream | null>(null);
  credCameraFacing   = signal<'user' | 'environment'>('user');
  private _credCameraStarting = false;
  credPhotoPreview   = signal<string | null>(null);   // base64 antes de guardar
  credPhotoSaving    = signal(false);
  credCameraMode     = signal<'camera' | 'file'>('camera');
  photoBaseUrl       = `${window.location.origin}/`;
  readonly origin     = window.location.origin;
  readonly encodeURI  = encodeURIComponent;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadInstructors();
    this._loadCourses();
  }

  _loadCourses(): void {
    this.coursesSvc.getAll().subscribe({
      next: res => this.courses.set(res.data?.courses ?? []),
      error: () => {},
    });
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
    this.formLevelId.set(null);
    this.formGroupId.set(null);
    this.formSaving.set(false);
    this._loadLevelGroups();
    this.formOpen.set(true);
  }

  openEdit(inst: ScInstructor): void {
    this.editTarget.set(inst);
    this.formFirstName.set(inst.first_name);
    this.formLastName.set(inst.last_name);
    this.formEmail.set(inst.email ?? '');
    this.formSpecialty.set(inst.specialty ?? '');
    this.formSaving.set(false);
    this._loadLevelGroups();
    // Pre-populate level/group
    // level_id: find by level_number in the loaded groups
    const lvl = this.levelGroupsAll().find(l => l.level_number === inst.level_number);
    this.formLevelId.set(lvl?.level_id ?? inst.level_number ?? null);
    this.formGroupId.set(inst.group_id ?? null);
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

    const afterSave = (savedInstructor: ScInstructor) => {
      const selectedGroup = this.formGroupId();
      const originalGroup = this.editTarget()?.group_id ?? null;
      const groupChanged  = selectedGroup !== originalGroup;

      if (groupChanged) {
        this.svc.assignGroup(savedInstructor.id, selectedGroup).subscribe({
          next: res => {
            this.instructors.update(list =>
              list.map(i => i.id === res.data.id ? res.data : i)
            );
            this.formSaving.set(false);
            this.formOpen.set(false);
            this.showToast(this.isEdit ? 'Instructor actualizado.' : 'Instructor creado correctamente.', 'success');
          },
          error: () => {
            this.formSaving.set(false);
            this.formOpen.set(false);
            this.showToast('Datos guardados. Error al asignar grupo.', 'danger');
          },
        });
      } else {
        this.instructors.update(list =>
          list.some(i => i.id === savedInstructor.id)
            ? list.map(i => i.id === savedInstructor.id ? savedInstructor : i)
            : [...list, savedInstructor]
        );
        this.formSaving.set(false);
        this.formOpen.set(false);
        this.showToast(this.isEdit ? 'Instructor actualizado.' : 'Instructor creado correctamente.', 'success');
      }
    };

    if (this.isEdit) {
      const id = this.editTarget()!.id;
      this.svc.update(id, payload).subscribe({
        next: res => afterSave(res.data),
        error: () => {
          this.formSaving.set(false);
          this.error.set('Error al actualizar instructor.');
        },
      });
    } else {
      this.svc.create(payload).subscribe({
        next: res => {
          if ((res as any).credentials) {
            this.createdCredentials.set((res as any).credentials);
          }
          afterSave(res.data);
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

  getQrUrl(token: string | null | undefined): string {
    if (!token) return '';
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return encodeURIComponent(`${baseUrl}/${token}`);
  }

  // ── Credencial ────────────────────────────────────────────────────────────

  openCredentialModal(inst: ScInstructor): void {
    this.credInstructor.set(inst);
    this.credModalData.set(null);
    this.credPhotoPreview.set(null);
    this.credNotes.set('');
    this.credDelivering.set(false);
    this.credCameraMode.set('camera');
    // Preseleccionar primer curso si solo hay uno
    const courses = this.courses();
    this.credSelectedCourse.set(courses.length === 1 ? courses[0].id : null);
    this.credModalOpen.set(true);
    if (courses.length === 1) {
      this._loadCredentialPreview(inst.id, courses[0].id);
    }
  }

  onCredCourseChange(courseId: number): void {
    this.credSelectedCourse.set(courseId);
    const inst = this.credInstructor();
    if (inst && courseId) this._loadCredentialPreview(inst.id, courseId);
  }

  _loadCredentialPreview(instructorId: number, courseId: number): void {
    this.credModalLoading.set(true);
    this.credModalData.set(null);
    this.svc.getCredentialPreview(instructorId, courseId).subscribe({
      next: res => { this.credModalData.set(res.data); this.credModalLoading.set(false); },
      error: () => { this.credModalLoading.set(false); this.showToast('Error al cargar credencial', 'danger'); },
    });
  }

  closeCredentialModal(): void {
    this._stopCredCamera();
    this.credModalOpen.set(false);
    this.credModalData.set(null);
    this.credPhotoPreview.set(null);
  }

  // Cámara
  async startCredCamera(videoEl: HTMLVideoElement): Promise<void> {
    if (this._credCameraStarting || this.credCameraStream()) return;
    this._credCameraStarting = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.credCameraFacing() }, audio: false });
      this.credCameraStream.set(stream);
      videoEl.srcObject = stream;
    } catch {
      this.showToast('No se pudo acceder a la cámara', 'danger');
      this.credCameraMode.set('file');
    } finally {
      this._credCameraStarting = false;
    }
  }

  async toggleCredCamera(videoEl: HTMLVideoElement): Promise<void> {
    this._stopCredCamera();
    this.credCameraFacing.set(this.credCameraFacing() === 'user' ? 'environment' : 'user');
    await this.startCredCamera(videoEl);
  }

  captureCredPhoto(videoEl: HTMLVideoElement): void {
    const canvas = document.createElement('canvas');
    canvas.width  = videoEl.videoWidth  || 640;
    canvas.height = videoEl.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0);
    this.credPhotoPreview.set(canvas.toDataURL('image/jpeg', 0.85));
    this._stopCredCamera();
  }

  onCredFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => this.credPhotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  saveCredPhoto(): void {
    const base64   = this.credPhotoPreview();
    const inst     = this.credInstructor();
    const courseId = this.credSelectedCourse();
    if (!base64 || !inst || !courseId) return;

    this.credPhotoSaving.set(true);
    this.svc.uploadInstructorPhoto(inst.id, courseId, base64).subscribe({
      next: () => {
        this.credPhotoSaving.set(false);
        this.credPhotoPreview.set(null);
        this.showToast('Fotografía guardada correctamente ✓', 'success');
        this._loadCredentialPreview(inst.id, courseId);
      },
      error: err => {
        this.credPhotoSaving.set(false);
        this.showToast(err?.error?.message ?? 'Error al guardar fotografía', 'danger');
      },
    });
  }

  deliverInstructorCredential(): void {
    const inst     = this.credInstructor();
    const courseId = this.credSelectedCourse();
    if (!inst || !courseId) return;

    this.credDelivering.set(true);
    this.svc.deliverCredential(inst.id, courseId, this.credNotes() || undefined).subscribe({
      next: () => {
        this.credDelivering.set(false);
        this.showToast('Credencial marcada como entregada ✓', 'success');
        this._loadCredentialPreview(inst.id, courseId);
      },
      error: err => {
        this.credDelivering.set(false);
        this.showToast(err?.error?.message ?? 'Error al registrar entrega', 'danger');
      },
    });
  }

  printInstructorCredential(): void {
    const data = this.credModalData();
    const card = document.querySelector('.credential-card') as HTMLElement | null;
    if (!card) return;

    const openPrintWindow = (cardHtml: string) => {
      const win = window.open('', '_blank', 'width=350,height=550');
      if (!win) return;
      let stylesHtml = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        stylesHtml += el.outerHTML;
      });
      win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Credencial - ${data?.full_name || ''}</title>
${stylesHtml}
<style>
  @page { size: 54mm 85mm; margin: 0; }
  body { margin: 0; padding: 0; background: white; display: flex; justify-content: center; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .credential-card { transform: none !important; box-shadow: none !important; border: none !important; margin: 0 !important; }
</style>
</head>
<body>${cardHtml}</body>
</html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 600);
    };

    const toBase64 = (url: string): Promise<string> =>
      fetch(url)
        .then(r => r.blob())
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));

    const logoUrl       = '/assets/images/logo-centro-libanes.png';
    const courseLogoUrl = '/assets/images/logocurso2026.webp';
    const photoUrl      = data?.photo_url ? this.photoBaseUrl + data.photo_url : null;

    const logoP       = toBase64(logoUrl).catch(() => null);
    const courseLogoP = toBase64(courseLogoUrl).catch(() => null);
    const photoP      = photoUrl ? toBase64(photoUrl).catch(() => null) : Promise.resolve(null);

    Promise.all([logoP, courseLogoP, photoP]).then(([logoB64, courseLogoB64, photoB64]) => {
      let html = card.outerHTML;
      if (logoB64) {
        html = html.replace(/src="\/assets\/images\/logo-centro-libanes\.png"/g, `src="${logoB64}"`);
      }
      if (courseLogoB64) {
        html = html.replace(/src="\/assets\/images\/logocurso2026\.webp"/g, `src="${courseLogoB64}"`);
      }
      if (photoB64) {
        html = html.replace(/<img[^>]*class="cred-photo-img"[^>]*src="([^"]+)"[^>]*>/, (match, p1) => {
          return match.replace(p1, photoB64);
        });
      }
      openPrintWindow(html);
    });
  }

  _stopCredCamera(): void {
    this.credCameraStream()?.getTracks().forEach(t => t.stop());
    this.credCameraStream.set(null);
  }
}
