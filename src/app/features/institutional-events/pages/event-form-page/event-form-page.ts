import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { EventFormStateService, WIZARD_STEPS } from '../../services/event-form-state.service';
import { ContentMenu } from '../../../../components/content-menu/content-menu';

import { Step1IdentityComponent } from '../../forms/step-1-identity/step-1-identity';
import { Step2DatetimeComponent } from '../../forms/step-2-datetime/step-2-datetime';
import { Step3AccessComponent } from '../../forms/step-3-access/step-3-access';
import { Step4SubeventsComponent } from '../../forms/step-4-subevents/step-4-subevents';
import { Step5HeroComponent } from '../../forms/step-5-hero/step-5-hero';
import { Step6ParticipantsComponent } from '../../forms/step-6-participants/step-6-participants';
import { Step7DocumentsComponent } from '../../forms/step-7-documents/step-7-documents';
import { Step8FaqContactComponent } from '../../forms/step-8-faq-contact/step-8-faq-contact';
import { Step9ReviewComponent } from '../../forms/step-9-review/step-9-review';

/**
 * Contenedor del wizard de creación/edición de un Evento Institucional (SCR-002).
 * Layout: 2 columnas — formulario a la izquierda, panel lateral de resumen a la derecha.
 */
@Component({
  selector: 'app-event-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ContentMenu,
    Step1IdentityComponent,
    Step2DatetimeComponent,
    Step3AccessComponent,
    Step4SubeventsComponent,
    Step5HeroComponent,
    Step6ParticipantsComponent,
    Step7DocumentsComponent,
    Step8FaqContactComponent,
    Step9ReviewComponent,
  ],
  templateUrl: './event-form-page.html',
  styleUrl: './event-form-page.scss',
})
export class EventFormPageComponent implements OnInit, OnDestroy {
  readonly steps = WIZARD_STEPS;

  // ── Inject services at field level (needed for toSignal in field initializers) ─
  readonly state = inject(EventFormStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private _routerSub?: Subscription;

  // ── Signals reactivos desde los FormGroups ────────────────────────────────────
  readonly identityVal = toSignal(
    this.state.identityGroup.valueChanges,
    { initialValue: this.state.identityGroup.value }
  );
  readonly datetimeVal = toSignal(
    this.state.datetimeGroup.valueChanges,
    { initialValue: this.state.datetimeGroup.value }
  );
  readonly accessVal = toSignal(
    this.state.accessGroup.valueChanges,
    { initialValue: this.state.accessGroup.value }
  );
  readonly heroVal = toSignal(
    this.state.heroGroup.valueChanges,
    { initialValue: this.state.heroGroup.value }
  );

  // ── Computed para el panel lateral ───────────────────────────────────────────
  readonly progresoPct = computed(() =>
    Math.round((this.state.currentStep() / this.steps.length) * 100)
  );

  readonly bannerBgUrl = computed(() => {
    const hero = this.heroVal();
    return (hero?.banner_image_url as string) || (hero?.banner_mobile_url as string) || (hero?.cover_image_url as string) || null;
  });

  readonly nombreEvento = computed(() => this.identityVal()?.name || '');
  readonly kickerEvento = computed(() => this.identityVal()?.kicker || '');
  readonly sedeNombre = computed(() => {
    const locId = this.identityVal()?.location_id;
    return this.state.locations().find(l => l.id === locId)?.name ?? '—';
  });
  readonly fechaInicio = computed(() => {
    const raw = this.datetimeVal()?.start_date;
    if (!raw) return '—';
    try { return new Date(raw).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  });
  readonly lugarEvento = computed(() => {
    const v = this.datetimeVal()?.venue as string | undefined;
    if (v?.trim()) return v.trim();

    const areaId = this.identityVal()?.area_id;
    if (areaId) {
      const area = this.state.areas().find(a => a.id === Number(areaId));
      if (area) return area.name;
    }

    return '—';
  });
  readonly accesosLabel = computed(() => {
    const types = this.accessVal()?.access_types as string[] | null;
    if (!types?.length) return '—';
    const map: Record<string, string> = {
      public: 'Público', members_only: 'Socios', registration: 'Con registro',
      restricted: 'Restringido', committee: 'Comité',
    };
    return types.map(t => map[t] ?? t).join(', ');
  });
  readonly capacidadLabel = computed(() => {
    const cap = this.accessVal()?.max_capacity;
    return cap && cap > 0 ? `${cap} lugares` : 'Sin límite';
  });

  // ── Estado UI ─────────────────────────────────────────────────────────────────
  readonly showPreviewOverlay    = signal(false);
  readonly showValidacionModal   = signal(false);
  readonly camposFaltantes       = signal<string[]>([]);
  private  _pendingStep: number | null = null;

  constructor() {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.state.loadForEdit(Number(idParam));
    } else {
      this.state.reset();
    }

    // Cerrar preview automáticamente al navegar a otra ruta
    this._routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(() => {
        if (this.showPreviewOverlay()) this.showPreviewOverlay.set(false);
      });
  }

  ngOnDestroy(): void {
    this._routerSub?.unsubscribe();
  }

  volver(): void { this.router.navigate(['/eventos']); }

  /**
   * Al avanzar desde Paso 1 valida campos obligatorios. Si faltan muestra el
   * modal de validación. En cualquier otra transición hace auto-save silencioso.
   */
  async autoGuardarYNavegar(step: number): Promise<void> {
    const desdeBasico = this.state.currentStep() === 1 && step > 1;
    if (desdeBasico) {
      const faltantes = this.state.validarCampos();
      if (faltantes.length) {
        this.state.marcarTocados();
        this.camposFaltantes.set(faltantes);
        this._pendingStep = step;
        this.showValidacionModal.set(true);
        return;
      }
      await this.state.save();
    }
    
    // Al navegar a otro paso, goToStep ya invoca saveDraft internamente
    this.state.goToStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Cierra el modal de validación sin navegar. */
  cerrarModalValidacion(): void {
    this.showValidacionModal.set(false);
    this._pendingStep = null;
  }

  /** Al abrir preview desde Paso 1 valida; desde otros pasos guarda silencioso. */
  async autoGuardarYAbrir(): Promise<void> {
    if (this.state.currentStep() === 1) {
      const faltantes = this.state.validarCampos();
      if (faltantes.length) {
        this.state.marcarTocados();
        this.camposFaltantes.set(faltantes);
        this._pendingStep = null;
        this.showValidacionModal.set(true);
        return;
      }
      await this.state.save();
    } else {
      await this.state.saveDraft();
    }
    
    const id = this.state.eventId();
    if (id) {
      window.open(`/eventos/landing/${id}`, '_blank');
    }
  }

  async guardarBorrador(): Promise<void> {
    const faltantes = this.state.validarCampos();
    if (faltantes.length) {
      this.state.marcarTocados();
      this.camposFaltantes.set(faltantes);
      this._pendingStep = null;
      this.showValidacionModal.set(true);
      return;
    }
    const evento = await this.state.save();
    if (evento && !this.state.loadError()) {
      this.router.navigate(['/eventos']);
    }
  }

  async guardarCambiosInteligente(): Promise<void> {
    if (this.state.eventId() === null) return;
    await this.state.saveDraft();
  }

  esPasoCompletado(id: number): boolean {
    return id <= this.state.maxStepReached() && id !== this.state.currentStep();
  }

  esPasoAccesible(id: number): boolean {
    return id <= this.state.maxStepReached() || this.state.eventId() !== null;
  }

  abrirPreview(): void { this.showPreviewOverlay.set(true); }
  cerrarPreview(): void { this.showPreviewOverlay.set(false); }

  get previewUrl(): SafeResourceUrl | null {
    const id = this.state.eventId();
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`/eventos/landing/${id}`);
  }
}
