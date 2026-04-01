import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../content-menu/content-menu';
import { MembresiaService } from '../../services/membresia.service';
import {
  BuscarEstado,
  MembresiaResumen,
  MensajeMembresia,
  SocioMembresia,
} from '../../models/membresia.model';

@Component({
  selector: 'app-membresias-buscar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './membresias-buscar.html',
  styleUrls: ['./membresias-buscar.scss'],
})
export class MembresiasBuscarComponent {
  // ── Servicios ───────────────────────────────────────────────────────────────
  private readonly svc = inject(MembresiaService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Estado de la UI ─────────────────────────────────────────────────────────
  estado: BuscarEstado = 'initial';
  query = '';

  // ── Datos actuales ──────────────────────────────────────────────────────────
  membresia: MembresiaResumen | null = null;
  mensaje: MensajeMembresia | null = null;
  socios: SocioMembresia[] = [];

  // ── Tabla: ordenamiento y filas expandidas ──────────────────────────────────
  sortCol: keyof SocioMembresia | null = null;
  sortAsc = true;
  expandedRows: Record<string, boolean> = {};

  // ── Toast ───────────────────────────────────────────────────────────────────
  toastMsg = '';
  toastColor = '#16a34a';
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Sync ────────────────────────────────────────────────────────────────────
  sincronizando = false;

  // ─────────────────────────────────────────────────────────────────────────────
  // Búsqueda
  // ─────────────────────────────────────────────────────────────────────────────

  onQueryChange(): void {
    if (!this.query.trim()) {
      this.estado = 'initial';
      this.cdr.markForCheck();
    }
  }

  buscar(): void {
    const q = this.query.trim();
    if (!q) {
      this.showToast('Escribe un número o nombre de titular', '#d97706');
      return;
    }

    this.estado = 'loading';
    this.expandedRows = {};
    this.sortCol = null;
    this.sortAsc = true;
    this.cdr.markForCheck();

    this.svc.buscar(q).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.estado = 'empty';
        } else {
          this.membresia = res.data.membresia;
          this.mensaje   = res.data.mensaje;
          this.socios    = res.data.socios;
          this.estado    = 'results';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.estado = 'empty';
        this.showToast('Error al buscar la membresía', '#dc2626');
        this.cdr.markForCheck();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Tabla: expandir / colapsar fila de detalle
  // ─────────────────────────────────────────────────────────────────────────────

  toggleDetalle(num: string): void {
    this.expandedRows[num] = !this.expandedRows[num];
    this.cdr.markForCheck();
  }

  isExpanded(num: string): boolean {
    return !!this.expandedRows[num];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Tabla: ordenamiento de columnas
  // ─────────────────────────────────────────────────────────────────────────────

  sortBy(col: keyof SocioMembresia): void {
    if (this.sortCol === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortCol = col;
      this.sortAsc = true;
    }

    this.socios = [...this.socios].sort((a, b) => {
      const va = (a[col] ?? '') as string;
      const vb = (b[col] ?? '') as string;
      const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true });
      return this.sortAsc ? cmp : -cmp;
    });
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sincronizar
  // ─────────────────────────────────────────────────────────────────────────────

  sincronizar(): void {
    if (this.sincronizando) return;
    this.sincronizando = true;
    this.cdr.markForCheck();

    this.svc.sincronizar().subscribe({
      next: (res) => {
        this.sincronizando = false;
        this.showToast(
          res.success
            ? `✅ Sincronización completa — ${res.data?.synced ?? 0} membresías`
            : '⚠️ Error al sincronizar',
          res.success ? '#16a34a' : '#dc2626'
        );
        // Repetir la búsqueda si hay una activa
        if (this.query.trim() && this.estado === 'results') {
          this.buscar();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.sincronizando = false;
        this.showToast('Error de conexión al sincronizar', '#dc2626');
        this.cdr.markForCheck();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers de UI
  // ─────────────────────────────────────────────────────────────────────────────

  /** Clase CSS del badge de estado de la membresía */
  badgeEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO:     'activo',
      Activo:     'activo',
      CANCELADO:  'baja',
      Cancelado:  'baja',
      SUSPENDIDO: 'suspendido',
      Suspendido: 'suspendido',
      AUSENTE:    'suspendido',
      Ausente:    'suspendido',
    };
    return map[estado] ?? '';
  }

  /** Clase CSS del badge de condición administrativa del socio */
  badgeCondClass(cond: string): string {
    const map: Record<string, string> = {
      Activo:     'activo',
      ACTIVO:     'activo',
      Baja:       'baja',
      BAJA:       'baja',
      Suspendido: 'suspendido',
      SUSPENDIDO: 'suspendido',
      Fallecido:  'baja',
      FALLECIDO:  'baja',
    };
    return map[cond] ?? '';
  }

  get hasMensajes(): boolean {
    return !!(
      this.mensaje?.cumplimiento ||
      this.mensaje?.acuerdo ||
      this.mensaje?.desacuerdo
    );
  }

  showToast(msg: string, color = '#16a34a'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg     = msg;
    this.toastColor   = color;
    this.toastVisible = true;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.markForCheck();
    }, 3500);
  }
}
