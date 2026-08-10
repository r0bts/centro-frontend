import { Component, OnInit, OnDestroy, signal, afterNextRender, PLATFORM_ID, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContentMenu } from '../content-menu/content-menu';
import { ReglaService, VarDef } from '../../services/regla.service';
import { ReglaDetalle } from '../../models/regla.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-membresias-reglas-ver',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ContentMenu],
  templateUrl: './membresias-reglas-ver.html',
  styleUrls: ['./membresias-reglas-ver.scss'],
})
export class MembresiasReglasVerComponent implements OnInit, OnDestroy {

  activeSection = 'membresias-reglas';

  regla = signal<ReglaDetalle | null>(null);
  isLoading = signal(true);
  isTogglingActiva = signal(false);
  errorMsg = signal<string | null>(null);
  /** clave → label legible, cargado dinámicamente desde el API */
  varsMap = signal<Record<string, string>>({});

  readonly ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  private destroy$ = new Subject<void>();
  private pendingId = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reglaService: ReglaService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    console.log('[VER] constructor — isBrowser:', isPlatformBrowser(this.platformId));
    // Resolver el id aquí (snapshot está disponible en el constructor)
    afterNextRender(() => {
      console.log('[VER] afterNextRender — pendingId:', this.pendingId);
      if (this.pendingId) {
        this.loadRegla(this.pendingId);
      }
    });
  }

  ngOnInit(): void {
    const id = +(this.route.snapshot.paramMap.get('id') ?? 0);
    if (!id) {
      this.router.navigate(['/membresias/reglas']);
      return;
    }
    if (isPlatformBrowser(this.platformId)) {
      // Browser directo (sin SSR o RenderMode.Client): cargar inmediatamente
      this.loadRegla(id);
      this.loadVariables();
    } else {
      // SSR: diferir al afterNextRender en el browser
      this.pendingId = id;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ────────────────────────────────────────────────

  private loadRegla(id: number): void {
    console.log('[VER] loadRegla — llamando API con id:', id);
    this.isLoading.set(true);
    this.reglaService
      .getRegla(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.regla.set(res.data);
        },
        error: (err) => {
          this.isLoading.set(false);
          const status   = err?.status ?? 0;
          this.errorMsg.set(status === 404
            ? 'La regla solicitada no existe.'
            : 'No se pudo cargar la regla. Intenta de nuevo.');
        },
      });
  }

  // ── Acciones ─────────────────────────────────────────────

  onEditar(): void {
    if (this.regla()) {
      this.router.navigate(['/membresias/reglas/editar', this.regla()!.id_regla]);
    }
  }

  onVolver(): void {
    this.router.navigate(['/membresias/reglas']);
  }

  onToggleActiva(): void {
    const r = this.regla();
    if (!r || this.isTogglingActiva()) return;
    const nuevoEstado = !r.activa;
    Swal.fire({
      title: nuevoEstado ? '¿Activar regla?' : '¿Desactivar regla?',
      html: `La regla <strong>#${r.numero_regla} — ${r.nombre}</strong> quedará <strong>${nuevoEstado ? 'activa' : 'inactiva'}</strong> inmediatamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado ? '#43B581' : '#F4D35E',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.isTogglingActiva.set(true);
      this.reglaService.toggleRegla(r.id_regla)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.isTogglingActiva.set(false);
            this.regla.update(prev => prev ? { ...prev, activa: res.data.activa } : prev);
            Swal.fire({
              icon: 'success',
              title: res.data.activa ? 'Regla activada' : 'Regla desactivada',
              timer: 1800,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
            });
          },
          error: () => {
            this.isTogglingActiva.set(false);
            Swal.fire({
              icon: 'error',
              title: 'Error al cambiar estado',
              text: 'No se pudo cambiar el estado de la regla.',
              confirmButtonColor: '#DA3E3E',
            });
          },
        });
    });
  }

  // ── Helpers de formato ───────────────────────────────────

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()}-${m[d.getMonth()]}-${d.getFullYear()}`;
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()}-${m[d.getMonth()]}-${d.getFullYear()} `
         + `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  private loadVariables(): void {
    this.reglaService.getVariables()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (map) => {
          const labels: Record<string, string> = {};
          for (const [clave, def] of Object.entries(map)) {
            labels[clave] = (def as VarDef).label;
          }
          this.varsMap.set(labels);
        },
        error: () => { /* silently ignore — fallback al clave raw */ },
      });
  }

  getVarLabel(variable: string): string {
    return this.varsMap()[variable] ?? variable;
  }

  getConditionLetter(index: number): string {
    return this.ALPHA[index] ?? String(index + 1);
  }

  hasAnyMessage(): boolean {
    if (!this.regla()) return false;
    return !!(
      this.regla()!.mensaje_cumplimiento ||
      this.regla()!.mensaje_acuerdo      ||
      this.regla()!.mensaje_desacuerdo
    );
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }
}
