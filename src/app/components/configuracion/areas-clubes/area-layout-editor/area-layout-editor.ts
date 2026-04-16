import {
  Component, OnInit, OnChanges, SimpleChanges, Input,
  signal, ChangeDetectionStrategy, ChangeDetectorRef, output, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AreaClubService,
  LayoutPosition,
  AreaConClubes,
  Club
} from '../../../../services/area-club.service';
import Swal from 'sweetalert2';

/** Celda del grid en memoria */
interface GridCell {
  fila: number;
  columna: number;
  etiqueta: string;
  tipo: 'instructor' | 'lugar' | 'vacio';
}

@Component({
  selector: 'app-area-layout-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './area-layout-editor.html',
  styleUrls: ['./area-layout-editor.scss']
})
export class AreaLayoutEditorComponent implements OnInit, OnChanges {
  @Input() area!: AreaConClubes;
  /** Lista de todos los clubes disponibles (para el selector) */
  @Input() clubes: Club[] = [];
  /** Club con el que debe iniciarse el editor */
  @Input() initialClubId: number = 0;

  /** Emite cuando se cierra el editor */
  close = output<void>();
  /** Emite cuando el layout se guardó (para actualizar la lista) */
  saved = output<AreaConClubes>();

  // ── Configuración del plano ────────────────────────────────
  nombre   = signal('Plano principal');
  filas    = signal(6);
  columnas = signal(8);
  loading  = signal(true);
  saving   = signal(false);
  layoutId = signal<number | null>(null);

  /** Club actualmente seleccionado en el editor */
  selectedClubId = signal<number>(0);

  /** Clubs asignados a esta área (para el selector) */
  get areaClubs(): Club[] {
    return this.clubes.filter(c => this.area?.clubes?.some(ac => ac.acceso_club_id === c.id));
  }

  // ── Grid en memoria ────────────────────────────────────────
  grid = signal<GridCell[][]>([]);

  constructor(
    private areaClubSvc: AreaClubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._initClub();
    this.loadLayout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['area'] && !changes['area'].firstChange) {
      this._initClub();
      this.loadLayout();
    }
  }

  private _initClub(): void {
    // Usar el club indicado por el padre, o el primero asignado al área
    const preferred = this.initialClubId > 0 ? this.initialClubId : (this.area?.clubes?.[0]?.acceso_club_id ?? 0);
    if (this.selectedClubId() === 0 || !this.area?.clubes?.some(ac => ac.acceso_club_id === this.selectedClubId())) {
      this.selectedClubId.set(preferred);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Cambio de club en el selector → recargar plano
  // ─────────────────────────────────────────────────────────
  onClubChange(clubId: number): void {
    this.selectedClubId.set(+clubId);
    this.layoutId.set(null);
    this.nombre.set('Plano principal');
    this.filas.set(6);
    this.columnas.set(8);
    this.loadLayout();
  }

  // ─────────────────────────────────────────────────────────
  // Carga el layout existente o genera uno vacío
  // ─────────────────────────────────────────────────────────
  loadLayout(): void {
    if (!this.area) return;
    this.loading.set(true);
    this.areaClubSvc.getLayout(this.area.id, this.selectedClubId()).subscribe({
      next: res => {
        if (res.success && res.data.layout) {
          const l = res.data.layout;
          this.layoutId.set(l.id);
          this.nombre.set(l.nombre);
          this.filas.set(l.filas);
          this.columnas.set(l.columnas);
          this.buildGrid(res.data.positions ?? []);
        } else {
          // Sin layout: construir grid vacío con defaults
          this.layoutId.set(null);
          this.buildGrid([]);
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.buildGrid([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Construye (o reconstruye) el grid en memoria
  // ─────────────────────────────────────────────────────────
  buildGrid(savedPositions: LayoutPosition[]): void {
    const f = this.filas();
    const c = this.columnas();

    // Índice rápido: "fila-columna" → position guardada
    const posMap: Map<string, LayoutPosition> = new Map();
    savedPositions.forEach(p => posMap.set(`${p.fila_index}-${p.columna_index}`, p));

    // ¿Hay instructor guardado dentro de los límites actuales?
    // Si existe, NO colocar un segundo instructor por defecto al reconstruir.
    const instructorInBounds = savedPositions.some(
      p => p.tipo === 'instructor' && p.fila_index < f && p.columna_index < c
    );
    // Fila central para el instructor cuando no hay ninguno guardado
    const filaInstructor = Math.floor(f / 2);

    const newGrid: GridCell[][] = [];
    for (let fi = 0; fi < f; fi++) {
      const row: GridCell[] = [];
      for (let ci = 0; ci < c; ci++) {
        const key = `${fi}-${ci}`;
        if (posMap.has(key)) {
          const saved = posMap.get(key)!;
          row.push({
            fila: fi, columna: ci,
            etiqueta: saved.etiqueta,
            tipo: saved.tipo
          });
        } else {
          // Columna 0: instructor solo si no hay ninguno ya en las posiciones guardadas
          const esInstructor = ci === 0 && fi === filaInstructor && !instructorInBounds;
          row.push({
            fila: fi, columna: ci,
            etiqueta: esInstructor ? 'Instructor' : ci === 0 ? '' : this.autoLabel(fi, ci),
            tipo: esInstructor ? 'instructor' : ci === 0 ? 'vacio' : 'lugar'
          });
        }
      }
      newGrid.push(row);
    }
    this.grid.set(newGrid);
  }

  /** Genera etiqueta automática: A1, A2, B1, B2... (ignora col 0) */
  autoLabel(fila: number, columna: number): string {
    const letra = String.fromCharCode(65 + fila); // A, B, C...
    return `${letra}${columna}`;                  // A1, A2, B3...
  }

  // ─────────────────────────────────────────────────────────
  // Click en celda
  //   Col 0: no interactuable (posición fija del instructor)
  //   Col 1+: lugar ↔ vacio
  // ─────────────────────────────────────────────────────────
  onCellClick(cell: GridCell): void {
    if (this.saving()) return;
    if (cell.columna === 0) return; // col 0 fija, sin interacción

    // Col 1+: ciclar lugar ↔ vacio
    if (cell.tipo === 'lugar') {
      cell.tipo     = 'vacio';
      cell.etiqueta = '';
    } else {
      cell.tipo     = 'lugar';
      cell.etiqueta = this.autoLabel(cell.fila, cell.columna);
    }
    this.grid.set([...this.grid()]);
  }

  // ─────────────────────────────────────────────────────────
  // Al cambiar filas/columnas: reconstruir el grid
  // ─────────────────────────────────────────────────────────
  onDimensionChange(): void {
    const f = Math.max(1, Math.min(50, this.filas()));
    const c = Math.max(2, Math.min(30, this.columnas()));
    this.filas.set(f);
    this.columnas.set(c);

    // Conservar posiciones de tipo lugar e instructor (vacíos no se guardan)
    const current: LayoutPosition[] = [];
    this.grid().forEach(row => row.forEach(cell => {
      if (cell.tipo === 'lugar' || cell.tipo === 'instructor') {
        current.push({
          fila_index: cell.fila, columna_index: cell.columna,
          etiqueta: cell.etiqueta, tipo: cell.tipo, is_active: true
        });
      }
    }));
    this.buildGrid(current);
  }

  // ─────────────────────────────────────────────────────────
  // Guardar el plano
  // ─────────────────────────────────────────────────────────
  saveLayout(): void {
    if (this.saving()) return;
    this.saving.set(true);

    const positions: LayoutPosition[] = [];
    this.grid().forEach(row => row.forEach(cell => {
      positions.push({
        fila_index: cell.fila,
        columna_index: cell.columna,
        etiqueta: cell.etiqueta,
        tipo: cell.tipo,
        is_active: cell.tipo !== 'vacio'
      });
    }));

    this.areaClubSvc.saveLayout({
      area_id:        this.area.id,
      acceso_club_id: this.selectedClubId(),
      nombre:         this.nombre(),
      filas:          this.filas(),
      columnas:       this.columnas(),
      positions
    }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.layoutId.set(res.data.layout_id);
          Swal.fire({
            icon: 'success',
            title: 'Plano guardado',
            text: `${res.data.lugares_activos} lugares en el plano`,
            timer: 2000,
            showConfirmButton: false
          });
          const updated: AreaConClubes = {
            ...this.area,
            layouts_por_club: [
              ...(this.area.layouts_por_club ?? []).filter(l => l.acceso_club_id !== this.selectedClubId()),
              {
                acceso_club_id: this.selectedClubId(),
                has_layout: true,
                layout_id: res.data.layout_id,
                filas: this.filas(),
                columnas: this.columnas(),
              }
            ]
          };
          this.saved.emit(updated);
        } else {
          Swal.fire('Error', res.message, 'error');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving.set(false);
        Swal.fire('Error', 'No se pudo guardar el plano', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Eliminar el plano
  // ─────────────────────────────────────────────────────────
  deleteLayout(): void {
    if (!this.layoutId()) return;
    Swal.fire({
      title: '¿Eliminar plano?',
      text: 'Se borrarán todas las posiciones configuradas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.areaClubSvc.deleteLayout(this.layoutId()!).subscribe({
        next: () => {
          this.layoutId.set(null);
          this.buildGrid([]);
          Swal.fire({ icon: 'success', title: 'Plano eliminado', timer: 1500, showConfirmButton: false });
          this.cdr.markForCheck();
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el plano', 'error')
      });
    });
  }

  // ─────────────────────────────────────────────────────────
  // Helpers visuales
  // ─────────────────────────────────────────────────────────
  cellClass(cell: GridCell): string {
    if (cell.tipo === 'instructor') return 'cell-instructor';
    if (cell.columna === 0)         return 'cell-col0';
    if (cell.tipo === 'lugar')      return 'cell-lugar';
    return 'cell-vacio';
  }

  get lugaresActivos(): number {
    return this.grid().flat().filter(c => c.tipo === 'lugar').length;
  }

  get rowRange(): number[] {
    return Array.from({ length: this.filas() }, (_, i) => i);
  }

  get colRange(): number[] {
    return Array.from({ length: this.columnas() }, (_, i) => i);
  }

  onClose(): void {
    this.close.emit();
  }
}
