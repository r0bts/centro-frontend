import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  Torneo,
  TorneoFormato,
  TorneoFormData,
  CreateTorneoRequest,
  FORMATO_META,
  FormatoMeta,
} from '../../../../models/deportivo/torneo.model';
import { TorneoService } from '../../../../services/deportivo/torneo.service';

// ── Pasos del wizard ──────────────────────────────────────────────────────────
interface Step { id: number; label: string; icon: string; }
const STEPS: Step[] = [
  { id: 1, label: 'Información',  icon: 'bi-info-circle'   },
  { id: 2, label: 'Formato',      icon: 'bi-trophy'        },
  { id: 3, label: 'Resumen',      icon: 'bi-check-circle'  },
];

// ── Formatos en orden de presentación ────────────────────────────────────────
const FORMATOS_ORDER: TorneoFormato[] = ['americano', 'escalera', 'divisiones', 'race'];

@Component({
  selector: 'app-torneo-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './torneo-wizard.html',
  styleUrl:    './torneo-wizard.scss',
})
export class TorneoWizardComponent implements OnInit, OnDestroy {
  @Input() editTorneo: Torneo | null = null;
  @Output() saved     = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private svc = inject(TorneoService);

  // ── Constantes expuestas al template ────────────────────────────────────────
  readonly steps        = STEPS;
  readonly formatosMeta = FORMATOS_ORDER.map(k => FORMATO_META[k]);

  // ── Estado ──────────────────────────────────────────────────────────────────
  currentStep  = signal(1);
  saving       = signal(false);
  error        = signal<string | null>(null);
  formData     = signal<TorneoFormData | null>(null);
  loadingForm  = signal(true);

  // ── Campos del formulario ─── Paso 1 ────────────────────────────────────────
  nombre       = '';
  descripcion  = '';
  sede         = '';
  fecha_inicio = '';
  fecha_fin    = '';
  is_active    = true;

  // ── Campos del formulario ─── Paso 2 ────────────────────────────────────────
  formato: TorneoFormato | null = null;

  // ── Computed ────────────────────────────────────────────────────────────────
  progressPct = computed(() => ((this.currentStep() - 1) / (STEPS.length - 1)) * 100);
  isEditing   = computed(() => this.editTorneo !== null);

  selectedFormatoMeta = computed<FormatoMeta | null>(() =>
    this.formato ? FORMATO_META[this.formato] : null
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    this.svc.getFormData().subscribe({
      next: res => {
        this.formData.set(res.data);
        this.loadingForm.set(false);
      },
      error: () => this.loadingForm.set(false),
    });

    if (this.editTorneo) {
      this.patchFromEdit(this.editTorneo);
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private patchFromEdit(t: Torneo): void {
    this.nombre       = t.nombre;
    this.descripcion  = t.descripcion ?? '';
    this.sede         = t.sede ?? '';
    this.fecha_inicio = t.fecha_inicio ?? '';
    this.fecha_fin    = t.fecha_fin ?? '';
    this.is_active    = t.is_active;
    this.formato      = t.formato;
  }

  // ── Navegación ───────────────────────────────────────────────────────────────
  goTo(step: number): void {
    if (step < 1 || step > STEPS.length) return;
    if (step > this.currentStep() && !this.validateCurrentStep()) return;
    this.currentStep.set(step);
    this.error.set(null);
  }

  next(): void { this.goTo(this.currentStep() + 1); }
  prev(): void { this.goTo(this.currentStep() - 1); }

  private validateCurrentStep(): boolean {
    const step = this.currentStep();
    if (step === 1) {
      if (!this.nombre.trim()) {
        this.error.set('El nombre del torneo es obligatorio');
        return false;
      }
    }
    if (step === 2) {
      if (!this.formato) {
        this.error.set('Selecciona un formato de torneo');
        return false;
      }
    }
    this.error.set(null);
    return true;
  }

  selectFormato(f: TorneoFormato): void {
    this.formato = f;
    this.error.set(null);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async submit(): Promise<void> {
    if (!this.validateCurrentStep()) return;
    if (!this.nombre.trim() || !this.formato) {
      this.error.set('Completa todos los campos requeridos');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: CreateTorneoRequest = {
      nombre:       this.nombre.trim(),
      descripcion:  this.descripcion.trim() || null,
      formato:      this.formato,
      sede:         this.sede.trim() || null,
      fecha_inicio: this.fecha_inicio || null,
      fecha_fin:    this.fecha_fin    || null,
      is_active:    this.is_active,
    };

    try {
      if (this.isEditing()) {
        await firstValueFrom(this.svc.update(this.editTorneo!.id, payload));
        this.saved.emit('Torneo actualizado correctamente');
      } else {
        await firstValueFrom(this.svc.create(payload));
        this.saved.emit('Torneo creado correctamente');
      }
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Error al guardar el torneo';
      this.error.set(msg);
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
