import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ContentMenu } from '../../../../components/content-menu/content-menu';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import {
  InstitutionalEvent,
  EventType,
  EventStatus,
  EVENT_TYPE_META,
  EVENT_STATUS_META,
  Pagination,
} from '../../models/institutional-event.model';

/** Página de listado de eventos institucionales (SCR-001). */
@Component({
  selector: 'app-events-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ContentMenu],
  templateUrl: './events-list-page.html',
  styleUrl: './events-list-page.scss',
})
export class EventsListPageComponent implements OnInit {

  // ── Signals ──────────────────────────────────────────────────────────────────
  readonly events = signal<InstitutionalEvent[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Filtros
  readonly searchTerm = signal('');
  readonly filtroStatus = signal<EventStatus | null>(null);
  readonly filtroTipo = signal<EventType | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly eventosFiltrados = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    let lista = this.events();
    if (term) {
      lista = lista.filter(e => e.name.toLowerCase().includes(term));
    }
    return lista;
  });

  readonly kpis = computed(() => {
    const lista = this.events();
    return {
      total: this.pagination()?.total ?? lista.length,
      publicados: lista.filter(e => e.status === 'published' || e.status === 'ongoing').length,
      borradores: lista.filter(e => e.status === 'draft').length,
      cerrados: lista.filter(e => e.status === 'closed' || e.status === 'cancelled').length,
    };
  });

  readonly eventTypeMeta = EVENT_TYPE_META;
  readonly eventStatusMeta = EVENT_STATUS_META;
  readonly eventTypes: EventType[] = ['academic', 'sports', 'cultural', 'social', 'other'];
  readonly eventStatuses: EventStatus[] = ['draft', 'published', 'ongoing', 'closed', 'cancelled'];

  constructor(private svc: InstitutionalEventsService, private router: Router) {}

  ngOnInit(): void {
    this.loadEventos();
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────

  async loadEventos(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.svc.getAll({
        status: this.filtroStatus() ?? undefined,
        event_type: this.filtroTipo() ?? undefined,
        limit: 50,
      }));
      this.events.set(res.data.events);
      this.pagination.set(res.data.pagination);
    } catch {
      this.error.set('Error al cargar los eventos.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  setFiltroStatus(value: string): void {
    this.filtroStatus.set((value || null) as EventStatus | null);
    this.loadEventos();
  }

  setFiltroTipo(value: string): void {
    this.filtroTipo.set((value || null) as EventType | null);
    this.loadEventos();
  }

  // ── Navegación / acciones ────────────────────────────────────────────────────

  irACrear(): void {
    this.router.navigate(['/eventos/crear']);
  }

  irAEditar(event: InstitutionalEvent): void {
    this.router.navigate(['/eventos/editar', event.id]);
  }

  irALanding(event: InstitutionalEvent): void {
    this.router.navigate(['/eventos/landing', event.id]);
  }

  irAInscritos(event: InstitutionalEvent): void {
    this.router.navigate(['/eventos', event.id, 'inscritos']);
  }

  irACheckin(event: InstitutionalEvent): void {
    this.router.navigate(['/eventos', event.id, 'checkin']);
  }

  irAResumen(event: InstitutionalEvent): void {
    this.router.navigate(['/eventos', event.id, 'resumen']);
  }

  async publicar(event: InstitutionalEvent): Promise<void> {
    if (!confirm(`¿Publicar el evento "${event.name}"?`)) return;
    try {
      await firstValueFrom(this.svc.publish(event.id));
      await this.loadEventos();
    } catch {
      this.error.set('No se pudo publicar el evento.');
    }
  }

  async eliminar(event: InstitutionalEvent): Promise<void> {
    if (!confirm(`¿Eliminar el evento "${event.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await firstValueFrom(this.svc.delete(event.id));
      await this.loadEventos();
    } catch {
      this.error.set('No se pudo eliminar el evento.');
    }
  }

  formatFecha(event: InstitutionalEvent): string {
    const start = new Date(event.start_date);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    if (!event.end_date) {
      return start.toLocaleDateString('es-MX', opts);
    }
    const end = new Date(event.end_date);
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('es-MX', opts);
    }
    return `${start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-MX', opts)}`;
  }
}
