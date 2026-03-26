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
  TorneoEquipo,
  CreateEquipoRequest,
} from '../../../../models/deportivo/torneo-equipo.model';
import { TorneoEquipoService } from '../../../../services/deportivo/torneo-equipo.service';

// ── Pasos del wizard ──────────────────────────────────────────────────────────
interface Step { id: number; label: string; icon: string; }
const STEPS: Step[] = [
  { id: 1, label: 'Información', icon: 'bi-info-circle'  },
  { id: 2, label: 'Resumen',     icon: 'bi-check-circle' },
];

// ── Colores de sugerencia rápida ─────────────────────────────────────────────
const COLORES_SUGERIDOS = [
  '#0d6efd', '#198754', '#dc3545', '#fd7e14',
  '#6f42c1', '#20c997', '#0dcaf0', '#ffc107',
];

@Component({
  selector: 'app-equipo-torneo-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-torneo-wizard.html',
  styleUrl:    './equipo-torneo-wizard.scss',
})
export class EquipoTorneoWizardComponent implements OnInit, OnDestroy {
  @Input() editEquipo: TorneoEquipo | null = null;
  @Output() saved     = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private svc = inject(TorneoEquipoService);

  // ── Constantes expuestas al template ────────────────────────────────────────
  readonly steps          = STEPS;
  readonly coloresSugeridos = COLORES_SUGERIDOS;

  // ── Estado ──────────────────────────────────────────────────────────────────
  currentStep = signal(1);
  saving      = signal(false);
  error       = signal<string | null>(null);

  // ── Campos del formulario ─────────────────────────────────────────────────
  nombre      = '';
  descripcion = '';
  color       = '#0d6efd';
  is_active   = true;

  // ── Computed ────────────────────────────────────────────────────────────────
  progressPct = computed(() => ((this.currentStep() - 1) / (STEPS.length - 1)) * 100);
  isEditing   = computed(() => this.editEquipo !== null);

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    if (this.editEquipo) {
      this.patchFromEdit(this.editEquipo);
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private patchFromEdit(e: TorneoEquipo): void {
    this.nombre      = e.nombre;
    this.descripcion = e.descripcion ?? '';
    this.color       = e.color ?? '#0d6efd';
    this.is_active   = e.is_active;
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
    if (this.currentStep() === 1) {
      if (!this.nombre.trim()) {
        this.error.set('El nombre del equipo es obligatorio');
        return false;
      }
    }
    this.error.set(null);
    return true;
  }

  selectColor(c: string): void {
    this.color = c;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async submit(): Promise<void> {
    if (!this.validateCurrentStep()) return;
    if (!this.nombre.trim()) {
      this.error.set('El nombre del equipo es obligatorio');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: CreateEquipoRequest = {
      nombre:      this.nombre.trim(),
      descripcion: this.descripcion.trim() || null,
      color:       this.color || null,
      logo_url:    null,
      is_active:   this.is_active,
    };

    try {
      if (this.isEditing()) {
        await firstValueFrom(this.svc.update(this.editEquipo!.id, payload));
        this.saved.emit('Equipo actualizado correctamente');
      } else {
        await firstValueFrom(this.svc.create(payload));
        this.saved.emit('Equipo creado correctamente');
      }
    } catch (e: any) {
      const msg = e?.error?.message ?? 'Error al guardar el equipo';
      this.error.set(msg);
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
