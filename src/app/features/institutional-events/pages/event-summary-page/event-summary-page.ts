import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ContentMenu } from '../../../../components/content-menu/content-menu';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import {
  InstitutionalEvent,
  InstitutionalEventAttendee,
  EVENT_STATUS_META,
  EVENT_TYPE_META,
} from '../../models/institutional-event.model';

/** SCR-007 — Resumen ejecutivo de un evento institucional. */
@Component({
  selector: 'app-event-summary-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ContentMenu],
  templateUrl: './event-summary-page.html',
  styleUrl: './event-summary-page.scss',
})
export class EventSummaryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(InstitutionalEventsService);

  readonly eventId = signal(0);
  readonly event = signal<InstitutionalEvent | null>(null);
  readonly attendees = signal<InstitutionalEventAttendee[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly eventStatusMeta = EVENT_STATUS_META;
  readonly eventTypeMeta = EVENT_TYPE_META;

  readonly kpis = computed(() => {
    const all = this.attendees();
    const ev = this.event();
    return {
      inscritos: all.length,
      capacidad: ev?.max_capacity ?? 0,
      confirmados: all.filter(a => a.status === 'confirmed').length,
      pendientes: all.filter(a => a.status === 'pending').length,
      cancelados: all.filter(a => a.status === 'cancelled').length,
      porTipo: {
        socio: all.filter(a => a.attendee_type === 'socio').length,
        invitado: all.filter(a => a.attendee_type === 'invitado').length,
        staff: all.filter(a => a.attendee_type === 'staff').length,
        externo: all.filter(a => a.attendee_type === 'externo').length,
      },
      subevents: ev?.institutional_event_subevents?.length ?? 0,
    };
  });

  readonly pctOcupacion = computed(() => {
    const { inscritos, capacidad } = this.kpis();
    return capacidad > 0 ? Math.min(100, Math.round((inscritos / capacidad) * 100)) : 0;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.eventId.set(id);
    this.cargar(id);
  }

  async cargar(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [evRes, attRes] = await Promise.all([
        firstValueFrom(this.svc.getById(id)),
        firstValueFrom(this.svc.getAttendees(id)),
      ]);
      this.event.set(evRes.data.event);
      this.attendees.set(attRes.data.attendees ?? []);
    } catch {
      this.error.set('No se pudo cargar el resumen del evento.');
    } finally {
      this.loading.set(false);
    }
  }

  volver(): void { this.router.navigate(['/eventos']); }
  irAInscritos(): void { this.router.navigate(['/eventos', this.eventId(), 'inscritos']); }
  irACheckin(): void { this.router.navigate(['/eventos', this.eventId(), 'checkin']); }
  irAEditar(): void { this.router.navigate(['/eventos/editar', this.eventId()]); }

  formatFecha(ev: InstitutionalEvent): string {
    const start = new Date(ev.start_date);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    if (!ev.end_date) return start.toLocaleDateString('es-MX', opts);
    const end = new Date(ev.end_date);
    const sDay = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const eDay = end.toLocaleDateString('es-MX', opts);
    return `${sDay} – ${eDay}`;
  }
}
