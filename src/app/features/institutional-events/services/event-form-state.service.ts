import { Injectable, signal, computed } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InstitutionalEventsService } from './institutional-events.service';
import {
  AccessType,
  EventAccessType,
  ColorTheme,
  EventColorTheme,
  EventExtraData,
  EventIndicator,
  EventLocation,
  EventModality,
  EventType,
  InstitutionalEvent,
  InstitutionalEventPayload,
  InstitutionalEventPrice,
  InstitutionalEventSpeaker,
  InstitutionalEventSubevent,
  InstitutionalEventTestimonial,
  PostEventData,
  PostEventGalleryItem,
  PostEventMetric,
  EventArea,
  EventPlace,
  EventStatus,
  SaleType,
} from '../models/institutional-event.model';

export interface WizardStepMeta {
  id: number;
  key: string;
  label: string;
  icon: string;
}

/** Los 3 pasos del wizard simplificado. */
export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 1, key: 'identity', label: 'Básico',   icon: 'bi-pencil-square' },
  { id: 2, key: 'details',  label: 'Detalles', icon: 'bi-sliders' },
  { id: 3, key: 'review',   label: 'Publicar', icon: 'bi-clipboard2-check-fill' },
];

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  // Acepta tanto 'YYYY-MM-DD HH:mm:ss' como ISO con offset (respuesta de la API).
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toApiDateTime(value?: string | null): string | null {
  if (!value) return null;
  // input datetime-local => 'YYYY-MM-DDTHH:mm' -> 'YYYY-MM-DD HH:mm:ss'
  return value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
}

/**
 * Estado y lógica reactiva del wizard de creación/edición de un Evento Institucional.
 * Contiene un único FormGroup raíz con sub-grupos por paso, más los signals de
 * progreso/carga/guardado. Los 9 componentes standalone de `forms/step-*` inyectan
 * este servicio y leen/escriben directamente sobre sus sub-grupos.
 */
@Injectable({ providedIn: 'root' })
export class EventFormStateService {
  readonly steps = WIZARD_STEPS;

  readonly currentStep = signal(1);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly eventId = signal<number | null>(null);
  /** Campos que fallaron validación — usados para pintar rojo en los pasos. */
  readonly camposInvalidos = signal<string[]>([]);
  /** Estado actual del evento cargado en el wizard (draft si es nuevo). */
  readonly eventStatus = signal<EventStatus>('draft');
  readonly mode = computed<'create' | 'edit'>(() => (this.eventId() === null ? 'create' : 'edit'));
  /** true cuando el evento ya no está en borrador y no necesita ser publicado de nuevo. */
  readonly isAlreadyPublished = computed(() => this.eventStatus() !== 'draft');

  readonly locations = signal<EventLocation[]>([]);
  readonly loadingLocations = signal(false);
  readonly areas = signal<EventArea[]>([]);
  readonly loadingAreas = signal(false);
  readonly places = signal<EventPlace[]>([]);
  readonly loadingPlaces = signal(false);
  readonly accessTypes = signal<EventAccessType[]>([]);
  readonly loadingAccessTypes = signal(false);
  readonly colorThemes = signal<EventColorTheme[]>([]);
  readonly loadingColorThemes = signal(false);
  readonly saleTypes = signal<SaleType[]>([]);
  readonly loadingSaleTypes = signal(false);
  isPatching = false;

  /** Indica si hay cambios en el formulario que no han sido guardados en el backend */
  readonly unsavedChanges = signal(false);

  /** Archivos pendientes de subir al backend — se procesan automáticamente dentro de save(). */
  readonly pendingImageUploads = new Map<string, File>();

  readonly root: FormGroup;

  constructor(private fb: FormBuilder, private svc: InstitutionalEventsService) {
    this.root = this.fb.group({
      identity: this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        kicker: ['', Validators.maxLength(150)],
        event_type: ['' as EventType, Validators.required],
        area_id: [null as number | null, Validators.required],
        location_id: [null as number | null],
        place_id: [null as number | null],
        description: [''],
        color_theme: ['classic' as ColorTheme],
      }),
      datetime: this.fb.group({
        start_date: ['', Validators.required],
        end_date: [''],
        all_day: [false],
        doors_open_time: ['' as string],
        venue: [''],
        event_modality: ['presencial' as EventModality],
        stream_url: [''],
      }),
      access: this.fb.group({
        access_types: this.fb.control<AccessType[]>([], Validators.required),
        has_registration: [true],
        max_capacity: [null as number | null],
        has_cost: [false],
        cost: [null as number | null],
        ns_item_id: [null as number | null],
        sale_type_id: [null as number | null],
        has_matrix_pricing: [false],
        // Matriz de precios del evento base: una fila por `access_type` que el evento acepta.
        // Se sincroniza automáticamente con `access_types` (ver syncMatrixPricesWithAccessTypes).
        matrix_prices: this.fb.array([]),
      }),
      subevents: this.fb.array([]),
      hero: this.fb.group({
        banner_image_url: [''],
        banner_mobile_url: [''],
        cover_image_url: [''],
        allies_header: ['Sponsors'],
        allies: [[] as any[]],
      }),
      postEvent: this.fb.group({
        gallery: this.fb.array([]),
        metrics: this.fb.array([]),
        summary: [''],
      }),
      documents: this.fb.array([]),
      speakers: this.fb.array([]),
      testimonials: this.fb.array([]),
      faqContact: this.fb.group({
        faqs: this.fb.array([]),
        contact_email: ['', Validators.email],
        contact_phone: [''],
        contact_person: [''],
        contact_schedule: [''],
        maps_url: [''],
        social_facebook: [''],
        social_instagram: [''],
        social_twitter: [''],
        social_tiktok: [''],
        indicators: this.fb.array([]),
      }),
    });

    // Detectar cambios para el botón inteligente de guardado
    this.root.valueChanges.subscribe(() => {
      if (this.eventId() !== null && !this.isPatching) {
        this.unsavedChanges.set(true);
      }
    });

    // Mantiene sincronizada la matriz de precios del evento base con los
    // access_types seleccionados: agrega fila nueva (cost=0) cuando se activa un
    // tipo y elimina la fila cuando se desactiva. No borra cost si el usuario
    // reactiva un tipo previamente eliminado — se recrea vacía a propósito.
    this.accessGroup.get('access_types')!.valueChanges.subscribe(() => {
      this.syncMatrixPricesWithAccessTypes();
    });

    this.loadLocations();
    this.loadAreas();
    this.loadPlaces();
    this.loadAccessTypes();
    this.loadColorThemes();
    this.loadSaleTypes();
  }

  // ── Getters de conveniencia ──────────────────────────────────────────────────

  get identityGroup(): FormGroup { return this.root.get('identity') as FormGroup; }
  get datetimeGroup(): FormGroup { return this.root.get('datetime') as FormGroup; }
  get accessGroup(): FormGroup { return this.root.get('access') as FormGroup; }
  get heroGroup(): FormGroup { return this.root.get('hero') as FormGroup; }
  get postEventGroup(): FormGroup { return this.root.get('postEvent') as FormGroup; }
  get faqContactGroup(): FormGroup { return this.root.get('faqContact') as FormGroup; }
  get subeventsArray(): FormArray { return this.root.get('subevents') as FormArray; }
  get documentsArray(): FormArray { return this.root.get('documents') as FormArray; }
  get speakersArray(): FormArray { return this.root.get('speakers') as FormArray; }
  get testimonialsArray(): FormArray { return this.root.get('testimonials') as FormArray; }
  get faqsArray(): FormArray { return this.faqContactGroup.get('faqs') as FormArray; }
  get indicatorsArray(): FormArray { return this.faqContactGroup.get('indicators') as FormArray; }
  get postGalleryArray(): FormArray { return this.postEventGroup.get('gallery') as FormArray; }
  get postMetricsArray(): FormArray { return this.postEventGroup.get('metrics') as FormArray; }
  /** FormArray de la matriz de precios del evento base (una fila por `access_type`). */
  get matrixPricesArray(): FormArray { return this.accessGroup.get('matrix_prices') as FormArray; }

  readonly maxStepReached = signal(1);

  // ── Navegación entre pasos ───────────────────────────────────────────────────

  goToStep(id: number): void {
    if (id < 1 || id > this.steps.length) return;
    this.currentStep.set(id);
    if (id > this.maxStepReached()) {
      this.maxStepReached.set(id);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Auto-guardado en segundo plano al cambiar de paso
    this.saveDraft();
  }

  next(): void { this.goToStep(this.currentStep() + 1); }
  prev(): void { this.goToStep(this.currentStep() - 1); }

  /** Valida el grupo del paso actual. Si es inválido, marca campos y devuelve false; si es válido, avanza y devuelve true. */
  tryNext(group: AbstractControl): boolean {
    if (group.invalid) {
      group.markAllAsTouched();
      return false;
    }
    this.goToStep(this.currentStep() + 1);
    return true;
  }

  // ── Catálogo de sedes ────────────────────────────────────────────────────────

  async loadLocations(): Promise<void> {
    this.loadingLocations.set(true);
    try {
      const lista = await firstValueFrom(this.svc.getEventLocations());
      this.locations.set(lista);
    } catch {
      this.locations.set([]);
    } finally {
      this.loadingLocations.set(false);
    }
  }

  async loadAreas(): Promise<void> {
    this.loadingAreas.set(true);
    try {
      const lista = await firstValueFrom(this.svc.getAreas());
      this.areas.set(lista);
    } catch {
      this.areas.set([]);
    } finally {
      this.loadingAreas.set(false);
    }
  }

  async loadPlaces(): Promise<void> {
    this.loadingPlaces.set(true);
    try {
      const lista = await firstValueFrom(this.svc.getPlaces());
      this.places.set(lista);
    } catch {
      this.places.set([]);
    } finally {
      this.loadingPlaces.set(false);
    }
  }

  async loadAccessTypes(): Promise<void> {
    this.loadingAccessTypes.set(true);
    try {
      const lista = await firstValueFrom(this.svc.getAccessTypes());
      this.accessTypes.set(lista);
    } catch {
      this.accessTypes.set([]);
    } finally {
      this.loadingAccessTypes.set(false);
    }
  }

  async loadColorThemes(): Promise<void> {
    this.loadingColorThemes.set(true);
    try {
      const lista = await firstValueFrom(this.svc.getColorThemes());
      this.colorThemes.set(lista);
    } catch {
      this.colorThemes.set([]);
    } finally {
      this.loadingColorThemes.set(false);
    }
  }

  /**
   * Catálogo de tipos de venta NetSuite (`sale_types`). Se usa en el Paso 3
   * para poblar el selector `sale_type_id` del evento base. Solo activos.
   */
  async loadSaleTypes(): Promise<void> {
    this.loadingSaleTypes.set(true);
    try {
      const lista = await firstValueFrom(this.svc.getSaleTypes({ active: true, limit: 500 }));
      this.saleTypes.set(lista);
    } catch {
      this.saleTypes.set([]);
    } finally {
      this.loadingSaleTypes.set(false);
    }
  }

  // ── Matriz de precios del evento base (FormArray) ────────────────────────────

  /**
   * Construye un FormGroup para una fila de la matriz de precios del evento base.
   *
   * @param p Semilla opcional (cuando cargamos un evento existente). Si viene
   *          sin `access_type`, cae a `'public'` por defecto (nunca deber\u00eda pasar
   *          — la matriz siempre lleva el tipo).
   */
  private buildMatrixPriceGroup(p?: Partial<InstitutionalEventPrice>): FormGroup {
    return this.fb.group({
      id: [p?.id ?? null],
      access_type: [(p?.access_type ?? 'public') as AccessType, Validators.required],
      cost: [Number(p?.cost ?? 0), [Validators.required, Validators.min(0)]],
    });
  }

  /**
   * Sincroniza el FormArray `matrix_prices` con los `access_types` actuales del
   * evento base:
   *   - agrega una fila con `cost=0` para cada `access_type` que no tenga fila,
   *   - elimina filas cuyo `access_type` ya no est\u00e1 seleccionado,
   *   - preserva las filas existentes (respetando `cost` y `id` para no perder
   *     precios al reordenar la selecci\u00f3n).
   *
   * Se invoca autom\u00e1ticamente al cambiar `access_types` (ver constructor) y al
   * cargar un evento (patchFromEvent).
   */
  syncMatrixPricesWithAccessTypes(): void {
    const tipos = (this.accessGroup.get('access_types')!.value as AccessType[]) ?? [];
    const filas: FormGroup[] = [...this.matrixPricesArray.controls] as FormGroup[];
    // Elimina filas que ya no est\u00e1n en la selecci\u00f3n (recorre desde el final).
    for (let i = filas.length - 1; i >= 0; i--) {
      const at = filas[i].get('access_type')!.value as AccessType;
      if (!tipos.includes(at)) {
        this.matrixPricesArray.removeAt(i);
      }
    }
    // Agrega filas nuevas para los tipos que a\u00fan no tienen fila.
    const presentes = new Set(
      (this.matrixPricesArray.controls as FormGroup[])
        .map(g => g.get('access_type')!.value as AccessType)
    );
    for (const t of tipos) {
      if (!presentes.has(t)) {
        this.matrixPricesArray.push(this.buildMatrixPriceGroup({ access_type: t, cost: 0 }));
      }
    }
  }

  // ── Subeventos (FormArray) ───────────────────────────────────────────────────

  private buildSubeventGroup(s?: Partial<InstitutionalEventSubevent>): FormGroup {
    // Prellenado de access_types[]: el subevento puede habilitar cualquier
    // tipo global (mapa 15 §8), NO está restringido a los del evento. Si el
    // subevento es nuevo (sin datos) se preselecciona la lista completa; el
    // admin quita los que no aplican en el modal.
    const allAccessTypes: AccessType[] = ['public', 'members', 'patron', 'committee', 'registration'];
    const seedTypes = (s?.access_types && s.access_types.length > 0)
      ? [...s.access_types]
      : (s?.access_type ? [s.access_type] : [...allAccessTypes]);
    return this.fb.group({
      id: [s?.id ?? null],
      name: [s?.name ?? '', Validators.required],
      description: [s?.description ?? ''],
      start_date: [toDatetimeLocal(s?.start_date)],
      end_date: [toDatetimeLocal(s?.end_date)],
      venue: [s?.venue ?? ''],
      area_id: [s?.area_id ?? null, Validators.required],
      max_capacity: [s?.max_capacity ?? 0],
      cost: [s?.cost ?? 0],
      ns_item_id: [s?.ns_item_id ?? null],
      // sale_type_id (custbody_cl_tipo_venta): opcional; NULL = hereda del evento padre.
      sale_type_id: [s?.sale_type_id ?? null],
      // access_type (singular, deprecated): se conserva por retro-compat (§8.4).
      // Al guardar en el payload se calcula como el primer elemento de access_types[].
      access_type: [s?.access_type ?? seedTypes[0] ?? 'public'],
      // access_types[] (múltiple, propio, no heredado): fuente de verdad del
      // paso 4 (mapa 15 §8). Independiente de event.access_types[].
      access_types: this.fb.control<AccessType[]>(seedTypes),
      instructor_name:  [s?.instructor_name  ?? ''],
      instructor_phone: [s?.instructor_phone ?? ''],
      instructor_email: [s?.instructor_email ?? ''],
      instructor_notes: [s?.instructor_notes ?? ''],
      status: [s?.status ?? 'confirmed'],
      // Matriz de precios del subevento (mapa 15 §7): activada cuando el subevento
      // tiene costo distinto por tipo de acceso. Se guarda como array plano de
      // filas ({ access_type, cost }); el `subevent_id` lo asigna Cake en saveAssociated.
      has_matrix_pricing: [s?.has_matrix_pricing ?? false],
      institutional_event_prices: [(s?.institutional_event_prices ?? []) as InstitutionalEventPrice[]],
    });
  }

  addSubevent(data?: Partial<InstitutionalEventSubevent>): void {
    this.subeventsArray.push(this.buildSubeventGroup(data));
  }

  updateSubevent(index: number, data: Partial<InstitutionalEventSubevent>): void {
    this.subeventsArray.at(index).patchValue({
      ...data,
      start_date: toDatetimeLocal(data.start_date as string | undefined),
      end_date: toDatetimeLocal(data.end_date as string | undefined),
    });
  }

  removeSubevent(index: number): void {
    this.subeventsArray.removeAt(index);
  }

  // ── Documentos (FormArray) ───────────────────────────────────────────────────

  addDocument(name = '', url = ''): void {
    this.documentsArray.push(this.fb.group({
      name: [name, Validators.required],
      url: [url, Validators.required],
    }));
  }

  removeDocument(index: number): void {
    this.documentsArray.removeAt(index);
  }

  // ── Speakers (FormArray) ─────────────────────────────────────────────────────

  addSpeaker(data?: Partial<InstitutionalEventSpeaker>): void {
    this.speakersArray.push(this.fb.group({
      name: [data?.name ?? '', Validators.required],
      role: [data?.role ?? '', Validators.required],
      bio: [data?.bio ?? ''],
      photo_url: [data?.photo_url ?? ''],
    }));
  }

  removeSpeaker(index: number): void {
    this.speakersArray.removeAt(index);
  }

  // ── Testimonios (FormArray) ──────────────────────────────────────────────────

  addTestimonial(data?: Partial<InstitutionalEventTestimonial>): void {
    this.testimonialsArray.push(this.fb.group({
      name: [data?.name ?? '', Validators.required],
      role: [data?.role ?? ''],
      quote: [data?.quote ?? '', Validators.required],
      stars: [data?.stars ?? 5],
    }));
  }

  removeTestimonial(index: number): void {
    this.testimonialsArray.removeAt(index);
  }

  // ── FAQs (FormArray) ─────────────────────────────────────────────────────────

  addFaq(question = '', answer = ''): void {
    this.faqsArray.push(this.fb.group({
      question: [question, Validators.required],
      answer: [answer, Validators.required],
    }));
  }

  removeFaq(index: number): void {
    this.faqsArray.removeAt(index);
  }

  // ── Indicators (FormArray en faqContact) ─────────────────────────────────────

  addIndicator(value = '', label = '', prefix = ''): void {
    this.indicatorsArray.push(this.fb.group({
      value: [value, Validators.required],
      label: [label, Validators.required],
      prefix: [prefix],
    }));
  }

  removeIndicator(index: number): void {
    this.indicatorsArray.removeAt(index);
  }

  // ── Post-Event Gallery (FormArray en postEvent) ───────────────────────────────

  addGalleryItem(url = '', caption = ''): void {
    this.postGalleryArray.push(this.fb.group({
      url: [url, Validators.required],
      caption: [caption],
    }));
  }

  removeGalleryItem(index: number): void {
    this.postGalleryArray.removeAt(index);
  }

  // ── Post-Event Metrics (FormArray en postEvent) ───────────────────────────────

  addPostMetric(value = '', label = '', prefix = ''): void {
    this.postMetricsArray.push(this.fb.group({
      value: [value, Validators.required],
      label: [label, Validators.required],
      prefix: [prefix],
    }));
  }

  removePostMetric(index: number): void {
    this.postMetricsArray.removeAt(index);
  }

  // ── Allies (en heroGroup) ──────────────────────────────────────────────────────

  addAlly(name = '', logo_url = '', url = ''): void {
    const current: any[] = this.heroGroup.get('allies')!.value ?? [];
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    this.heroGroup.get('allies')!.setValue([...current, { id, name, logo_url, url }]);
  }

  removeAlly(index: number): void {
    const current: any[] = this.heroGroup.get('allies')!.value ?? [];
    this.heroGroup.get('allies')!.setValue(current.filter((_, i) => i !== index));
  }

  // ── Carga en modo edición ────────────────────────────────────────────────────

  async loadForEdit(id: number): Promise<void> {
    this.eventId.set(id);
    this.maxStepReached.set(3);
    this.loadError.set(null);
    this.saving.set(true);
    try {
      // Carga el evento y las áreas en paralelo; solo parchea cuando ambos están listos.
      // Esto evita la race condition donde ng-select no tiene items al momento del patchValue.
      const [res] = await Promise.all([
        firstValueFrom(this.svc.getById(id)),
        this.loadAreas(),
      ]);
      this.isPatching = true;
      this.patchFromEvent(res.data.event);
      setTimeout(() => {
        this.isPatching = false;
        this.unsavedChanges.set(false);
        this.root.markAsPristine();
      }, 500);

    } catch {
      this.loadError.set('No se pudo cargar el evento para edición.');
    } finally {
      this.saving.set(false);
    }
  }

  private patchFromEvent(event: InstitutionalEvent): void {
    // Registrar el estado actual para que el Paso 9 pueda bloquearse si ya está publicado
    this.eventStatus.set(event.status);
    this.identityGroup.patchValue({
      name: event.name,
      kicker: event.kicker ?? '',
      event_type: event.event_type,
      area_id: event.area_id ?? null,
      place_id: event.place_id ?? null,
      location_id: event.location_id,
      description: event.description ?? '',
      color_theme: event.color_theme ?? event.extra_data?.color_theme ?? 'classic',
    });
    this.datetimeGroup.patchValue({
      start_date: toDatetimeLocal(event.start_date),
      end_date: toDatetimeLocal(event.end_date),
      all_day: event.all_day,
      venue: event.venue ?? '',
      event_modality: event.event_modality ?? 'presencial',
      stream_url: event.stream_url ?? '',
      doors_open_time: event.doors_open_time ?? '',
    });
    this.accessGroup.patchValue({
      access_types: event.access_types ?? [],
      has_registration: event.has_registration,
      max_capacity: event.max_capacity ?? null,
      has_cost: event.has_cost,
      // El campo `cost` legacy ya no se usa: la matriz de precios es la única
      // fuente de verdad. Lo forzamos a null al cargar (queda en BD históricamente
      // pero no lo mostramos ni lo enviamos de vuelta al guardar).
      cost: null,
      ns_item_id: event.ns_item_id ?? null,
      sale_type_id: event.sale_type_id ?? null,
      // Si el evento histórico tiene has_cost=true pero has_matrix_pricing=false,
      // lo forzamos a true para que al guardar migre automáticamente al nuevo modelo.
      has_matrix_pricing: !!event.has_cost,
    });
    // Cargar la matriz de precios del evento base (filas con subevent_id null).
    this.matrixPricesArray.clear();
    const eventPrices = (event.institutional_event_prices ?? [])
      .filter(p => (p.subevent_id === null || p.subevent_id === undefined));
    for (const price of eventPrices) {
      this.matrixPricesArray.push(this.buildMatrixPriceGroup(price));
    }
    // Asegura que la matriz tenga una fila por cada access_type incluso si el evento
    // histórico no las tenía (necesario para que la UI muestre los campos vacíos).
    // Si el evento histórico tenía `cost > 0` sin matriz, sembramos ese cost en
    // todas las filas nuevas para que el admin lo revise en lugar de partir de 0.
    const legacyCost = Number(event.cost ?? 0);
    this.syncMatrixPricesWithAccessTypes();
    if (legacyCost > 0 && eventPrices.length === 0) {
      for (const g of (this.matrixPricesArray.controls as any[])) {
        if (Number(g.get('cost').value) === 0) {
          g.get('cost').setValue(legacyCost);
        }
      }
    }
    this.heroGroup.patchValue({
      banner_image_url: event.banner_image_url ?? '',
      banner_mobile_url: (event.extra_data as any)?.banner_mobile_url ?? '',
      cover_image_url: (event.extra_data as any)?.cover_image_url ?? '',
      allies_header: event.extra_data?.allies_header ?? 'Sponsors',
      allies: event.extra_data?.allies ?? [],
    });
    this.faqContactGroup.patchValue({
      contact_email: event.contact_email ?? '',
      contact_phone: event.contact_phone ?? '',
      contact_person: event.extra_data?.contact_person ?? '',
      contact_schedule: event.extra_data?.contact_schedule ?? '',
      maps_url: event.extra_data?.maps_url ?? '',
      social_facebook: event.extra_data?.social_facebook ?? '',
      social_instagram: event.extra_data?.social_instagram ?? '',
      social_twitter: event.extra_data?.social_twitter ?? '',
      social_tiktok: event.extra_data?.social_tiktok ?? '',
    });

    this.subeventsArray.clear();
    (event.institutional_event_subevents ?? []).forEach(s => this.addSubevent(s));

    this.documentsArray.clear();
    (event.documents ?? []).forEach(d => this.addDocument(d.name, d.url));

    this.speakersArray.clear();
    (event.speakers ?? []).forEach(s => this.addSpeaker(s));

    this.testimonialsArray.clear();
    (event.testimonials ?? []).forEach(t => this.addTestimonial(t));

    this.faqsArray.clear();
    (event.faqs ?? []).forEach(f => this.addFaq(f.question, f.answer));

    this.indicatorsArray.clear();
    (event.extra_data?.indicators ?? []).forEach(i => this.addIndicator(i.value, i.label, i.prefix));

    this.postGalleryArray.clear();
    (event.post_event_data?.gallery ?? []).forEach(g => this.addGalleryItem(g.url, g.caption));

    this.postMetricsArray.clear();
    (event.post_event_data?.metrics ?? []).forEach(m => this.addPostMetric(m.value, m.label, m.prefix));

    this.postEventGroup.patchValue({ summary: event.post_event_data?.summary ?? '' });
  }

  // ── Construcción del payload / guardado ──────────────────────────────────────

  buildPayload(): InstitutionalEventPayload {
    const identity = this.identityGroup.value;
    const datetime = this.datetimeGroup.value;
    const access = this.accessGroup.value;
    const hero = this.heroGroup.value;
    const faqContact = this.faqContactGroup.value;
    const postEvent = this.postEventGroup.value;

    const extraData: EventExtraData = {
      contact_person: faqContact.contact_person || undefined,
      contact_schedule: faqContact.contact_schedule || undefined,
      maps_url: faqContact.maps_url || undefined,
      social_facebook: faqContact.social_facebook || undefined,
      social_instagram: faqContact.social_instagram || undefined,
      social_twitter: faqContact.social_twitter || undefined,
      social_tiktok: faqContact.social_tiktok || undefined,
      indicators: this.indicatorsArray.value.length ? this.indicatorsArray.value : undefined,
      allies: hero.allies?.length ? hero.allies : undefined,
      allies_header: hero.allies_header || undefined,
      banner_mobile_url: hero.banner_mobile_url || undefined,
      cover_image_url: hero.cover_image_url || undefined,
      color_theme: (identity as any).color_theme || 'classic',
    };

    const postEventData: PostEventData = {
      gallery: this.postGalleryArray.value.length ? this.postGalleryArray.value : undefined,
      metrics: this.postMetricsArray.value.length ? this.postMetricsArray.value : undefined,
      summary: postEvent.summary || undefined,
    };

    return {
      location_id: identity.location_id,
      area_id: identity.area_id ?? null,
      place_id: (identity as any).place_id || null,
      name: identity.name,
      kicker: identity.kicker || null,
      event_type: identity.event_type,
      color_theme: (identity as any).color_theme || 'classic',
      description: identity.description || null,
      banner_image_url: hero.banner_image_url || null,
      start_date: toApiDateTime(datetime.start_date)!,
      end_date: toApiDateTime(datetime.end_date),
      all_day: !!datetime.all_day,
      venue: datetime.venue || null,
      event_modality: datetime.event_modality || 'presencial',
      stream_url: datetime.stream_url || null,
      doors_open_time: datetime.doors_open_time || null,
      access_types: access.access_types,
      has_registration: !!access.has_registration,
      max_capacity: access.max_capacity || null,
      has_cost: !!access.has_cost,
      // `cost` legacy: siempre null en el nuevo modelo, la matriz es la única
      // fuente de precios (mapa 15 §7.9). Se mantiene la columna en BD para no
      // romper datos históricos, pero ya no se escribe desde la UI.
      cost: null,
      ns_item_id: access.has_cost ? (access.ns_item_id ?? null) : null,
      // sale_type_id se conserva aunque el evento no tenga costo (clasifica la venta al enviar a NS).
      sale_type_id: access.sale_type_id ?? null,
      // has_cost implica siempre matriz.
      has_matrix_pricing: !!access.has_cost,
      // Matriz de precios del evento base: se envía siempre que has_cost=true.
      // Cada fila trae `access_type` + `cost` (>= 0). El `subevent_id` viaja como null.
      institutional_event_prices: access.has_cost
        ? (access.matrix_prices as any[])
            .filter(p => (access.access_types as AccessType[]).includes(p.access_type))
            .map(p => ({
              ...(p.id ? { id: p.id } : {}),
              subevent_id: null,
              access_type: p.access_type,
              cost: Number(p.cost) || 0,
            }))
        : [],
      has_donations: false,
      documents: this.documentsArray.value.length ? this.documentsArray.value : null,
      speakers: this.speakersArray.value.length ? this.speakersArray.value : null,
      testimonials: this.testimonialsArray.value.length ? this.testimonialsArray.value : null,
      post_event_data: (postEventData.gallery || postEventData.metrics || postEventData.summary) ? postEventData : null,
      extra_data: Object.values(extraData).some(v => v !== undefined) ? extraData : null,
      faqs: this.faqsArray.value.length ? this.faqsArray.value : null,
      contact_email: faqContact.contact_email || null,
      contact_phone: faqContact.contact_phone || null,
      institutional_event_subevents: this.subeventsArray.value.map((s: any) => {
        // Deriva access_type (deprecated) del primer elemento de access_types[]
        // para retro-compat con el backend que aún lo indexa (mapa 15 §8.4).
        const at: AccessType[] = Array.isArray(s.access_types) && s.access_types.length > 0
          ? s.access_types
          : (s.access_type ? [s.access_type] : []);
        return {
          ...(s.id ? { id: s.id } : {}),
          name: s.name,
          description: s.description || null,
          start_date: toApiDateTime(s.start_date),
          end_date: toApiDateTime(s.end_date),
          venue: s.venue || null,
          area_id: s.area_id || null,
          max_capacity: s.max_capacity || 0,
          cost: s.cost || 0,
          // ns_item_id se envía solo si el subevento tiene costo; si es 0 se limpia.
          ns_item_id: (s.cost && Number(s.cost) > 0) ? (s.ns_item_id ?? null) : null,
          // sale_type_id: override del sale_type del evento padre. Se conserva
          // aunque el subevento no tenga costo (clasifica la SO en NS).
          sale_type_id: s.sale_type_id ?? null,
          // access_type (deprecated): primer elemento del array múltiple.
          access_type: at[0] ?? null,
          // access_types[] (fuente de verdad, mapa 15 §8).
          access_types: at,
          instructor_name:  s.instructor_name  || null,
          instructor_phone: s.instructor_phone || null,
          instructor_email: s.instructor_email || null,
          instructor_notes: s.instructor_notes || null,
          status: s.status,
          // Matriz de precios del subevento: se envía cuando el subevento tiene
          // has_matrix_pricing = true. Cada fila lleva `access_type` + `cost` y
          // significa "el subevento está habilitado para ese tipo" (opción C).
          has_matrix_pricing: !!s.has_matrix_pricing,
          institutional_event_prices: (s.has_matrix_pricing && Array.isArray(s.institutional_event_prices))
            ? (s.institutional_event_prices as any[]).map(p => ({
                ...(p.id ? { id: p.id } : {}),
                access_type: p.access_type,
                cost: Number(p.cost) || 0,
              }))
            : [],
        };
      }),
    };
  }

  /**
   * Guarda silenciosamente el borrador al navegar entre pasos o al previsualizar.
   * - En modo edición: siempre intenta el PATCH (el evento ya existe).
   * - En modo creación: solo si los campos mínimos del backend están completos.
   * Los errores se ignoran (no interrumpe la navegación).
   */
  async saveDraft(): Promise<void> {
    const identity = this.identityGroup.value as any;
    const datetime = this.datetimeGroup.value;
    const access   = this.accessGroup.value;

    const isEdit = this.eventId() !== null;
    const hasBanner = !!(this.heroGroup.get('banner_mobile_url')?.value || this.pendingImageUploads.has('hero_mobile'));
    const hasMinimum = identity.name?.trim()
      && identity.event_type
      && (identity.location_id || identity.place_id)
      && datetime.start_date
      && access.access_types?.length
      && hasBanner;

    if (!isEdit && !hasMinimum) return; // create sin mínimos → no intentar

    this.saving.set(true);
    try {
      const payload = this.buildPayload();
      const res = isEdit
        ? await firstValueFrom(this.svc.update(this.eventId()!, payload))
        : await firstValueFrom(this.svc.create(payload));
      this.eventId.set(res.data.event.id);
      
      await this.flushImageUploads();
      
      // Limpiar cualquier error previo al guardar bien
      this.loadError.set(null);
      this.root.markAsPristine();
      this.unsavedChanges.set(false);
    } catch {
      // Auto-save silencioso: ignorar errores del servidor
    } finally {
      this.saving.set(false);
    }
  }

  /** Devuelve los campos requeridos que faltan (array vacío = todo OK). */
  validarCampos(): string[] {
    const identity = this.identityGroup.value as any;
    const datetime = this.datetimeGroup.value;
    const access   = this.accessGroup.value;
    const missing: string[] = [];
    if (!identity.location_id && !identity.place_id) missing.push('Sede o Lugar del evento');
    if (!identity.name?.trim())         missing.push('Nombre del evento');
    if (!identity.event_type)           missing.push('Tipo de evento');
    if (!identity.area_id)              missing.push('Área');
    if (!datetime.start_date)           missing.push('Fecha de inicio');
    if (!access.access_types?.length)   missing.push('Tipo de acceso');
    if (access.has_cost && !access.ns_item_id) {
      missing.push('Servicio de NetSuite (tipo de servicio del costo)');
    }
    // Matriz de precios obligatoria cuando has_cost=true (mapa 15 §7.9).
    if (access.has_cost) {
      const tipos: AccessType[] = access.access_types ?? [];
      const filas: any[] = access.matrix_prices ?? [];
      const faltantes = tipos.filter(t => !filas.some(f => f.access_type === t));
      if (faltantes.length > 0) {
        missing.push('Precios por tipo de acceso (faltan filas)');
      }
      const alguna = filas.some(f => Number(f.cost) > 0);
      if (!alguna) {
        missing.push('Al menos un precio por tipo debe ser mayor a 0');
      }
    }
    const hasBanner = !!(this.heroGroup.get('banner_mobile_url')?.value || this.pendingImageUploads.has('hero_mobile'));
    if (!hasBanner)                     missing.push('Banner Mobile');
    return missing;
  }

  /**
   * Marca todos los controles como tocados para que Angular muestre validación
   * visual (ng-invalid ng-touched) y actualiza el signal `camposInvalidos`.
   */
  marcarTocados(): void {
    this.identityGroup.markAllAsTouched();
    this.datetimeGroup.markAllAsTouched();
    this.accessGroup.markAllAsTouched();
    this.camposInvalidos.set(this.validarCampos());
  }

  /** Limpia el estado de validación visual. */
  limpiarValidacion(): void {
    this.camposInvalidos.set([]);
  }

  async save(): Promise<InstitutionalEvent | null> {
    const missing = this.validarCampos();
    if (missing.length) {
      this.loadError.set('Campos requeridos sin completar: ' + missing.join(', ') + '.');
      return null;
    }

    this.saving.set(true);
    this.loadError.set(null);
    try {
      const payload = this.buildPayload();
      const res = this.eventId() === null
        ? await firstValueFrom(this.svc.create(payload))
        : await firstValueFrom(this.svc.update(this.eventId()!, payload));
      this.eventId.set(res.data.event.id);

      await this.flushImageUploads();

      this.root.markAsPristine();
      this.unsavedChanges.set(false);

      return res.data.event;
    } catch (err: any) {
      const apiMsg: string = err?.error?.message ?? '';
      const apiErrors = err?.error?.error;
      if (apiErrors && typeof apiErrors === 'object') {
        const fields = Object.keys(apiErrors).join(', ');
        this.loadError.set(`Error del servidor (${err?.status ?? 422}): campos inválidos → ${fields}.`);
      } else {
        this.loadError.set(apiMsg || 'No se pudo guardar el evento. Revisa los campos obligatorios.');
      }
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  private async flushImageUploads(): Promise<void> {
    if (this.pendingImageUploads.size === 0) return;
    
    const urlMap = await this.uploadPendingImages(this.eventId()!);
    if (Object.keys(urlMap).length > 0) {
      if (urlMap['hero_desktop']) this.heroGroup.get('banner_image_url')?.setValue(urlMap['hero_desktop']);
      if (urlMap['hero_mobile']) this.heroGroup.get('banner_mobile_url')?.setValue(urlMap['hero_mobile']);
      if (urlMap['cover'])  this.heroGroup.get('cover_image_url')?.setValue(urlMap['cover']);

      const allies = [...(this.heroGroup.get('allies')?.value || [])];
      let alliesChanged = false;
      for (const key of Object.keys(urlMap)) {
        if (key.startsWith('ally_')) {
          const allyId = key.replace('ally_', '');
          const ally = allies.find(a => a.id === allyId);
          if (ally) {
            ally.logo_url = urlMap[key];
            alliesChanged = true;
          }
        }
      }
      if (alliesChanged) this.heroGroup.get('allies')?.setValue(allies);

      Object.keys(urlMap).filter(k => k.startsWith('post_gallery_')).forEach(k => {
        const url = urlMap[k];
        const item = this.postGalleryArray.controls.find(c => c.value.url === k);
        if (item) item.get('url')?.setValue(url);
      });

      // Segundo PATCH para persistir las URLs reales en la BD
      await firstValueFrom(this.svc.update(this.eventId()!, this.buildPayload()));
    }
  }

  /** Sube al backend todos los archivos en pendingImageUploads y devuelve un mapa type→url. */
  private async uploadPendingImages(eventId: number): Promise<Record<string, string>> {
    const urlMap: Record<string, string> = {};
    for (const [type, file] of this.pendingImageUploads) {
      try {
        const backendType = type.startsWith('post_gallery_') ? 'post_gallery' : type.startsWith('ally_') ? 'ally' : type;
        const res = await firstValueFrom(this.svc.uploadImage(eventId, backendType, file));
        if (res?.url) urlMap[type] = res.url;
      } catch (err) {
        console.error(`uploadPendingImages: error al subir "${type}"`, err);
      }
    }
    this.pendingImageUploads.clear();
    return urlMap;
  }

  async publish(): Promise<boolean> {
    if (this.eventId() === null) return false;
    this.saving.set(true);
    try {
      await firstValueFrom(this.svc.publish(this.eventId()!));
      this.eventStatus.set('published');
      return true;
    } catch (err: any) {
      const msg: string = err?.error?.message ?? 'El evento se guardó, pero no se pudo publicar.';
      this.loadError.set(msg);
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /** Reinicia el formulario a su estado vacío inicial (modo creación). */
  reset(): void {
    this.isPatching = true;
    this.eventId.set(null);
    this.maxStepReached.set(1);
    this.eventStatus.set('draft');
    this.currentStep.set(1);
    this.loadError.set(null);
    this.identityGroup.reset({ name: '', kicker: '', event_type: '', area_id: null, location_id: null, description: '' });
    this.datetimeGroup.reset({ start_date: '', end_date: '', all_day: false, venue: '', event_modality: 'presencial', stream_url: '', doors_open_time: '' });
    this.accessGroup.reset({ access_types: [], has_registration: true, max_capacity: null, has_cost: false, cost: null });
    this.heroGroup.reset({ banner_image_url: '', banner_mobile_url: '', cover_image_url: '', allies_header: 'Sponsors', allies: [] });
    this.faqContactGroup.reset({ contact_email: '', contact_phone: '', contact_person: '', contact_schedule: '', maps_url: '', social_facebook: '', social_instagram: '', social_twitter: '', social_tiktok: '' });
    this.subeventsArray.clear();
    this.documentsArray.clear();
    this.speakersArray.clear();
    this.testimonialsArray.clear();
    this.faqsArray.clear();
    this.indicatorsArray.clear();
    this.postGalleryArray.clear();
    this.postMetricsArray.clear();
    this.postEventGroup.get('summary')?.setValue('');
    setTimeout(() => {
      this.isPatching = false;
      this.unsavedChanges.set(false);
      this.root.markAsPristine();
    }, 500);
  }
}
