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
} from '../../models/institutional-event.model';

type AsistenciaEstado = 'pending' | 'present' | 'absent';

interface AttendeeCheckin extends InstitutionalEventAttendee {
  asistencia: AsistenciaEstado;
}

/** SCR-006 — Check-in / Marcado de Asistencia. */
@Component({
  selector: 'app-event-checkin-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ContentMenu],
  templateUrl: './event-checkin-page.html',
  styleUrl: './event-checkin-page.scss',
})
export class EventCheckinPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(InstitutionalEventsService);

  readonly eventId = signal(0);
  readonly event = signal<InstitutionalEvent | null>(null);
  readonly lista = signal<AttendeeCheckin[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly filtroEstado = signal<AsistenciaEstado | ''>('');

  readonly eventStatusMeta = EVENT_STATUS_META;

  readonly listaFiltrada = computed(() => {
    let base = this.lista();
    const term = this.searchTerm().toLowerCase().trim();
    const est = this.filtroEstado();
    if (term) base = base.filter(a => a.full_name.toLowerCase().includes(term) || a.email?.toLowerCase().includes(term));
    if (est) base = base.filter(a => a.asistencia === est);
    return base;
  });

  readonly kpis = computed(() => {
    const all = this.lista();
    return {
      total: all.length,
      presentes: all.filter(a => a.asistencia === 'present').length,
      ausentes: all.filter(a => a.asistencia === 'absent').length,
      pendientes: all.filter(a => a.asistencia === 'pending').length,
    };
  });

  readonly pctAsistencia = computed(() => {
    const { total, presentes } = this.kpis();
    return total > 0 ? Math.round((presentes / total) * 100) : 0;
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
      const conEstado: AttendeeCheckin[] = (attRes.data.attendees ?? []).map(a => ({
        ...a,
        asistencia: (a.status === 'confirmed' || a.status === 'pending') ? 'pending' : 'absent',
      }));
      this.lista.set(conEstado);
    } catch {
      this.error.set('No se pudo cargar la lista de asistentes.');
    } finally {
      this.loading.set(false);
    }
  }

  marcar(attendeeId: number, estado: AsistenciaEstado): void {
    this.lista.update(lista =>
      lista.map(a => a.id === attendeeId ? { ...a, asistencia: estado } : a)
    );
  }

  toggleAsistencia(a: AttendeeCheckin): void {
    const next: AsistenciaEstado = a.asistencia === 'present' ? 'absent' : 'present';
    this.marcar(a.id, next);
  }

  marcarTodosPresentes(): void {
    this.lista.update(lista => lista.map(a => ({ ...a, asistencia: 'present' as AsistenciaEstado })));
  }

  volver(): void { this.router.navigate(['/eventos', this.eventId(), 'inscritos']); }
  irAResumen(): void { this.router.navigate(['/eventos', this.eventId(), 'resumen']); }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  avatarBg(tipo: string): string {
    const map: Record<string, string> = {
      socio: '#406eba', invitado: '#16a34a', staff: '#7c3aed', externo: '#ca8a04',
    };
    return map[tipo] ?? '#6c757d';
  }
}
