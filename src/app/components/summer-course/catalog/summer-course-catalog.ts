import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScCatalogService } from '../../../services/summer-course/sc-catalog.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import {
  ScCatalogCategoryWithTypes,
  ScCatalogActivityTypeDetail,
  CreateScCatalogCategoryRequest,
  UpdateScCatalogCategoryRequest,
  CreateScCatalogActivityTypeRequest,
  UpdateScCatalogActivityTypeRequest,
} from '../../../models/summer-course/summer-course.model';

type CatModalMode = 'add' | 'edit';
type TypeModalMode = 'add' | 'edit';

@Component({
  selector: 'app-summer-course-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './summer-course-catalog.html',
  styleUrl: './summer-course-catalog.scss',
})
export class SummerCourseCatalogComponent implements OnInit {
  private svc = inject(ScCatalogService);

  // ── State ──────────────────────────────────────────────────────────────────
  categories = signal<ScCatalogCategoryWithTypes[]>([]);
  confirmDialog = signal<{ title: string; message: string; confirmLabel?: string; action: () => void } | null>(null);
  loading    = signal(true);
  error      = signal<string | null>(null);
  toast      = signal<string | null>(null);
  toastType  = signal<'success' | 'danger'>('success');

  // Category modal
  catModal     = signal(false);
  catMode      = signal<CatModalMode>('add');
  catSaving    = signal(false);
  catEditTarget = signal<ScCatalogCategoryWithTypes | null>(null);

  catId         = signal('');
  catLabel      = signal('');
  catEmoji      = signal('⭐');
  catColor      = signal('#6c757d');
  catSortOrder  = signal(99);

  catIdError    = computed(() => !this.catId().trim() && this.catMode() === 'add' ? 'Requerido' : null);
  catLabelError = computed(() => !this.catLabel().trim() ? 'Requerido' : null);

  // Type modal
  typeModal      = signal(false);
  typeMode       = signal<TypeModalMode>('add');
  typeSaving     = signal(false);
  typeEditTarget = signal<ScCatalogActivityTypeDetail | null>(null);
  typeContextCat = signal<string>('');   // default category when opening "add type" from a cat row

  typeId         = signal('');
  typeLabel      = signal('');
  typeEmoji      = signal('⭐');
  typeCategoryId = signal('');
  typeColor      = signal('#6c757d');
  typeBgColor    = signal('#f8f9fa');
  typeSortOrder  = signal(99);

  typeIdError    = computed(() => !this.typeId().trim() && this.typeMode() === 'add' ? 'Requerido' : null);
  typeLabelError = computed(() => !this.typeLabel().trim() ? 'Requerido' : null);
  typeCatError   = computed(() => !this.typeCategoryId().trim() ? 'Requerido' : null);

  // ── Init ──────────────────────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().subscribe({
      next: r => { this.categories.set(r.data.categories); this.loading.set(false); },
      error: e => { this.error.set(e.message || 'Error al cargar'); this.loading.set(false); },
    });
  }

  // ── Category modal ────────────────────────────────────────────────────────

  openAddCategory(): void {
    this.catMode.set('add');
    this.catEditTarget.set(null);
    this.catId.set(''); this.catLabel.set(''); this.catEmoji.set('⭐');
    this.catColor.set('#6c757d'); this.catSortOrder.set(99);
    this.catModal.set(true);
  }

  openEditCategory(cat: ScCatalogCategoryWithTypes): void {
    this.catMode.set('edit');
    this.catEditTarget.set(cat);
    this.catId.set(cat.id); this.catLabel.set(cat.label); this.catEmoji.set(cat.emoji);
    this.catColor.set(cat.color); this.catSortOrder.set(cat.sort_order);
    this.catModal.set(true);
  }

  closeCatModal(): void { this.catModal.set(false); }

  saveCat(): void {
    if (this.catLabelError()) return;
    this.catSaving.set(true);

    if (this.catMode() === 'add') {
      const body: CreateScCatalogCategoryRequest = {
        id: this.catId().trim(),
        label: this.catLabel().trim(),
        emoji: this.catEmoji().trim() || '⭐',
        color: this.catColor(),
        sort_order: this.catSortOrder(),
      };
      this.svc.addCategory(body).subscribe({
        next: () => { this.catModal.set(false); this.catSaving.set(false); this.showToast('Categoría creada'); this.load(); },
        error: e => { this.catSaving.set(false); this.showToast(e.error?.message || 'Error', 'danger'); },
      });
    } else {
      const target = this.catEditTarget()!;
      const body: UpdateScCatalogCategoryRequest = {
        label: this.catLabel().trim(),
        emoji: this.catEmoji().trim() || '⭐',
        color: this.catColor(),
        sort_order: this.catSortOrder(),
      };
      this.svc.editCategory(target.id, body).subscribe({
        next: () => { this.catModal.set(false); this.catSaving.set(false); this.showToast('Categoría actualizada'); this.load(); },
        error: e => { this.catSaving.set(false); this.showToast(e.error?.message || 'Error', 'danger'); },
      });
    }
  }

  deleteCategory(cat: ScCatalogCategoryWithTypes): void {
    this.confirmDialog.set({
      title: 'Eliminar categoría',
      message: `¿Eliminar "${cat.label}"?\nSe eliminarán también sus tipos de actividad.`,
      confirmLabel: 'Sí, eliminar',
      action: () => this.svc.deleteCategory(cat.id).subscribe({
        next: () => { this.showToast('Categoría eliminada'); this.load(); },
        error: e => this.showToast(e.error?.message || 'Error al eliminar', 'danger'),
      }),
    });
  }

  // ── Type modal ────────────────────────────────────────────────────────────

  openAddType(catId: string): void {
    this.typeMode.set('add');
    this.typeEditTarget.set(null);
    this.typeId.set(''); this.typeLabel.set(''); this.typeEmoji.set('⭐');
    this.typeCategoryId.set(catId); this.typeColor.set('#6c757d');
    this.typeBgColor.set('#f8f9fa'); this.typeSortOrder.set(99);
    this.typeModal.set(true);
  }

  openEditType(type: ScCatalogActivityTypeDetail): void {
    this.typeMode.set('edit');
    this.typeEditTarget.set(type);
    this.typeId.set(type.id); this.typeLabel.set(type.label); this.typeEmoji.set(type.emoji);
    this.typeCategoryId.set(type.category_id); this.typeColor.set(type.color);
    this.typeBgColor.set(type.bg); this.typeSortOrder.set(type.sort_order);
    this.typeModal.set(true);
  }

  closeTypeModal(): void { this.typeModal.set(false); }

  saveType(): void {
    if (this.typeLabelError() || this.typeCatError()) return;
    this.typeSaving.set(true);

    if (this.typeMode() === 'add') {
      const body: CreateScCatalogActivityTypeRequest = {
        id: this.typeId().trim(),
        label: this.typeLabel().trim(),
        emoji: this.typeEmoji().trim() || '⭐',
        category_id: this.typeCategoryId(),
        color: this.typeColor(),
        bg_color: this.typeBgColor(),
        sort_order: this.typeSortOrder(),
      };
      this.svc.addType(body).subscribe({
        next: () => { this.typeModal.set(false); this.typeSaving.set(false); this.showToast('Tipo creado'); this.load(); },
        error: e => { this.typeSaving.set(false); this.showToast(e.error?.message || 'Error', 'danger'); },
      });
    } else {
      const target = this.typeEditTarget()!;
      const body: UpdateScCatalogActivityTypeRequest = {
        label: this.typeLabel().trim(),
        emoji: this.typeEmoji().trim() || '⭐',
        category_id: this.typeCategoryId(),
        color: this.typeColor(),
        bg_color: this.typeBgColor(),
        sort_order: this.typeSortOrder(),
      };
      this.svc.editType(target.id, body).subscribe({
        next: () => { this.typeModal.set(false); this.typeSaving.set(false); this.showToast('Tipo actualizado'); this.load(); },
        error: e => { this.typeSaving.set(false); this.showToast(e.error?.message || 'Error', 'danger'); },
      });
    }
  }

  deleteType(type: ScCatalogActivityTypeDetail): void {
    this.confirmDialog.set({
      title: 'Eliminar tipo',
      message: `¿Eliminar "${type.label}"?`,
      confirmLabel: 'Sí, eliminar',
      action: () => this.svc.deleteType(type.id).subscribe({
        next: () => { this.showToast('Tipo eliminado'); this.load(); },
        error: e => this.showToast(e.error?.message || 'Error', 'danger'),
      }),
    });
  }

  executeConfirm(): void {
    const d = this.confirmDialog();
    this.confirmDialog.set(null);
    d?.action();
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  showToast(msg: string, type: 'success' | 'danger' = 'success'): void {
    this.toast.set(msg); this.toastType.set(type);
    setTimeout(() => this.toast.set(null), 3500);
  }
}
