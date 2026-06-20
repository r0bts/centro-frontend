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
import { firstValueFrom, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  TorneoEquipo,
  CreateEquipoRequest,
  AddIntegranteRequest,
} from '../../../../models/deportivo/torneo-equipo.model';
import { TorneoEquipoService } from '../../../../services/deportivo/torneo-equipo.service';
import { TorneoService } from '../../../../services/deportivo/torneo.service';
import { MembresiaService } from '../../../../services/membresia.service';
import { SocioMembresia, InvitadoMembresia } from '../../../../models/membresia.model';
import { Torneo } from '../../../../models/deportivo/torneo.model';

// ── Pasos del wizard ──────────────────────────────────────────────────────────
interface Step { id: number; label: string; icon: string; }
const STEPS: Step[] = [
  { id: 1, label: 'Información', icon: 'bi-info-circle'  },
  { id: 2, label: 'Integrantes', icon: 'bi-people'       },
  { id: 3, label: 'Resumen',     icon: 'bi-check-circle' },
];

// ── Colores de sugerencia rápida ─────────────────────────────────────────────
const COLORES_SUGERIDOS = [
  '#0d6efd', '#198754', '#dc3545', '#fd7e14',
  '#6f42c1', '#20c997', '#0dcaf0', '#ffc107',
];

interface IntegranteLocal extends AddIntegranteRequest {
  _tempId: string;
  nombreDisplay: string;
}

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
  private membresiaSvc = inject(MembresiaService);
  private torneoSvc = inject(TorneoService);

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
  torneo_id   = signal<number | null>(null);
  torneosActivos = signal<Torneo[]>([]);

  // ── Paso Integrantes ───────────────────────────────────────────────────────
  integrantesList = signal<IntegranteLocal[]>([]);
  searchQuery = '';
  isSearching = signal(false);
  sociosFound = signal<SocioMembresia[]>([]);
  invitadosFound = signal<InvitadoMembresia[]>([]);
  searchSubject = new Subject<string>();
  membresiaTitular = signal<string | null>(null);

  // Nuevo Invitado
  newGuestForm = {
    firstName: '',
    lastName: '',
    phone: '',
  };

  // ── Computed ────────────────────────────────────────────────────────────────
  progressPct = computed(() => ((this.currentStep() - 1) / (STEPS.length - 1)) * 100);
  isEditing   = computed(() => this.editEquipo !== null);

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    if (this.editEquipo) {
      this.patchFromEdit(this.editEquipo);
    }

    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(q => {
      this.buscarMembresia(q);
    });

    this.torneoSvc.getAll({ activo: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.torneosActivos.set(res.data.torneos);
        }
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private patchFromEdit(e: TorneoEquipo): void {
    this.nombre      = e.nombre;
    this.descripcion = e.descripcion ?? '';
    this.color       = e.color ?? '#0d6efd';
    this.is_active   = e.is_active;
    if (e.torneo_id) {
      this.torneo_id.set(e.torneo_id);
    }
    if (e.integrantes) {
      const mapped = e.integrantes.map(i => ({
        _tempId: 'db_' + i.id,
        socio_id: i.socio_id,
        guest_id: i.guest_id,
        is_invitado: i.is_invitado,
        numero_jersey: i.numero_jersey,
        posicion: i.posicion,
        es_capitan: i.es_capitan,
        nombreDisplay: i.socio?.nombre || 'Desconocido',
      }));
      this.integrantesList.set(mapped);
    }
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

  // ── Busqueda Membresía ───────────────────────────────────────────────────────
  onSearchInput(val: string): void {
    this.searchSubject.next(val);
  }

  async buscarMembresia(q: string): Promise<void> {
    if (q.length < 2) {
      this.sociosFound.set([]);
      this.invitadosFound.set([]);
      this.membresiaTitular.set(null);
      return;
    }
    this.isSearching.set(true);
    try {
      const res = await firstValueFrom(this.membresiaSvc.buscar(q));
      if (res.success && res.data) {
        this.sociosFound.set(res.data.socios || []);
        this.invitadosFound.set(res.data.invitados || []);
        this.membresiaTitular.set(res.data.membresia?.nombreTitular || 'Membresía');
      } else {
        this.sociosFound.set([]);
        this.invitadosFound.set([]);
        this.membresiaTitular.set(null);
      }
    } catch (e) {
      this.sociosFound.set([]);
      this.invitadosFound.set([]);
      this.membresiaTitular.set(null);
    }
    this.isSearching.set(false);
  }

  // ── Gestión Integrantes Locales ──────────────────────────────────────────────
  addSocio(s: SocioMembresia): void {
    const list = this.integrantesList();
    if (list.some(i => i.socio_id === s.id && !i.is_invitado)) return;

    this.integrantesList.set([...list, {
      _tempId: 'socio_' + s.id,
      nombreDisplay: s.nombreCompleto,
      socio_id: s.id,
      is_invitado: false,
    }]);
  }

  addInvitado(i: InvitadoMembresia): void {
    const list = this.integrantesList();
    if (list.some(inv => inv.guest_id === i.id && inv.is_invitado)) return;

    // Si agregamos un invitado, automáticamente agregamos al titular (si no está ya en la lista)
    const newItems = [];
    if (i.socioId) {
      const titularYaEsta = list.some(item => item.socio_id === i.socioId && !item.is_invitado);
      if (!titularYaEsta) {
        // Buscar el socio en sociosFound()
        const socio = this.sociosFound().find(s => s.id === i.socioId);
        if (socio) {
          newItems.push({
            _tempId: 'socio_' + socio.id,
            nombreDisplay: socio.nombreCompleto,
            socio_id: socio.id,
            is_invitado: false,
          });
        }
      }
    }

    newItems.push({
      _tempId: 'guest_' + i.id,
      nombreDisplay: i.firstName + ' ' + (i.lastName ?? ''),
      guest_id: i.id,
      socio_id: i.socioId,
      is_invitado: true,
    });

    this.integrantesList.set([...list, ...newItems]);
  }

  addNewInvitado(): void {
    if (!this.newGuestForm.firstName || !this.newGuestForm.lastName || !this.newGuestForm.phone) {
      alert('Llena todos los campos del nuevo invitado');
      return;
    }
    const list = this.integrantesList();
    // Use first titular ID for tracking who invited if possible, or null
    const firstSocio = this.sociosFound()[0]?.id ?? null;
    
    const tempId = 'new_guest_' + Date.now();
    this.integrantesList.set([...list, {
      _tempId: tempId,
      nombreDisplay: this.newGuestForm.firstName + ' ' + this.newGuestForm.lastName + ' (Nuevo)',
      socio_id: firstSocio,
      is_invitado: true,
      first_name: this.newGuestForm.firstName,
      last_name: this.newGuestForm.lastName,
      phone: this.newGuestForm.phone,
    }]);

    this.newGuestForm = { firstName: '', lastName: '', phone: '' };
  }

  removeIntegrante(tempId: string): void {
    this.integrantesList.update(list => list.filter(i => i._tempId !== tempId));
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
      integrantes: this.integrantesList(),
      torneo_id:   this.torneo_id(),
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
