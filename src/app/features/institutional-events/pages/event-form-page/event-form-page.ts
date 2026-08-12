import { Component, ChangeDetectionStrategy, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
export class EventFormPageComponent implements OnInit {
  readonly steps = WIZARD_STEPS;

  // ── Inject services at field level (needed for toSignal in field initializers) ─
  readonly state = inject(EventFormStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

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

  // ── Computed para el panel lateral ───────────────────────────────────────────
  readonly progresoPct = computed(() =>
    Math.round((this.state.currentStep() / this.steps.length) * 100)
  );

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
    return v?.trim() || '—';
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
  readonly showPreviewOverlay = signal(false);

  constructor() {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.state.loadForEdit(Number(idParam));
    } else {
      this.state.reset();
    }
  }

  volver(): void { this.router.navigate(['/eventos']); }

  esPasoCompletado(id: number): boolean { return id < this.state.currentStep(); }

  abrirPreview(): void { this.showPreviewOverlay.set(true); }
  cerrarPreview(): void { this.showPreviewOverlay.set(false); }

  get previewUrl(): SafeResourceUrl | null {
    const id = this.state.eventId();
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`/eventos/landing/${id}`);
  }
}
