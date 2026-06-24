import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  Torneo,
  Jornada,
  Inscripcion,
  Partido,
  FORMATO_META,
} from '../../../../models/deportivo/torneo.model';
import { TorneoService } from '../../../../services/deportivo/torneo.service';

@Component({
  selector: 'app-torneo-marcadores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './torneo-marcadores.html',
  styleUrl: './torneo-marcadores.scss',
})
export class TorneoMarcadoresComponent implements OnInit {

  private readonly svc = inject(TorneoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly torneo = signal<Torneo | null>(null);
  readonly jornadas = signal<Jornada[]>([]);
  readonly inscripciones = signal<Inscripcion[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly notifying = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly selectedPartidoId = signal<number | null>(null);
  readonly currentTab = signal<'jornadas' | 'posiciones'>('jornadas');

  // Notification Modal State
  readonly showNotificarModal = signal(false);
  notificarFecha = '';
  notificarHora = '';
  notificarLugar = '';

  // Score capture form
  marcadorLocal = 0;
  marcadorVisitante = 0;

  readonly formatoMeta = FORMATO_META;

  // ── Computed ───────────────────────────────────────────────────────────────

  /** All matches flattened from jornadas in order */
  readonly allPartidos = computed<Partido[]>(() => {
    const result: Partido[] = [];
    for (const j of this.jornadas()) {
      if (j.partidos) {
        for (const p of j.partidos) {
          result.push(p);
        }
      }
    }
    return result;
  });

  /** Matches that still need a score (both teams present, not finalized) */
  readonly pendingPartidos = computed<Partido[]>(() =>
    this.allPartidos().filter(p =>
      p.estado !== 'finalizado' &&
      p.inscripcion_local && p.inscripcion_visitante
    )
  );

  /** Total completados (finalized) */
  readonly completedCount = computed(() =>
    this.allPartidos().filter(p => p.estado === 'finalizado').length
  );

  readonly totalCount = computed(() => this.allPartidos().length);

  readonly progressPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  /** The currently selected partido object */
  readonly selectedPartido = computed<Partido | null>(() => {
    const id = this.selectedPartidoId();
    if (!id) return null;
    return this.allPartidos().find(p => p.id === id) ?? null;
  });

  /** Jornada number for the selected match */
  readonly selectedJornada = computed<Jornada | null>(() => {
    const p = this.selectedPartido();
    if (!p) return null;
    return this.jornadas().find(j => j.id === p.jornada_id) ?? null;
  });

  /** Current match index (1-based) among all pending */
  readonly currentMatchIndex = computed(() => {
    const p = this.selectedPartido();
    if (!p) return 0;
    const pending = this.pendingPartidos();
    const idx = pending.findIndex(m => m.id === p.id);
    return idx >= 0 ? idx + 1 : 0;
  });

  /** Whether the tournament is fully completed */
  readonly torneoCompleto = computed(() =>
    this.pendingPartidos().length === 0 && this.totalCount() > 0 && !this.loading()
  );

  /** Tournament meta */
  readonly meta = computed(() => {
    const t = this.torneo();
    return t ? FORMATO_META[t.formato] : null;
  });

  /** Calculate standings dynamically from completed matches */
  readonly standings = computed(() => {
    const statsMap = new Map<number, any>();

    for (const insc of this.inscripciones()) {
      statsMap.set(insc.id, {
        inscripcion: insc,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        dif: 0,
        pts: 0
      });
    }

    for (const match of this.allPartidos()) {
      if (match.estado === 'finalizado' && match.inscripcion_local_id && match.inscripcion_visitante_id) {
        const local = statsMap.get(match.inscripcion_local_id);
        const visitor = statsMap.get(match.inscripcion_visitante_id);
        
        if (!local || !visitor) continue;

        const ml = match.marcador_local ?? 0;
        const mv = match.marcador_visitante ?? 0;

        local.pj++;
        local.gf += ml;
        local.gc += mv;
        if (ml > mv) {
          local.g++;
          local.pts += 3;
        } else if (ml === mv) {
          local.e++;
          local.pts += 1;
        } else {
          local.p++;
        }
        local.dif = local.gf - local.gc;

        visitor.pj++;
        visitor.gf += mv;
        visitor.gc += ml;
        if (mv > ml) {
          visitor.g++;
          visitor.pts += 3;
        } else if (mv === ml) {
          visitor.e++;
          visitor.pts += 1;
        } else {
          visitor.p++;
        }
        visitor.dif = visitor.gf - visitor.gc;
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dif !== a.dif) return b.dif - a.dif;
      return b.gf - a.gf;
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/deportivo/torneos']);
      return;
    }
    this.loadData(id);
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  async loadData(torneoId?: number): Promise<void> {
    const id = torneoId ?? this.torneo()?.id;
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const [torneoRes, jornadasRes, inscRes] = await Promise.all([
        firstValueFrom(this.svc.getById(id)),
        firstValueFrom(this.svc.getJornadas(id)),
        firstValueFrom(this.svc.getInscripciones(id)),
      ]);
      this.torneo.set(torneoRes.data);
      this.jornadas.set(jornadasRes.data.jornadas);
      this.inscripciones.set(inscRes.data.inscripciones);

      // Auto-select first pending match if nothing selected
      if (!this.selectedPartidoId() || !this.allPartidos().find(p => p.id === this.selectedPartidoId())) {
        this.autoSelectNextPending();
      }
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al cargar datos del torneo');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Match selection ───────────────────────────────────────────────────────

  selectPartido(p: Partido): void {
    if (p.estado === 'finalizado') return;
    if (!p.inscripcion_local || !p.inscripcion_visitante) return;
    this.selectedPartidoId.set(p.id);
    this.marcadorLocal = p.marcador_local ?? 0;
    this.marcadorVisitante = p.marcador_visitante ?? 0;
    this.error.set(null);
    this.successMsg.set(null);
  }

  autoSelectNextPending(): void {
    const pending = this.pendingPartidos();
    if (pending.length > 0) {
      this.selectedPartidoId.set(pending[0].id);
      this.marcadorLocal = pending[0].marcador_local ?? 0;
      this.marcadorVisitante = pending[0].marcador_visitante ?? 0;
    } else {
      this.selectedPartidoId.set(null);
    }
  }

  // ── Save score ────────────────────────────────────────────────────────────

  abrirNotificarModal(): void {
    const p = this.selectedPartido();
    if (!p) return;
    
    if (p.fecha) {
      const d = new Date(p.fecha);
      this.notificarFecha = d.toISOString().split('T')[0];
      this.notificarHora = d.toTimeString().substring(0, 5);
    } else {
      this.notificarFecha = '';
      this.notificarHora = '';
    }
    this.notificarLugar = p.lugar ?? '';
    this.showNotificarModal.set(true);
  }

  cerrarNotificarModal(): void {
    this.showNotificarModal.set(false);
  }

  getMensajeWhatsApp(): string {
    const p = this.selectedPartido();
    const t = this.torneo();
    if (!p || !t) return '';

    const nombreTorneo = t.nombre;
    const rivales = `${this.nombreInscripcion(p.inscripcion_local)} vs ${this.nombreInscripcion(p.inscripcion_visitante)}`;
    
    return `MENSAJE SIGUIENTE PARTICIPACIÓN

¡Hola! 👋

Ya está todo listo para tu próxima participación en el torneo ${nombreTorneo}. Aquí tienes los detalles:

🆚 Rivales / Participantes: ${rivales}
📅 Fecha: ${this.notificarFecha || 'Por definir'}
⏰ Hora: ${this.notificarHora || 'Por definir'}
📍 Lugar asignado: ${this.notificarLugar || 'Por definir'}

Te recomendamos llegar al menos 15 minutos antes para prepararte y registrar tu asistencia de forma correcta.

¡Es momento de dar lo mejor de ti! 💪

Centro Libanés | Torneos`;
  }

  copiarMensaje(): void {
    const msg = this.getMensajeWhatsApp();
    navigator.clipboard.writeText(msg).then(() => {
      this.showSuccess('Mensaje copiado al portapapeles');
      this.cerrarNotificarModal();
    });
  }

  async enviarNotificacion(): Promise<void> {
    const p = this.selectedPartido();
    const t = this.torneo();
    if (!p || !t || !this.notificarLugar?.trim()) return;

    this.notifying.set(true);
    this.error.set(null);
    try {
      const payload = {
        fecha: this.notificarFecha,
        hora: this.notificarHora,
        lugar: this.notificarLugar,
        rivales: `${this.nombreInscripcion(p.inscripcion_local)} vs ${this.nombreInscripcion(p.inscripcion_visitante)}`
      };
      
      const res = await firstValueFrom(this.svc.notificarPartido(t.id, p.id, payload));
      this.showSuccess(res.message || 'Notificaciones enviadas');
      
      // Update match locally if fecha/lugar were saved
      if (p.estado !== 'finalizado') {
        if (this.notificarFecha && this.notificarHora) {
          p.fecha = `${this.notificarFecha}T${this.notificarHora}`;
        }
        if (this.notificarLugar) {
          p.lugar = this.notificarLugar;
        }
      }
      this.cerrarNotificarModal();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al enviar notificaciones');
      this.cerrarNotificarModal();
    } finally {
      this.notifying.set(false);
    }
  }

  async guardarYSiguiente(): Promise<void> {
    await this.guardar(true);
  }

  async guardar(advance = false): Promise<void> {
    const p = this.selectedPartido();
    const t = this.torneo();
    if (!p || !t) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.guardarResultadoPartido(t.id, p.id, {
        marcador_local: this.marcadorLocal,
        marcador_visitante: this.marcadorVisitante,
      }));

      this.showSuccess('Marcador guardado exitosamente');

      // Reload data to reflect bracket advances
      await this.loadData();

      // Auto-advance to next pending
      if (advance) {
        this.autoSelectNextPending();
      }
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Error al guardar marcador');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  nombreInscripcion(insc: Inscripcion | null | undefined): string {
    if (!insc) return 'Equipo';
    return insc.torneo_equipo?.nombre
      ?? insc.equipo?.nombre
      ?? (insc.alumno ? `${insc.alumno.nombre} ${insc.alumno.apellido}` : 'Equipo');
  }

  colorInscripcion(insc: Inscripcion | null | undefined): string | null {
    return insc?.torneo_equipo?.color ?? null;
  }

  isBye(p: Partido): boolean {
    return p.estado === 'finalizado' && (!p.inscripcion_local || !p.inscripcion_visitante);
  }

  isPlayable(p: Partido): boolean {
    return p.estado !== 'finalizado' && !!p.inscripcion_local && !!p.inscripcion_visitante;
  }

  isPending(p: Partido): boolean {
    return p.estado !== 'finalizado' && (!p.inscripcion_local || !p.inscripcion_visitante);
  }

  jornadaLabel(j: Jornada): string {
    return j.nombre || `Ronda ${j.numero}`;
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3500);
  }

  goBack(): void {
    this.router.navigate(['/deportivo/torneos']);
  }
}
