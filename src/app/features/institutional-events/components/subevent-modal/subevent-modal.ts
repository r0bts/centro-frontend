import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  DestroyRef,
  computed,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import {
  AccessType,
  ACCESS_TYPE_META,
  EventAccessType,
  InstitutionalEventPrice,
  InstitutionalEventSubevent,
  NsService,
  SubeventStatus,
  SUBEVENT_STATUS_META,
} from '../../models/institutional-event.model';
import { EventFormStateService } from '../../services/event-form-state.service';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import { EventArea } from '../../models/institutional-event.model';

/**
 * Fila local de la matriz de precios del subevento (opción C, mapa 15 §7.3).
 *   - `enabled = false`  → la fila NO se envía al backend; significa que el
 *      subevento no está habilitado para ese `access_type`.
 *   - `enabled = true`   → se envía con su `cost` (puede ser 0 = gratis).
 */
type MatrixRow = {
  id?: number;
  access_type: AccessType;
  enabled: boolean;
  cost: number;
};

/** Valor de trabajo local del modal (subset editable de InstitutionalEventSubevent). */
type SubeventoForm = {
  name: string;
  start_date: string;
  end_date: string;
  venue: string;
  area_id: number | null;
  max_capacity: number;
  cost: number;
  ns_item_id: number | null;
  /**
   * @deprecated Se conserva por retro-compat (mapa 15 §8). Se calcula como el
   * primer elemento de `access_types[]` al guardar; no se edita directamente.
   */
  access_type: AccessType;
  /**
   * Tipos de acceso habilitados en el subevento (múltiple, propio, no heredado).
   * Subset estricto de `event.access_types[]` (§8.8 pregunta 1).
   */
  access_types: AccessType[];
  status: SubeventStatus;
  instructor_name:  string;
  instructor_phone: string;
  instructor_email: string;
  instructor_notes: string;
  description: string;
  has_matrix_pricing: boolean;
  /** Filas de la matriz (una por cada `event.access_types[]`, con toggle de habilitado). */
  matrix_prices: MatrixRow[];
  /** Serialización final que se emite al padre: solo filas `enabled=true`. */
  institutional_event_prices?: Partial<InstitutionalEventPrice>[];
};

function empty(): SubeventoForm {
  return {
    name: '', start_date: '', end_date: '', venue: '',
    area_id: null,
    max_capacity: 0, cost: 0, ns_item_id: null,
    access_type: 'public',
    access_types: [],
    status: 'confirmed',
    instructor_name: '', instructor_phone: '', instructor_email: '', instructor_notes: '',
    description: '',
    has_matrix_pricing: false,
    matrix_prices: [],
  };
}

/**
 * Modal de alta/edición de un subevento (paso 4 del wizard).
 * Componente controlado: el padre decide cuándo mostrarlo (`@if`) y le pasa
 * el subevento a editar (o ninguno para "agregar"); emite `saved`/`closed`.
 */
@Component({
  selector: 'app-subevent-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './subevent-modal.html',
  styleUrl: './subevent-modal.scss',
})
export class SubeventModalComponent implements OnChanges {
  readonly state = inject(EventFormStateService);
  private readonly svc = inject(InstitutionalEventsService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() subevento: Partial<InstitutionalEventSubevent> | null = null;

  @Output() saved = new EventEmitter<SubeventoForm>();
  @Output() closed = new EventEmitter<void>();

  readonly accessTypeMeta = ACCESS_TYPE_META;
  readonly subeventStatusMeta = SUBEVENT_STATUS_META;
  /** Lista dinámica desde el API — igual que en step-3-access */
  get accessTypes(): EventAccessType[] { return this.state.accessTypes(); }
  readonly statuses: SubeventStatus[] = ['confirmed', 'tentative', 'cancelled'];

  form: SubeventoForm = empty();
  errorMsg = '';
  submitted = false;

  // ── Selector NetSuite (aparece sólo cuando cost > 0). Mismo diseño que step-3-access. ──
  readonly nsServices = signal<NsService[]>([]);
  readonly nsQuery = signal<string>('');
  readonly showInactive = signal<boolean>(false);
  readonly nsLoading = signal<boolean>(false);
  readonly nsError = signal<string | null>(null);

  /** Ítem seleccionado, resuelto contra el catálogo cargado. */
  readonly selectedNsService = computed<NsService | null>(() => {
    const id = this.form.ns_item_id;
    if (!id) return null;
    return this.nsServices().find(s => s.id === id) ?? null;
  });

  /**
   * True cuando el subevento en edición ya trae un `ns_item_id` que no aparece
   * en el catálogo vendible/activo (legacy inactivo o ya no vendible).
   */
  readonly legacyItemInvalid = computed<boolean>(() => {
    const id = this.form.ns_item_id;
    if (!id) return false;
    if (this.nsLoading()) return false;
    return this.selectedNsService() === null;
  });

  constructor() {
    // Suscripción reactiva al buscador (misma UX que step-3-access).
    toObservable(this.nsQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.nsLoading.set(true);
        this.nsError.set(null);
        return this.svc.getNsServices({
          q: q.trim() || undefined,
          active: !this.showInactive(),
          sellable: true,
          limit: 200,
        }).pipe(
          catchError(err => {
            this.nsError.set(err?.error?.message ?? 'No se pudo cargar el catálogo de servicios.');
            return of<NsService[]>([]);
          }),
          tap(() => this.nsLoading.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(list => this.nsServices.set(list));
  }

  /** ns_item_id del evento contenedor — se usa como valor por defecto al prellenar. */
  private eventNsItemId(): number | null {
    const v = this.state.accessGroup?.get('ns_item_id')?.value;
    return v ?? null;
  }

  ngOnChanges(): void {
    this.errorMsg = '';
    this.submitted = false;
    // Fuente estable de todos los tipos válidos (independiente del fetch remoto):
    // se usa para prellenar `access_types[]` al agregar un subevento nuevo.
    const allAccessTypes = Object.keys(ACCESS_TYPE_META) as AccessType[];
    // Resolución de access_types[] del subevento (mapa 15 §8):
    //  - Si viene un array explícito → usarlo tal cual (NO se filtra por el evento;
    //    el subevento puede habilitar cualquier tipo global).
    //  - Si NO viene pero hay access_type singular legacy → migrar a [singular].
    //  - Si no hay nada (subevento nuevo) → prellenar con TODOS los tipos globales.
    const resolveAccessTypes = (): AccessType[] => {
      if (!this.subevento) {
        return [...allAccessTypes];
      }
      if (this.subevento.access_types && this.subevento.access_types.length > 0) {
        return [...this.subevento.access_types];
      }
      if (this.subevento.access_type) {
        return [this.subevento.access_type];
      }
      return [];
    };

    this.form = this.subevento
      ? {
          name: this.subevento.name ?? '',
          start_date: this.subevento.start_date ?? '',
          end_date: this.subevento.end_date ?? '',
          venue: this.subevento.venue ?? '',
          area_id: this.subevento.area_id ?? null,
          max_capacity: this.subevento.max_capacity ?? 0,
          cost: this.subevento.cost ?? 0,
          ns_item_id: this.subevento.ns_item_id ?? null,
          access_type: this.subevento.access_type ?? 'public',
          access_types: resolveAccessTypes(),
          status: this.subevento.status ?? 'confirmed',
          instructor_name:  this.subevento.instructor_name  ?? '',
          instructor_phone: this.subevento.instructor_phone ?? '',
          instructor_email: this.subevento.instructor_email ?? '',
          instructor_notes: this.subevento.instructor_notes ?? '',
          description: this.subevento.description ?? '',
          has_matrix_pricing: !!this.subevento.has_matrix_pricing,
          matrix_prices: [],
        }
      : { ...empty(), access_types: [...allAccessTypes] };

    // Sincroniza las filas de la matriz con los `access_types` del propio
    // subevento (no del evento): cada tipo habilitado genera una fila; si el
    // subevento ya tenía una `institutional_event_prices` para ese tipo, la
    // fila arranca `enabled=true` con su `cost` original; si no, empieza
    // `enabled=false` con `cost=0`.
    const existingPrices = this.subevento?.institutional_event_prices ?? [];
    this.form.matrix_prices = this.form.access_types.map(at => {
      const found = existingPrices.find(p => p.access_type === at);
      return {
        id: found?.id,
        access_type: at,
        enabled: !!found,
        cost: Number(found?.cost ?? 0),
      };
    });

    // Compatibilidad hacia atrás: subeventos históricos con cost>0 sin matriz
    // se migran automáticamente a has_matrix_pricing=true, sembrando el cost
    // en TODAS las filas para que el admin lo ajuste y elija qué tipos habilitar.
    const legacyCost = Number(this.form.cost ?? 0);
    if (legacyCost > 0 && !this.form.has_matrix_pricing) {
      this.form.has_matrix_pricing = true;
      for (const r of this.form.matrix_prices) {
        if (!r.enabled) {
          r.enabled = true;
          r.cost = legacyCost;
        }
      }
    }

    // Prellenado del ns_item_id cuando el subevento tiene costo propio y no
    // hay uno asignado aún.
    if (this.form.has_matrix_pricing && !this.form.ns_item_id) {
      this.form.ns_item_id = this.eventNsItemId();
    }

    // Carga inicial del catálogo si el bloque va a mostrarse.
    if (this.form.has_matrix_pricing && this.nsServices().length === 0 && !this.nsLoading()) {
      this.reloadNsServices();
    }
  }

  /** Al seleccionar un área, también guarda el nombre en `venue` para mostrar en la tabla. */
  onAreaChange(area: EventArea | null): void {
    this.form.venue = area?.name ?? '';
  }

  // ── Access types propios del subevento (mapa 15 §8) ─────────────────────

  /**
   * Tipos disponibles para los chips del subevento: todos los tipos globales.
   * Se construye desde `ACCESS_TYPE_META` (constante en el modelo) para no
   * depender del signal remoto `state.accessTypes()`, que carga async y podría
   * estar vacío al abrir el modal.
   */
  get eventAccessTypesChips(): EventAccessType[] {
    const remote = this.state.accessTypes();
    if (remote.length > 0) {
      return remote;
    }
    // Fallback local: siempre pintan los 5 chips aunque el fetch no haya llegado.
    return (Object.keys(ACCESS_TYPE_META) as AccessType[]).map(id => ({
      id,
      label: ACCESS_TYPE_META[id].label,
      description: ACCESS_TYPE_META[id].desc,
      condition_ids: null,
      requires_membership: false,
      requires_registration: false,
    }));
  }

  /**
   * Alterna un `access_type` en el subevento. Al desmarcar un tipo, remueve su
   * fila de la matriz (si existía). Al marcarlo, agrega una fila con
   * `enabled=false` y `cost=0` para que el admin la habilite en el bloque
   * de precios.
   */
  toggleAcceso(tipo: AccessType): void {
    const idx = this.form.access_types.indexOf(tipo);
    if (idx >= 0) {
      // Quitar del array de access_types + de la matriz.
      this.form.access_types = this.form.access_types.filter(t => t !== tipo);
      this.form.matrix_prices = this.form.matrix_prices.filter(r => r.access_type !== tipo);
    } else {
      // Agregar al array + agregar fila deshabilitada a la matriz.
      this.form.access_types = [...this.form.access_types, tipo];
      if (!this.form.matrix_prices.some(r => r.access_type === tipo)) {
        this.form.matrix_prices = [...this.form.matrix_prices, {
          access_type: tipo,
          enabled: false,
          cost: 0,
        }];
      }
    }
  }

  /** True cuando el chip está seleccionado (para pintar el estado activo). */
  isAccesoSeleccionado(tipo: AccessType): boolean {
    return this.form.access_types.includes(tipo);
  }

  // ── Utilidades ──────────────────────────────────────────────────────────

  /** Permite solo dígitos, máx 10 */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = clean;
    this.form.instructor_phone = clean;
  }

  /**
   * Se dispara al alternar el switch "¿El subevento tiene costo propio?".
   * Cuando se enciende, activa `has_matrix_pricing`, prellena `ns_item_id`
   * con el del evento contenedor y dispara la carga del catálogo NetSuite.
   * Cuando se apaga, limpia la matriz, el ítem NS y el costo.
   */
  onToggleHasCostOwn(checked: boolean): void {
    this.form.has_matrix_pricing = checked;
    if (checked) {
      if (!this.form.ns_item_id) {
        this.form.ns_item_id = this.eventNsItemId();
      }
      if (this.nsServices().length === 0 && !this.nsLoading()) {
        this.reloadNsServices();
      }
    } else {
      this.form.ns_item_id = null;
      this.form.cost = 0;
      // Deshabilita todas las filas de la matriz para que al reactivar el usuario
      // vuelva a elegir tipos con intención (no arrastramos selección anterior).
      for (const r of this.form.matrix_prices) {
        r.enabled = false;
      }
    }
  }

  // ── Matriz de precios del subevento (opción C) ─────────────────────────

  /** Etiqueta legible del `access_type` de una fila (misma fuente que el step-3). */
  matrixRowLabel(at: AccessType): string {
    return this.accessTypes.find(a => a.id === at)?.label
      ?? this.accessTypeMeta[at]?.label
      ?? at;
  }

  // ── Handlers del selector NS (mismos nombres que step-3-access) ──
  onNsQueryChange(value: string): void { this.nsQuery.set(value ?? ''); }

  toggleShowInactive(): void {
    this.showInactive.update(v => !v);
    this.reloadNsServices();
  }

  reloadNsServices(): void {
    this.nsLoading.set(true);
    this.nsError.set(null);
    this.svc.getNsServices({
      q: this.nsQuery().trim() || undefined,
      active: !this.showInactive(),
      sellable: true,
      limit: 200,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.nsServices.set(list); this.nsLoading.set(false); },
        error: err => {
          this.nsError.set(err?.error?.message ?? 'No se pudo cargar el catálogo de servicios.');
          this.nsLoading.set(false);
        },
      });
  }

  onSelectNsService(item: NsService): void {
    if (!item.has_incomeaccount) {
      this.nsError.set(`El ítem "${item.item_name}" no es vendible en NetSuite y no puede usarse para un subevento con costo.`);
      return;
    }
    this.form.ns_item_id = item.id;
    if (!this.nsServices().some(s => s.id === item.id)) {
      this.nsServices.update(l => [item, ...l]);
    }
  }

  clearNsSelection(): void {
    this.form.ns_item_id = null;
  }

  guardar(): void {
    this.submitted = true;
    if (!this.form.name.trim()) {
      this.errorMsg = 'El nombre del subevento es obligatorio.';
      return;
    }
    if (!this.form.area_id) {
      this.errorMsg = 'El lugar (área) es obligatorio.';
      return;
    }
    // Validación de access_types[] del subevento (mapa 15 §8): debe tener al
    // menos 1 tipo. La derivación al singular `access_type` se hace al final.
    if (!this.form.access_types || this.form.access_types.length === 0) {
      this.errorMsg = 'Selecciona al menos un tipo de acceso para el subevento.';
      return;
    }
    const phone = this.form.instructor_phone?.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
      this.errorMsg = 'El teléfono debe tener exactamente 10 dígitos numéricos.';
      return;
    }
    const email = this.form.instructor_email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMsg = 'Ingresa un correo electrónico válido.';
      return;
    }
    // Si el subevento tiene costo propio, exige ítem NS + al menos una fila
    // habilitada con cost > 0 en la matriz de precios (opción C).
    if (this.form.has_matrix_pricing) {
      if (!this.form.ns_item_id) {
        this.errorMsg = 'Selecciona un servicio de NetSuite para el subevento con costo propio (o define uno en el evento para heredarlo).';
        return;
      }
      if (this.legacyItemInvalid()) {
        this.errorMsg = 'El servicio NetSuite asignado no está disponible en el catálogo vendible. Selecciona otro para continuar.';
        return;
      }
      const habilitadas = this.form.matrix_prices.filter(r => r.enabled);
      if (habilitadas.length === 0) {
        this.errorMsg = 'Habilita al menos un tipo de acceso en la matriz de precios del subevento.';
        return;
      }
      const alguna = habilitadas.some(r => Number(r.cost) > 0);
      if (!alguna) {
        this.errorMsg = 'Al menos un tipo habilitado debe tener costo mayor a $0.';
        return;
      }
      // Deriva `cost` como el mayor de las filas habilitadas (queda de referencia
      // en la BD, pero la fuente real es institutional_event_prices).
      this.form.cost = habilitadas.reduce((max, r) => Math.max(max, Number(r.cost) || 0), 0);
    } else {
      // Subevento gratuito o heredado: limpia todo lo del bloque de pago.
      this.form.cost = 0;
      this.form.ns_item_id = null;
    }
    // Serializa la matriz: solo se envían filas `enabled=true` (opción C).
    this.form.institutional_event_prices = this.form.has_matrix_pricing
      ? this.form.matrix_prices
          .filter(r => r.enabled)
          .map(r => ({
            ...(r.id ? { id: r.id } : {}),
            access_type: r.access_type,
            cost: Number(r.cost) || 0,
          }))
      : [];
    // Deriva `access_type` (deprecated) del primer elemento de `access_types[]`
    // para mantener retro-compat con el backend/UI legacy (mapa 15 §8.4).
    this.form.access_type = this.form.access_types[0] as AccessType;
    this.errorMsg = '';
    this.saved.emit(this.form);
  }

  cerrar(): void {
    this.closed.emit();
  }
}
