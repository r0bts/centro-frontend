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
import { AuthService } from '../../../../services/auth.service';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import { InstitutionalEvent, EVENT_TYPE_META } from '../../models/institutional-event.model';

/**
 * SCR-003 — Landing Page pública de un evento institucional.
 * Ruta: /eventos/landing/:id
 * NO requiere authGuard — accesible sin login para público general y socios.
 */
@Component({
  selector: 'app-event-landing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './event-landing-page.html',
  styleUrl: './event-landing-page.scss',
})
export class EventLandingPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(InstitutionalEventsService);
  private readonly auth = inject(AuthService);

  // ── Estado ───────────────────────────────────────────────────────────────────
  readonly event = signal<InstitutionalEvent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly esSocio = signal<boolean | null>(null);    // null=sin elegir
  readonly modalPaso = signal<'inicio' | 'socio' | 'modo' | 'invitado' | 'externo' | 'exito'>('inicio');

  // ── Estado de inscripción ─────────────────────────────────────────────────────
  readonly socioNumero = signal('');
  readonly socioEncontrado = signal<any | null>(null);
  readonly modoInscripcion = signal<'titular' | 'invitado' | null>(null);
  readonly nombreExterno = signal('');
  readonly correoExterno = signal('');

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly isAuthenticated = computed(() => {
    const sub = this.auth.isAuthenticated$;
    let val = false;
    sub.subscribe(v => val = v).unsubscribe();
    return val;
  });

  readonly eventTypeMeta = EVENT_TYPE_META;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.error.set('ID de evento inválido.');
      this.loading.set(false);
      return;
    }
    this.cargarEvento(id);
  }

  async cargarEvento(id: number): Promise<void> {
    try {
      const res = await firstValueFrom(this.svc.getPublic(id));
      this.event.set(res.data.event);
    } catch {
      this.error.set('Evento no encontrado o no disponible.');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Formato de fechas ────────────────────────────────────────────────────────
  formatFechaLarga(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatHora(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Modal de inscripción ─────────────────────────────────────────────────────
  abrirModal(): void {
    this.modalAbierto.set(true);
    this.modalPaso.set('inicio');
    this.esSocio.set(null);
    this.socioNumero.set('');
    this.socioEncontrado.set(null);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  elegirEsSocio(es: boolean): void {
    this.esSocio.set(es);
    this.modalPaso.set(es ? 'socio' : 'externo');
  }

  elegirModo(modo: 'titular' | 'invitado'): void {
    this.modoInscripcion.set(modo);
    this.modalPaso.set(modo === 'invitado' ? 'invitado' : 'exito');
  }

  // ── Navegación ────────────────────────────────────────────────────────────────
  volverALista(): void {
    this.router.navigate(['/eventos']);
  }

  editarEvento(): void {
    const ev = this.event();
    if (ev) this.router.navigate(['/eventos/editar', ev.id]);
  }
}
