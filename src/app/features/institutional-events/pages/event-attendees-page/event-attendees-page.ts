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
import { InscribirWizardComponent } from './inscribir-wizard/inscribir-wizard';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import {
  InstitutionalEvent,
  InstitutionalEventAttendee,
  AttendeeStatus,
  EVENT_STATUS_META,
} from '../../models/institutional-event.model';

/** SCR-005 — Lista de inscritos de un evento institucional. */
@Component({
  selector: 'app-event-attendees-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ContentMenu, InscribirWizardComponent],
  templateUrl: './event-attendees-page.html',
  styleUrl: './event-attendees-page.scss',
})
export class EventAttendeesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(InstitutionalEventsService);

  readonly eventId = signal(0);
  readonly event = signal<InstitutionalEvent | null>(null);
  readonly attendees = signal<InstitutionalEventAttendee[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly filtroStatus = signal('');
  readonly filtroTipo = signal('');

  readonly eventStatusMeta = EVENT_STATUS_META;
  readonly wizardOpen = signal(false);
  readonly cancelando = signal<number | null>(null);
  readonly toastMsg = signal<string | null>(null);
  readonly toastType = signal<'success'|'warning'|'danger'>('success');

  readonly attendeesFiltrados = computed(() => {
    let lista = this.attendees();
    const term = this.searchTerm().toLowerCase().trim();
    const st = this.filtroStatus();
    const tipo = this.filtroTipo();
    if (term) lista = lista.filter(a => a.full_name.toLowerCase().includes(term) || a.email?.toLowerCase().includes(term));
    if (st) lista = lista.filter(a => a.status === st);
    if (tipo) lista = lista.filter(a => a.attendee_type === tipo);
    return lista;
  });

  readonly kpis = computed(() => {
    const all = this.attendees();
    return {
      total: all.length,
      capacidad: this.event()?.max_capacity ?? 0,
      confirmados: all.filter(a => a.status === 'confirmed').length,
      pendientes: all.filter(a => a.status === 'pending').length,
      cancelados: all.filter(a => a.status === 'cancelled').length,
    };
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
      this.error.set('No se pudo cargar la información del evento.');
    } finally {
      this.loading.set(false);
    }
  }

  volver(): void { this.router.navigate(['/eventos']); }
  irACheckin(): void { this.router.navigate(['/eventos', this.eventId(), 'checkin']); }
  irAEditar(): void { this.router.navigate(['/eventos/editar', this.eventId()]); }

  abrirWizard(): void {
    if (!this.event()?.has_registration) return;
    this.wizardOpen.set(true);
  }

  onInscripcionGuardada(): void {
    this.cargar(this.eventId());
    this.wizardOpen.set(false);
    this.showToast('Inscripciones guardadas correctamente.', 'success');
  }

  async cancelarInscripcion(a: InstitutionalEventAttendee): Promise<void> {
    if (a.status === 'cancelled') return;
    if (!confirm(`¿Cancelar inscripción de ${a.full_name}?`)) return;
    this.cancelando.set(a.id);
    try {
      await firstValueFrom(this.svc.cancelAttendee(this.eventId(), a.id));
      this.attendees.update(list => list.map(x => x.id === a.id ? { ...x, status: 'cancelled' as any } : x));
      this.showToast('Inscripción cancelada.', 'danger');
    } catch {
      this.showToast('Error al cancelar la inscripción.', 'danger');
    } finally {
      this.cancelando.set(null);
    }
  }

  private showToast(msg: string, type: 'success'|'warning'|'danger'): void {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMsg.set(null), 4000);
  }

  tipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      socio: 'Socio', invitado: 'Invitado', staff: 'Staff', externo: 'Externo',
    };
    return map[tipo] ?? tipo;
  }

  statusLabel(st: AttendeeStatus): string {
    const map: Record<string, string> = {
      confirmed: 'Confirmado', pending: 'Pendiente', cancelled: 'Cancelado', attended: 'Asistió',
    };
    return map[st] ?? st;
  }

  statusBadge(st: AttendeeStatus): string {
    const map: Record<string, string> = {
      confirmed: 'bg-success-subtle text-success-emphasis border-success-subtle',
      pending: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
      cancelled: 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
      attended: 'bg-info-subtle text-info-emphasis border-info-subtle',
    };
    return map[st] ?? 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle';
  }

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
