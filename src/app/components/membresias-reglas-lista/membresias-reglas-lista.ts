import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ContentMenu } from '../content-menu/content-menu';
import { ReglaService } from '../../services/regla.service';
import { ReglaListItem } from '../../models/regla.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-membresias-reglas-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu, DragDropModule],
  templateUrl: './membresias-reglas-lista.html',
  styleUrls: ['./membresias-reglas-lista.scss'],
})
export class MembresiasReglasListaComponent implements OnInit, OnDestroy {
  activeSection: string = 'membresias-reglas';

  // ── Datos ────────────────────────────────────────────────
  reglas = signal<ReglaListItem[]>([]);
  isLoading = signal(true);
  isReordering = signal(false);

  // ── Filtros ──────────────────────────────────────────────
  searchTerm = signal('');
  filterTipo = signal('');
  filterAccion = signal('');
  filterEstado = signal('');

  // ── Paginación server-side ───────────────────────────────
  currentPage = signal(1);
  itemsPerPage = signal(15);
  totalItems = signal(0);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.itemsPerPage()))
  );

  hasActiveFilters = computed(
    () =>
      !!this.searchTerm() ||
      !!this.filterTipo() ||
      !!this.filterAccion() ||
      this.filterEstado() !== ''
  );

  /**
   * Drag & Drop is disabled when any filter/search is active.
   * Re-ordering with a filtered subset would produce incorrect
   * numero_regla assignments for the hidden rows.
   */
  dragEnabled = computed(() => !this.hasActiveFilters());

  Math = Math;

  // Subject used to debounce search-term changes
  private searchChange$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private reglaService: ReglaService
  ) {}

  ngOnInit(): void {
    // Debounce the search input — wait 350 ms after last keystroke
    this.searchChange$
      .pipe(debounceTime(350), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadReglas();
      });

    this.loadReglas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ─────────────────────────────────────────

  loadReglas(): void {
    this.isLoading.set(true);

    this.reglaService
      .getReglas({
        page: this.currentPage(),
        limit: this.itemsPerPage(),
        tipo: this.filterTipo(),
        accion: this.filterAccion(),
        activa: this.filterEstado(),
        search: this.searchTerm(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.reglas.set(res.data.rules);
          this.totalItems.set(res.data.pagination.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar reglas',
            text: 'No se pudo conectar con el servidor. Intenta de nuevo.',
            confirmButtonColor: '#DA3E3E',
          });
        },
      });
  }

  // ── Navegación ───────────────────────────────────────────

  onNuevaRegla(): void {
    this.router.navigate(['/membresias/reglas/crear']);
  }

  onEditarRegla(regla: ReglaListItem): void {
    this.router.navigate(['/membresias/reglas/editar', regla.id]);
  }

  onVerRegla(regla: ReglaListItem): void {
    this.router.navigate(['/membresias/reglas', regla.id]);
  }

  // ── Acciones ─────────────────────────────────────────────

  onEliminarRegla(regla: ReglaListItem): void {
    Swal.fire({
      title: '¿Eliminar regla?',
      html: `¿Estás seguro de eliminar la regla <strong>#${regla.numeroRegla} — ${regla.nombre}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#DA3E3E',
      cancelButtonColor: '#8A8A8A',
    }).then((result) => {
      if (result.isConfirmed) {
        this.reglaService
          .deleteRegla(regla.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Regla eliminada',
                text: `La regla #${regla.numeroRegla} fue eliminada correctamente`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
              });
              // Adjust page if we deleted the last item on this page
              if (this.reglas().length === 1 && this.currentPage() > 1) {
                this.currentPage.update((p) => p - 1);
              }
              this.loadReglas();
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: 'No se pudo eliminar la regla. Intenta de nuevo.',
                confirmButtonColor: '#DA3E3E',
              });
            },
          });
      }
    });
  }

  onToggleEstado(regla: ReglaListItem): void {
    const nuevoEstado = !regla.activa;
    const label = nuevoEstado ? 'activar' : 'desactivar';

    Swal.fire({
      title: `¿${nuevoEstado ? 'Activar' : 'Desactivar'} regla?`,
      html: `La regla <strong>#${regla.numeroRegla}</strong> quedará <strong>${nuevoEstado ? 'activa' : 'inactiva'}</strong> inmediatamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${label}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado ? '#43B581' : '#F4D35E',
    }).then((result) => {
      if (result.isConfirmed) {
        this.reglaService
          .toggleRegla(regla.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              // Update only the affected row without a full reload
              this.reglas.update((rs) =>
                rs.map((r) =>
                  r.id === regla.id ? { ...r, activa: res.data.activa } : r
                )
              );
              Swal.fire({
                icon: 'success',
                title: nuevoEstado ? 'Regla activada' : 'Regla desactivada',
                timer: 1800,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
              });
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'Error al cambiar estado',
                text: 'No se pudo cambiar el estado de la regla.',
                confirmButtonColor: '#DA3E3E',
              });
            },
          });
      }
    });
  }

  // ── Drag & Drop ──────────────────────────────────────────

  /**
   * Called by CDK when the user drops a dragged row.
   *
   * 1. Move the item locally (instant visual feedback)
   * 2. Send the new id order to PATCH /api/reglas-negocio/reorder
   * 3. On success → update each row's numeroRegla from the server response
   * 4. On error  → rollback the local move and show an error toast
   */
  onDropRegla(event: CdkDragDrop<ReglaListItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    if (!this.dragEnabled()) return;

    // 1. Optimistic local reorder
    const snapshot = [...this.reglas()];
    const reordered = [...snapshot];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.reglas.set(reordered);

    // 2. Collect IDs in the new order
    const ids = reordered.map((r) => r.id);
    this.isReordering.set(true);

    // 3. Persist on backend
    this.reglaService
      .reorderReglas(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isReordering.set(false);

          // Update each row's numeroRegla with the value the backend assigned
          const numMap = new Map(res.data.map((d) => [d.id_regla, d.numero_regla]));
          this.reglas.update((rs) =>
            rs.map((r) => ({
              ...r,
              numeroRegla: numMap.get(r.id) ?? r.numeroRegla,
            }))
          );

          Swal.fire({
            icon: 'success',
            title: 'Orden guardado',
            text: 'Las reglas fueron reordenadas correctamente.',
            timer: 1800,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          });
        },
        error: () => {
          this.isReordering.set(false);
          // 4. Rollback to pre-drag state
          this.reglas.set(snapshot);
          Swal.fire({
            icon: 'error',
            title: 'Error al reordenar',
            text: 'No se pudo guardar el nuevo orden. Los cambios fueron revertidos.',
            confirmButtonColor: '#DA3E3E',
          });
        },
      });
  }

  // ── Filtros ──────────────────────────────────────────────

  onSearch(): void {
    this.searchChange$.next(this.searchTerm());
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadReglas();
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.filterTipo.set('');
    this.filterAccion.set('');
    this.filterEstado.set('');
    this.currentPage.set(1);
    this.loadReglas();
  }

  // ── Paginación ───────────────────────────────────────────

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadReglas();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadReglas();
    }
  }

  // ── Helpers de UI ────────────────────────────────────────

  getTipoBadgeClass(tipo: string): string {
    return tipo === 'GENERAL' ? 'badge bg-primary' : 'badge bg-purple';
  }

  getAccionBadgeClass(accion: string): string {
    return accion === 'PERMITIR' ? 'badge bg-success' : 'badge bg-danger';
  }

  getEstadoBadgeClass(activa: boolean): string {
    return activa ? 'badge bg-success' : 'badge bg-secondary';
  }

  getVigenciaText(regla: ReglaListItem): string {
    if (!regla.fechaInicio && !regla.fechaFin) return 'Permanente';
    const inicio = regla.fechaInicio ?? '…';
    const fin = regla.fechaFin ?? 'sin límite';
    return `${inicio} → ${fin}`;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  trackById(_index: number, regla: ReglaListItem): number {
    return regla.id;
  }
}
