import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, OnDestroy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, takeUntil } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ClinicItem, ClinicEnrollmentItem } from '../clinica.model';

export type WizardPaso = 'search' | 'family' | 'confirm' | 'done';

export interface ClinicSocioSearchResult {
  id: number;
  entityid: string;
  fullname: string;
  email?: string;
  phone?: string;
  membership_id?: number;
  titular_id?: number | null;
  titular_name?: string | null;
  family?: {
    id: number;
    entityid: string;
    fullname: string;
    email?: string;
    phone?: string;
    parentesco: string;
    is_titular: boolean;
  }[];
}

export interface ClinicPendingMember {
  socio_id: number;
  entityid: string;
  fullname: string;
  email?: string;
  phone?: string;
  parentesco: string;
  is_titular: boolean;
  selected: boolean;
  alreadyEnrolled: boolean;
  price: number;
  coupon_code?: string;
}

@Component({
  selector: 'app-clinic-inscribir-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './clinic-inscribir-wizard.html',
  styleUrls: ['./clinic-inscribir-wizard.scss']
})
export class ClinicInscribirWizardComponent implements OnDestroy {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/deportivo/clinicas`;

  @Input({ required: true }) clinic!: ClinicItem;
  @Input() existingEnrollments: ClinicEnrollmentItem[] = [];
  @Output() inscripcionGuardada = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  // ── Pasos del Wizard (Directo a Socios) ──────────────────────────────────
  readonly paso = signal<WizardPaso>('search');

  // ── Búsqueda de Socios con Debounce ─────────────────────────────────────
  readonly searchTerm = signal<string>('');
  readonly buscando = signal<boolean>(false);
  readonly resultados = signal<ClinicSocioSearchResult[]>([]);

  // ── Grupo Familiar y Miembros ──────────────────────────────────────────
  readonly selectedHostSocio = signal<ClinicSocioSearchResult | null>(null);
  readonly pendingMembers = signal<ClinicPendingMember[]>([]);
  readonly guardando = signal<boolean>(false);
  readonly alertMessage = signal<{ title: string; text: string; type?: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  // ── Datos de Facturación & Cobro ───────────────────────────────────────
  readonly paymentMethod = signal<'karlo_pay' | 'cash' | 'terminal' | 'transfer'>('karlo_pay');
  readonly sendPaymentLink = signal<boolean>(true);
  readonly billingEmail = signal<string>('');
  readonly billingPhone = signal<string>('');

  // ── Resultados de la Inscripción ───────────────────────────────────────
  readonly batchResults = signal<any[]>([]);
  readonly nsSoId = signal<number | null>(null);
  readonly nsSoError = signal<string | null>(null);

  // ── Computadas ─────────────────────────────────────────────────────────
  readonly miembrosActivos = computed(() =>
    this.pendingMembers().filter(m => m.selected)
  );

  readonly totalPaquete = computed(() =>
    this.miembrosActivos().reduce((sum, m) => sum + (m.coupon_code ? 0 : m.price), 0)
  );

  readonly cupoDisponible = computed(() => {
    const max = this.clinic?.max_capacity || 0;
    const current = this.clinic?.current_enrolled_count || 0;
    return Math.max(0, max - current);
  });

  readonly willOverbook = computed(() => {
    const max = this.clinic?.max_capacity || 0;
    const current = this.clinic?.current_enrolled_count || 0;
    const adding = this.miembrosActivos().filter(m => !m.alreadyEnrolled).length;
    return (current + adding) > max;
  });

  constructor() {
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.trim().length < 2) {
          this.buscando.set(false);
          return of({ data: [] });
        }
        this.buscando.set(true);
        return this.http.get<{ success: boolean; data: ClinicSocioSearchResult[] }>(
          `${this.apiUrl}/socios/buscar?q=${encodeURIComponent(q.trim())}`
        ).pipe(
          catchError(() => of({ success: false, data: [] }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.resultados.set(res.data || []);
      this.buscando.set(false);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(q: string): void {
    this.searchTerm.set(q);
    this.searchInput$.next(q);
  }

  seleccionarSocio(socio: ClinicSocioSearchResult): void {
    this.selectedHostSocio.set(socio);
    this.alertMessage.set(null);

    // Email y teléfono predeterminados para la orden NetSuite / Karlo Pay
    this.billingEmail.set(socio.email || '');
    this.billingPhone.set(socio.phone || '');

    const unitPrice = Number(this.clinic?.price || 0);

    // Si tiene grupo familiar lo cargamos; si no, creamos un array con él mismo
    const familia = (socio.family && socio.family.length > 0)
      ? socio.family
      : [{
          id: socio.id,
          entityid: socio.entityid,
          fullname: socio.fullname,
          email: socio.email,
          phone: socio.phone,
          parentesco: 'Titular',
          is_titular: true
        }];

    // Mapear miembros y validar si ya están inscritos en esta clínica
    const members: ClinicPendingMember[] = familia.map(f => {
      const already = this.existingEnrollments.some(
        e => (e.socio_id === f.id || e.full_name.trim().toLowerCase() === f.fullname.trim().toLowerCase()) &&
             e.status !== 'cancelled' && e.payment_status !== 'cancelled'
      );

      // Por conveniencia, seleccionamos por defecto al socio que fue buscado
      const isInitialTarget = (f.id === socio.id);

      return {
        socio_id: f.id,
        entityid: f.entityid,
        fullname: f.fullname,
        email: f.email,
        phone: f.phone,
        parentesco: f.parentesco,
        is_titular: f.is_titular,
        selected: isInitialTarget && !already,
        alreadyEnrolled: already,
        price: unitPrice,
        coupon_code: ''
      };
    });

    this.pendingMembers.set(members);
    this.paso.set('family');
  }

  toggleMiembro(m: ClinicPendingMember): void {
    if (m.alreadyEnrolled) return;
    this.pendingMembers.update(items =>
      items.map(item => item.socio_id === m.socio_id ? { ...item, selected: !item.selected } : item)
    );
  }

  avanzarAConfirm(): void {
    if (this.miembrosActivos().length === 0) {
      this.alertMessage.set({
        title: 'Selección requerida',
        text: 'Debes marcar al menos a un miembro de la familia para inscribirlo.',
        type: 'warning'
      });
      return;
    }

    if (this.willOverbook()) {
      // Verificar si los que exceden el cupo tienen cupón
      const sinCupon = this.miembrosActivos().filter(m => !m.coupon_code);
      const cupoRestante = this.cupoDisponible();
      if (sinCupon.length > cupoRestante) {
        this.alertMessage.set({
          title: 'Cupón de Sobrecupo Requerido',
          text: `La clínica cuenta con cupo para ${cupoRestante} alumno(s). Los lugares adicionales requieren un cupón de sobrecupo autorizado (RN-02).`,
          type: 'warning'
        });
      }
    }

    this.alertMessage.set(null);
    this.paso.set('confirm');
  }

  volver(): void {
    const p = this.paso();
    if (p === 'family') {
      this.paso.set('search');
    } else if (p === 'confirm') {
      this.paso.set('family');
    }
  }

  async confirmarInscripcion(): Promise<void> {
    const seleccionados = this.miembrosActivos();
    if (seleccionados.length === 0 || this.guardando()) return;

    this.guardando.set(true);
    this.alertMessage.set(null);

    const payload = {
      students: seleccionados.map(m => ({
        socio_id: m.socio_id,
        full_name: m.fullname,
        member_number: m.entityid,
        coupon_code: m.coupon_code || null
      })),
      titular_id: this.selectedHostSocio()?.id || seleccionados[0]?.socio_id,
      payment_method: this.paymentMethod(),
      send_payment_link: this.sendPaymentLink(),
      email: this.billingEmail(),
      phone: this.billingPhone()
    };

    this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/${this.clinic.id}/inscribir`,
      payload
    ).subscribe({
      next: res => {
        this.guardando.set(false);
        if (res.success) {
          this.batchResults.set(res.data?.results || []);
          this.nsSoId.set(res.data?.ns_so_id || null);
          this.nsSoError.set(res.data?.ns_so_error || null);
          this.paso.set('done');
          this.inscripcionGuardada.emit();
        } else {
          this.alertMessage.set({
            title: 'No se pudo completar',
            text: res.message || 'Ocurrió un error al procesar las inscripciones.',
            type: 'error'
          });
        }
      },
      error: err => {
        this.guardando.set(false);
        this.alertMessage.set({
          title: 'Error de servidor',
          text: err.error?.message || 'Error al conectar con el servidor.',
          type: 'error'
        });
      }
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
