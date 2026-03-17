import { Component, OnInit, OnDestroy, signal, afterNextRender, PLATFORM_ID, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContentMenu } from '../content-menu/content-menu';
import { ReglaService } from '../../services/regla.service';
import { ReglaDetalle } from '../../models/regla.model';

/** Labels legibles para cada variable evaluable */
const VARS_LABELS: Record<string, string> = {
  CONDICION_ADMINISTRATIVA: 'Condición administrativa',
  CONDICION_PATRIMONIAL:    'Condición patrimonial',
  EDAD:                     'Edad del socio',
  MONTO:                    'Monto de deuda',
  ESTADO_MEMBRESIA:         'Estado de la membresía',
  GENERO:                   'Género del socio',
  TIPO_SOCIO:               'Tipo de socio',
};

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
  errorMsg = signal<string | null>(null);

  readonly ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  readonly VARS_LABELS = VARS_LABELS;

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

  getVarLabel(variable: string): string {
    return VARS_LABELS[variable] ?? variable;
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
