import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

export interface Regla {
  id: number;
  numeroRegla: number;
  nombre: string;
  tipo: 'GENERAL' | 'PARTICULAR';
  accion: 'PERMITIR' | 'BLOQUEAR';
  activa: boolean;
  condicionesCount: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-membresias-reglas-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './membresias-reglas-lista.html',
  styleUrls: ['./membresias-reglas-lista.scss']
})
export class MembresiasReglasListaComponent implements OnInit {
  activeSection: string = 'membresias-reglas';

  // Signals de datos
  reglas = signal<Regla[]>([]);
  isLoading = signal(true);

  // Signals de filtros
  searchTerm = signal('');
  filterTipo = signal('');
  filterAccion = signal('');
  filterEstado = signal('');

  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(10);
  totalItems = signal(0);

  // Computed: reglas filtradas
  filteredReglas = computed(() => {
    let result = this.reglas();

    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(r =>
        r.nombre.toLowerCase().includes(search) ||
        String(r.numeroRegla).includes(search)
      );
    }

    if (this.filterTipo()) {
      result = result.filter(r => r.tipo === this.filterTipo());
    }

    if (this.filterAccion()) {
      result = result.filter(r => r.accion === this.filterAccion());
    }

    if (this.filterEstado() !== '') {
      const activa = this.filterEstado() === '1';
      result = result.filter(r => r.activa === activa);
    }

    return result;
  });

  // Computed: página actual de reglas
  pagedReglas = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredReglas().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredReglas().length / this.itemsPerPage()))
  );

  // Helper Math para template
  Math = Math;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadReglas();
  }

  loadReglas(): void {
    this.isLoading.set(true);

    // Datos mock — listos para reemplazar con servicio HTTP
    setTimeout(() => {
      const mockData: Regla[] = [
        {
          id: 1,
          numeroRegla: 10,
          nombre: 'Niños y adultos mayores — libre acceso',
          tipo: 'GENERAL',
          accion: 'PERMITIR',
          activa: true,
          condicionesCount: 2,
          fechaInicio: null,
          fechaFin: null,
          createdAt: '2026-03-01T10:00:00'
        },
        {
          id: 2,
          numeroRegla: 20,
          nombre: 'Bloqueo por mora mayor a 3 meses',
          tipo: 'GENERAL',
          accion: 'BLOQUEAR',
          activa: true,
          condicionesCount: 1,
          fechaInicio: null,
          fechaFin: null,
          createdAt: '2026-03-02T09:00:00'
        },
        {
          id: 3,
          numeroRegla: 30,
          nombre: 'Acuerdo de pago — acceso temporal',
          tipo: 'PARTICULAR',
          accion: 'PERMITIR',
          activa: true,
          condicionesCount: 3,
          fechaInicio: '2026-03-01',
          fechaFin: '2026-06-01',
          createdAt: '2026-03-03T08:00:00'
        },
        {
          id: 4,
          numeroRegla: 40,
          nombre: 'Suspensión por falta disciplinaria',
          tipo: 'PARTICULAR',
          accion: 'BLOQUEAR',
          activa: false,
          condicionesCount: 1,
          fechaInicio: null,
          fechaFin: null,
          createdAt: '2026-03-04T11:00:00'
        },
        {
          id: 5,
          numeroRegla: 50,
          nombre: 'Evento especial — acceso general',
          tipo: 'GENERAL',
          accion: 'PERMITIR',
          activa: true,
          condicionesCount: 2,
          fechaInicio: '2026-03-09',
          fechaFin: '2026-03-09',
          createdAt: '2026-03-05T07:00:00'
        }
      ];

      this.reglas.set(mockData);
      this.totalItems.set(mockData.length);
      this.isLoading.set(false);
    }, 400);
  }

  // ── Navegación ──────────────────────────────────────────

  onNuevaRegla(): void {
    this.router.navigate(['/membresias/reglas/crear']);
  }

  onEditarRegla(regla: Regla): void {
    this.router.navigate(['/membresias/reglas/editar', regla.id]);
  }

  onVerRegla(regla: Regla): void {
    this.router.navigate(['/membresias/reglas', regla.id]);
  }

  // ── Acciones ────────────────────────────────────────────

  onEliminarRegla(regla: Regla): void {
    Swal.fire({
      title: '¿Eliminar regla?',
      html: `¿Estás seguro de eliminar la regla <strong>#${regla.numeroRegla} — ${regla.nombre}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#DA3E3E',
      cancelButtonColor: '#8A8A8A'
    }).then(result => {
      if (result.isConfirmed) {
        // Aquí irá la llamada al servicio HTTP
        this.reglas.update(rs => rs.filter(r => r.id !== regla.id));
        this.totalItems.set(this.reglas().length);
        Swal.fire({
          icon: 'success',
          title: 'Regla eliminada',
          text: `La regla #${regla.numeroRegla} fue eliminada correctamente`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  onToggleEstado(regla: Regla): void {
    const nuevoEstado = !regla.activa;
    const label = nuevoEstado ? 'activar' : 'desactivar';

    Swal.fire({
      title: `¿${nuevoEstado ? 'Activar' : 'Desactivar'} regla?`,
      html: `La regla <strong>#${regla.numeroRegla}</strong> quedará <strong>${nuevoEstado ? 'activa' : 'inactiva'}</strong> inmediatamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${label}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado ? '#43B581' : '#F4D35E'
    }).then(result => {
      if (result.isConfirmed) {
        // Aquí irá la llamada al servicio HTTP
        this.reglas.update(rs =>
          rs.map(r => r.id === regla.id ? { ...r, activa: nuevoEstado } : r)
        );
        Swal.fire({
          icon: 'success',
          title: nuevoEstado ? 'Regla activada' : 'Regla desactivada',
          timer: 1800,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  // ── Filtros ─────────────────────────────────────────────

  onSearch(): void {
    this.currentPage.set(1);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.filterTipo.set('');
    this.filterAccion.set('');
    this.filterEstado.set('');
    this.currentPage.set(1);
  }

  hasActiveFilters = computed(() =>
    !!this.searchTerm() || !!this.filterTipo() || !!this.filterAccion() || this.filterEstado() !== ''
  );

  // ── Paginación ───────────────────────────────────────────

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  // ── Helpers de UI ────────────────────────────────────────

  getTipoBadgeClass(tipo: string): string {
    return tipo === 'GENERAL'
      ? 'badge bg-primary'
      : 'badge bg-purple';
  }

  getAccionBadgeClass(accion: string): string {
    return accion === 'PERMITIR'
      ? 'badge bg-success'
      : 'badge bg-danger';
  }

  getEstadoBadgeClass(activa: boolean): string {
    return activa
      ? 'badge bg-success'
      : 'badge bg-secondary';
  }

  getVigenciaText(regla: Regla): string {
    if (!regla.fechaInicio && !regla.fechaFin) return 'Permanente';
    const inicio = regla.fechaInicio ?? '…';
    const fin = regla.fechaFin ?? 'sin límite';
    return `${inicio} → ${fin}`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  trackById(index: number, regla: Regla): number {
    return regla.id;
  }
}
