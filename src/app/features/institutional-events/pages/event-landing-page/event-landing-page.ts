import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  PLATFORM_ID,
  signal,
  computed,
  inject,
  HostListener
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import { InstitutionalEvent, EVENT_TYPE_META, EventColorTheme, ACCESS_TYPE_META, InstitutionalEventSubevent } from '../../models/institutional-event.model';

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
  private readonly platformId = inject(PLATFORM_ID);

  /** true cuando la página está cargada dentro de un iframe (modo preview del formulario) */
  readonly estaEnIframe: boolean = isPlatformBrowser(this.platformId)
    ? window.self !== window.top
    : false;

  // ── Estado ───────────────────────────────────────────────────────────────────
  readonly event = signal<InstitutionalEvent | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);  readonly colorThemes = signal<EventColorTheme[]>([]);  readonly modalAbierto = signal(false);
  readonly esSocio = signal<boolean | null>(null);    // null=sin elegir
  readonly modalPaso = signal<'inicio' | 'socio' | 'modo' | 'invitado' | 'externo' | 'subeventos' | 'exito'>('inicio');
  readonly selectedSubevents = signal<Set<number>>(new Set());

  // ── Estado de inscripción ─────────────────────────────────────────────────────
  readonly socioNumero = signal('');
  readonly socioEncontrado = signal<any | null>(null);
  readonly modoInscripcion = signal<'titular' | 'invitado' | null>(null);
  readonly nombreExterno = signal('');
  readonly correoExterno = signal('');
  readonly ladaExterno = signal('+52');
  readonly telefonoExterno = signal('');

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '');
    this.telefonoExterno.set(digitsOnly);
    input.value = digitsOnly;
  }

  readonly allowMembers = computed(() => {
    const types = this.event()?.access_types || [];
    if (types.includes('public')) return true;
    return types.some(t => ['members', 'patron', 'committee'].includes(t));
  });

  readonly allowPublic = computed(() => {
    const types = this.event()?.access_types || [];
    return types.includes('public') || types.includes('registration');
  });

  readonly accessTypeMeta = ACCESS_TYPE_META;

  canAccessSubevent(sub: InstitutionalEventSubevent): boolean {
    if (this.esSocio()) {
      return true; // Asumimos que el socio tiene acceso a 'members', 'patron', 'public', etc.
    }
    // El externo solo puede si incluye 'public' o 'registration'
    return sub.access_types.some(t => t === 'public' || t === 'registration');
  }

  readonly canRegisterOnline = computed(() => {
    return this.allowMembers() || this.allowPublic();
  });

  readonly accessLabel = computed(() => {
    const ev = this.event();
    if (!ev || !ev.access_types || !ev.access_types.length) return 'Público General';
    const dicc: Record<string, string> = {
      'public': 'Público General',
      'members': 'Exclusivo Socios',
      'patron': 'Comité Patronato',
      'committee': 'Comité Directivo',
      'registration': 'Con Registro'
    };
    return ev.access_types.map(k => dicc[k] || k).join(' y ');
  });

  readonly normalizedAllies = computed(() => {
    const raw = this.event()?.extra_data?.allies;
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((a: any) => typeof a === 'string' ? { name: a, logo_url: null, url: null } : a);
  });

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly isAuthenticated = computed(() => {
    const sub = this.auth.isAuthenticated$;
    let val = false;
    sub.subscribe(v => val = v).unsubscribe();
    return val;
  });

  readonly themeVars = computed(() => {
    const ev = this.event();
    const themes = this.colorThemes();
    if (!ev || !themes.length) return {};
    const colorTheme = ev.color_theme ?? ev.extra_data?.color_theme ?? 'classic';
    const t = themes.find(th => th.id === colorTheme);
    if (!t) return {};
    return {
      '--ev-primary': t.color_primary,
      '--ev-accent':  t.color_accent,
      '--ev-bg':      t.color_bg,
      '--ev-text':    t.color_text,
    };
  });

  readonly eventTypeMeta = EVENT_TYPE_META;

  readonly showNavButton = signal(false);
  readonly alertMessage = signal<{title: string, text: string} | null>(null);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    const heroBtn = document.getElementById('hero-main-btn');
    if (heroBtn) {
      const rect = heroBtn.getBoundingClientRect();
      // Si el botón principal salió de la pantalla hacia arriba (bottom < 0), mostramos el del nav
      this.showNavButton.set(rect.bottom < 0);
    }
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.error.set('ID de evento inválido.');
      this.loading.set(false);
      return;
    }
    this.cargarEvento(id);
    this.cargarTemas();
  }

  async cargarTemas(): Promise<void> {
    try {
      const lista = await firstValueFrom(this.svc.getColorThemes());
      this.colorThemes.set(lista);
    } catch { /* no crítico */ }
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

  formatPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.substring(0,2)}-${cleaned.substring(2,6)}-${cleaned.substring(6)}`;
    }
    if (cleaned.length === 12) {
      return `+${cleaned.substring(0,2)} ${cleaned.substring(2,4)}-${cleaned.substring(4,8)}-${cleaned.substring(8)}`;
    }
    return phone;
  }

  // ── Modal de inscripción ─────────────────────────────────────────────────────
  abrirModal(): void {
    this.modalAbierto.set(true);
    this.modalPaso.set('inicio');
    this.esSocio.set(null);
    this.socioNumero.set('');
    this.socioEncontrado.set(null);
    this.selectedSubevents.set(new Set());
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
    if (modo === 'invitado') {
      this.modalPaso.set('invitado');
    } else {
      this.verificarSubvencion();
    }
  }

  async continuarDesdeExterno(): Promise<void> {
    if (!this.nombreExterno() || !this.correoExterno() || !this.telefonoExterno()) {
      this.alertMessage.set({ title: 'Campos incompletos', text: 'Por favor completa todos los campos requeridos.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.correoExterno())) {
      this.alertMessage.set({ title: 'Correo inválido', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }

    const phoneDigits = this.telefonoExterno().replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      this.alertMessage.set({ title: 'Teléfono inválido', text: 'El teléfono celular debe contener exactamente 10 dígitos.' });
      return;
    }

    this.verificarSubvencion();
  }

  verificarSubvencion(): void {
    const ev = this.event();
    if (ev?.institutional_event_subevents?.length) {
      this.modalPaso.set('subeventos');
    } else {
      this.registrar();
    }
  }

  toggleSubevent(id: number) {
    const sub = this.event()?.institutional_event_subevents?.find(s => s.id === id);
    if (!sub || !this.canAccessSubevent(sub)) return; // No tiene acceso

    const s = new Set(this.selectedSubevents());
    if (s.has(id)) {
      s.delete(id);
    } else {
      s.add(id);
    }
    this.selectedSubevents.set(s);
  }

  async registrar(): Promise<void> {
    const ev = this.event();
    if (!ev) return;

    try {
      this.loading.set(true);
      const isSocio = this.esSocio();
      
      const subeventIds = Array.from(this.selectedSubevents());
      
      let attendee: any = {
        subevent_ids: subeventIds,
        access_type_selected: isSocio ? 'members' : 'public'
      };

      if (isSocio) {
        attendee.attendee_type = 'socio';
        attendee.socio_number = this.socioNumero();
      } else {
        attendee.attendee_type = 'externo';
        attendee.full_name = this.nombreExterno();
        attendee.email = this.correoExterno();
        
        const digits = this.telefonoExterno().replace(/\D/g, '');
        attendee.phone = this.ladaExterno() + digits;
      }

      const payload = {
        attendees: [attendee],
        create_ns_order: true,
        send_tickets: true
      };

      const res = await firstValueFrom(this.svc.registerPublic(ev.id, payload));
      if ((res.data as any)?.details?.[0]?.status === 'skipped') {
        this.alertMessage.set({ title: 'Registro existente', text: 'Ya estabas inscrito en este evento.' });
        this.cerrarModal();
        return;
      }
      this.modalPaso.set('exito');
    } catch (e: any) {
      console.error(e);
      this.alertMessage.set({ title: 'Error de inscripción', text: e.error?.message || 'Hubo un error al procesar tu inscripción. Por favor, verifica tus datos e intenta de nuevo.' });
    } finally {
      this.loading.set(false);
    }
  }

  // ── Navegación ────────────────────────────────────────────────────────────────
  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  volverALista(): void {
    this.router.navigate(['/eventos']);
  }

  editarEvento(): void {
    const ev = this.event();
    if (ev) this.router.navigate(['/eventos/editar', ev.id]);
  }
}
