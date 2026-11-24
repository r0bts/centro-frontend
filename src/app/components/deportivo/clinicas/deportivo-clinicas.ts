import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import { environment } from '../../../../environments/environment';
import {
  ClinicItem,
  ClinicActividad,
  ClinicInstructor,
  ClinicLocation,
  ClinicArea,
  ClinicSubstitutionItem,
  ClinicEnrollmentItem,
  ClinicCouponItem
} from './clinica.model';

import { ClinicInscribirWizardComponent } from './inscribir-wizard/clinic-inscribir-wizard';

@Component({
  selector: 'app-deportivo-clinicas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, ClinicInscribirWizardComponent],
  templateUrl: './deportivo-clinicas.html',
  styleUrls: ['./deportivo-clinicas.scss']
})
export class DeportivoClinicasComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private apiUrl = `${environment.apiUrl}/deportivo/clinicas`;

  // ── Signals de Estado ──────────────────────────────────────────────────────
  clinics = signal<ClinicItem[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // ── Catálogos para Formularios y Filtros ───────────────────────────────────
  actividades = signal<ClinicActividad[]>([]);
  profesores = signal<ClinicInstructor[]>([]);
  locations = signal<ClinicLocation[]>([]);
  areas = signal<ClinicArea[]>([]);

  // ── Filtros ───────────────────────────────────────────────────────────────
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  selectedActivity = signal<string>('');
  selectedLocation = signal<string>('');

  // ── Navegación de Subvistas SPA (Listado, Inscritos, Check-in QR) ──────────
  currentView = signal<'listado' | 'inscritos' | 'checkin'>('listado');

  // ── Modales / Formularios de Clínica & Sustitución ──────────────────────────
  showFormModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedClinic = signal<ClinicItem | null>(null);
  isOngoingSelected = signal<boolean>(false);

  showSubstitutionModal = signal<boolean>(false);
  substitutionsList = signal<ClinicSubstitutionItem[]>([]);
  isLoadingSubstitutions = signal<boolean>(false);

  // ── Modales / Estado de Inscripciones ───────────────────────────────────────
  showEnrollmentsModal = signal<boolean>(false);
  enrollmentsList = signal<ClinicEnrollmentItem[]>([]);
  isLoadingEnrollments = signal<boolean>(false);

  showAddStudentModal = signal<boolean>(false);
  isSearchingSocio = signal<boolean>(false);
  isSavingEnrollment = signal<boolean>(false);
  searchSocioQuery = '';
  searchedSocios = signal<any[]>([]);
  selectedStudentPayload: any = null;
  studentEmail = '';
  studentPhone = '';
  paymentMethod = 'karlo_pay';
  couponCode = '';
  sendPaymentLink = true;

  // ── Modales / Estado de Cupones de Excepción (Sobrecupo QR) ─────────────────
  showCouponModal = signal<boolean>(false);
  isSavingCoupon = signal<boolean>(false);
  couponStudentName = '';
  couponSocioId: number | null = null;
  couponTargetClinicId: number | null = null;
  couponReason = '';
  couponSelectedDates = signal<string[]>([]);
  calendarDays = signal<{ day: number; dateStr: string; isAvailable: boolean; isCurrentMonth: boolean }[]>([]);
  calendarMonthLabel = signal<string>('');

  // ── Modal de Código QR ─────────────────────────────────────────────────────
  showQrModal = signal<boolean>(false);
  qrData = signal<{ qrUrl: string; token: string; title: string; subtitle: string } | null>(null);

  // ── Modal y Estado de Renovación de Clínica (RN-11, RN-12) ───────────────────
  showRenewModal = signal<boolean>(false);
  isRenewing = signal<boolean>(false);
  clinicToRenew = signal<ClinicItem | null>(null);
  cyclesList = signal<any[]>([]);
  selectedEnrollmentCycle = signal<string>('current');

  renewForm: FormGroup = this.fb.group({
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0)]],
    max_capacity: ['', [Validators.required, Validators.min(1)]],
    status: ['upcoming', Validators.required]
  });

  // ── Días de la semana para Selector Interactivo ───────────────────────────
  readonly availableWeekDays = [
    { key: 'LUN', label: 'Lun', full: 'Lunes', initial: 'L' },
    { key: 'MAR', label: 'Mar', full: 'Martes', initial: 'M' },
    { key: 'MIE', label: 'Mié', full: 'Miércoles', initial: 'M' },
    { key: 'JUE', label: 'Jue', full: 'Jueves', initial: 'J' },
    { key: 'VIE', label: 'Vie', full: 'Viernes', initial: 'V' },
    { key: 'SAB', label: 'Sáb', full: 'Sábado', initial: 'S' },
    { key: 'DOM', label: 'Dom', full: 'Domingo', initial: 'D' },
  ];
  selectedWeekDays = signal<string[]>(['LUN', 'MAR', 'MIE', 'JUE']);

  // Formulario de Creación / Edición de Clínica
  clinicForm: FormGroup = this.fb.group({
    activity_id: ['', Validators.required],
    instructor_id: ['', Validators.required],
    location_id: ['', Validators.required],
    area_id: ['', Validators.required],
    sale_type_id: [1],
    ns_item_id: [3345],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    venue_details: [''],
    days_of_week: [''],
    start_time: [''],
    end_time: [''],
    duration_minutes: [60],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    max_capacity: [16, [Validators.required, Validators.min(1)]],
    price: [1500, [Validators.required, Validators.min(0)]],
    status: ['upcoming', Validators.required]
  });

  // Formulario de Sustitución Temporal (Modal dedicado / Historial)
  substitutionForm: FormGroup = this.fb.group({
    substitute_instructor_id: [''],
    substitute_area_id: [''],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(255)]]
  });

  // ── KPIs Calculados Dinámicamente ─────────────────────────────────────────
  kpis = computed(() => {
    const all = this.clinics();
    return {
      total: all.length,
      enCurso: all.filter(c => c.status === 'ongoing').length,
      proximas: all.filter(c => c.status === 'upcoming').length,
      totalCupo: all.reduce((sum, c) => sum + (c.max_capacity || 0), 0)
    };
  });

  // KPIs de la vista de Inscritos
  inscritosKpis = computed(() => {
    const list = this.enrollmentsList();
    const clinic = this.selectedClinic();
    const max = clinic?.max_capacity || 0;
    const totalRecaudado = list
      .filter(e => e.status === 'paid' || e.payment_status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount_paid || 0), 0);
    const totalCupones = list.filter(e => !!e.coupon_code).length;

    return {
      total: list.length,
      capacidad: max,
      recaudacion: totalRecaudado,
      cupones: totalCupones
    };
  });

  // ── Lista Filtrada ─────────────────────────────────────────────────────────
  filteredClinics = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const st = this.selectedStatus();
    const act = this.selectedActivity();
    const loc = this.selectedLocation();

    return this.clinics().filter(c => {
      const matchSearch = !term ||
        c.name.toLowerCase().includes(term) ||
        (c.instructor && `${c.instructor.first_name} ${c.instructor.last_name}`.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term));

      const matchStatus = !st || c.status === st;
      const matchAct = !act || c.activity_id === Number(act);
      const matchLoc = !loc || c.location_id === Number(loc);

      return matchSearch && matchStatus && matchAct && matchLoc;
    });
  });

  ngOnInit(): void {
    this.setupDateListeners();
    this.loadCatalogs();
    this.loadClinics();
  }

  // Sincroniza automáticamente la fecha fin cuando se selecciona o cambia la fecha inicio
  private setupDateListeners(): void {
    this.clinicForm.get('start_date')?.valueChanges.subscribe((startDateVal: string) => {
      if (!startDateVal) return;
      const endDateControl = this.clinicForm.get('end_date');
      const currentEndDate = endDateControl?.value;

      // Si la fecha fin está vacía o es anterior a la fecha de inicio seleccionada, inicializarla a la misma fecha
      if (!currentEndDate || currentEndDate < startDateVal) {
        endDateControl?.setValue(startDateVal, { emitEvent: false });
      }
    });

    // Lo mismo para el modal de sustitución
    this.substitutionForm.get('start_date')?.valueChanges.subscribe((startDateVal: string) => {
      if (!startDateVal) return;
      const endDateControl = this.substitutionForm.get('end_date');
      const currentEndDate = endDateControl?.value;

      if (!currentEndDate || currentEndDate < startDateVal) {
        endDateControl?.setValue(startDateVal, { emitEvent: false });
      }
    });

    // Auto-cálculo de duración en minutos entre start_time y end_time
    const calcDuration = () => {
      const st = this.clinicForm.get('start_time')?.value;
      const et = this.clinicForm.get('end_time')?.value;
      if (st && et) {
        const [sh, sm] = st.split(':').map(Number);
        const [eh, em] = et.split(':').map(Number);
        const startMins = sh * 60 + (sm || 0);
        const endMins = eh * 60 + (em || 0);
        if (endMins > startMins) {
          this.clinicForm.get('duration_minutes')?.setValue(endMins - startMins, { emitEvent: false });
        }
      }
    };
    this.clinicForm.get('start_time')?.valueChanges.subscribe(() => calcDuration());
    this.clinicForm.get('end_time')?.valueChanges.subscribe(() => calcDuration());
  }

  // ── Cargar Catálogos para Selects ──────────────────────────────────────────
  loadCatalogs(): void {
    // Actividades (Disciplinas)
    this.http.get<{ success: boolean; data: { actividades: any[] } }>(`${environment.apiUrl}/deportivo/actividades`).subscribe({
      next: (res) => {
        if (res.success && res.data?.actividades) {
          this.actividades.set(res.data.actividades.map(a => ({
            id: a.id,
            nombre: a.nombre,
            icono: a.icono,
            color: a.color
          })));
        }
      },
      error: () => {}
    });

    // Profesores / Instructores (usando el catálogo activo de usuarios/entrenadores)
    this.http.get<{ success: boolean; data: { users?: any[]; profesores?: any[] } }>(`${environment.apiUrl}/deportivo/profesores/form-data`).subscribe({
      next: (res) => {
        const users = res.data?.users || res.data?.profesores || [];
        if (users.length > 0) {
          this.profesores.set(users.map(u => ({
            id: u.id,
            nombre: u.nombre || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            specialty: u.specialty
          })));
        }
      },
      error: () => {
        // Fallback al endpoint clásico en caso de error
        this.http.get<{ success: boolean; data: { profesores: any[] } }>(`${environment.apiUrl}/deportivo/profesores`).subscribe({
          next: (res) => {
            if (res.success && res.data?.profesores) {
              this.profesores.set(res.data.profesores.map(p => ({
                id: p.id,
                nombre: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                first_name: p.first_name,
                last_name: p.last_name,
                email: p.email,
                specialty: p.specialty
              })));
            }
          }
        });
      }
    });

    // Sedes (Filtradas exclusivamente a las sedes válidas para eventos/clínicas: HERMES y GLACIAR)
    const SEDES_VALIDAS = ['HERMES', 'GLACIAR'];
    this.http.get<{ success: boolean; data: { locations: any[] } }>(`${environment.apiUrl}/locations`).subscribe({
      next: (res) => {
        if (res.success && res.data?.locations) {
          const activos = res.data.locations.filter(l => l.is_active !== false && !l.is_inactive);
          const sedes = activos.filter(l => SEDES_VALIDAS.includes(String(l.name).toUpperCase()));
          const lista = sedes.length > 0 ? sedes : activos;
          this.locations.set(lista.map(l => ({
            id: Number(l.id),
            name: l.name
          })));
        }
      },
      error: () => {}
    });

    // Áreas
    this.http.get<{ success: boolean; data: { areas: any[] } }>(`${environment.apiUrl}/areas`).subscribe({
      next: (res) => {
        if (res.success && res.data?.areas) {
          this.areas.set(res.data.areas.map(a => ({
            id: Number(a.id),
            name: a.name
          })));
        }
      },
      error: () => {}
    });
  }

  // ── Cargar Clínicas ────────────────────────────────────────────────────────
  loadClinics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<{ success: boolean; data: ClinicItem[] }>(this.apiUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.clinics.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar clínicas:', err);
        this.errorMessage.set('No se pudo conectar con el servidor para cargar las clínicas.');
        this.isLoading.set(false);
      }
    });
  }

  // ── Helper: Obtener Sustitución Activa de una Clínica ────────────────────
  getActiveSubstitution(clinic: ClinicItem): ClinicSubstitutionItem | null {
    if (!clinic.clinic_substitutions || clinic.clinic_substitutions.length === 0) {
      return null;
    }
    const today = new Date().toISOString().substring(0, 10);
    return clinic.clinic_substitutions.find(s => 
      s.status === 'active' &&
      (!s.start_date || s.start_date <= today) &&
      (!s.end_date || s.end_date >= today)
    ) || clinic.clinic_substitutions[0] || null;
  }

  // ── CRUD: Abrir Modal Nueva Clínica ────────────────────────────────────────
  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedClinic.set(null);
    this.isOngoingSelected.set(false);

    // Asegurar que los controles estén habilitados
    this.clinicForm.get('location_id')?.enable();
    this.clinicForm.get('area_id')?.enable();
    this.clinicForm.get('instructor_id')?.enable();
    this.clinicForm.get('activity_id')?.enable();

    this.clinicForm.reset({
      activity_id: '',
      instructor_id: '',
      location_id: 1, // Default HERMES
      area_id: '',
      sale_type_id: 1,
      ns_item_id: 3345,
      name: '',
      description: '',
      venue_details: '',
      days_of_week: 'Lunes a Jueves',
      start_time: '16:00',
      end_time: '17:00',
      duration_minutes: 60,
      start_date: new Date().toISOString().substring(0, 10),
      end_date: '',
      max_capacity: 16,
      price: 1500,
      status: 'upcoming'
    });
    this.selectedWeekDays.set(['LUN', 'MAR', 'MIE', 'JUE']);
    this.syncDaysOfWeekControl();
    this.showFormModal.set(true);
  }

  // ── Helpers de Selección de Días (UX/UI) ──────────────────────────────────
  toggleWeekDay(dayKey: string): void {
    const current = [...this.selectedWeekDays()];
    const idx = current.indexOf(dayKey);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(dayKey);
    }
    // Ordenar de acuerdo al orden natural de la semana (LUN..DOM)
    const sorted = this.availableWeekDays
      .map(d => d.key)
      .filter(k => current.includes(k));
    this.selectedWeekDays.set(sorted);
    this.syncDaysOfWeekControl();
  }

  isWeekDaySelected(dayKey: string): boolean {
    return this.selectedWeekDays().includes(dayKey);
  }

  private syncDaysOfWeekControl(): void {
    const selected = this.selectedWeekDays();
    if (selected.length === 0) {
      this.clinicForm.get('days_of_week')?.setValue('');
      return;
    }
    // Si coincide con presets comunes, usar el texto legible
    if (selected.length === 4 && selected.join(',') === 'LUN,MAR,MIE,JUE') {
      this.clinicForm.get('days_of_week')?.setValue('Lunes a Jueves');
    } else if (selected.length === 5 && selected.join(',') === 'LUN,MAR,MIE,JUE,VIE') {
      this.clinicForm.get('days_of_week')?.setValue('Lunes a Viernes');
    } else if (selected.length === 2 && selected.join(',') === 'SAB,DOM') {
      this.clinicForm.get('days_of_week')?.setValue('Sábados y Domingos');
    } else if (selected.length === 7) {
      this.clinicForm.get('days_of_week')?.setValue('Toda la semana');
    } else {
      const labels = selected.map(k => this.availableWeekDays.find(d => d.key === k)?.label || k);
      this.clinicForm.get('days_of_week')?.setValue(labels.join(', '));
    }
  }

  private parseDaysFromText(text: string): string[] {
    if (!text) return ['LUN', 'MAR', 'MIE', 'JUE'];
    const lower = text.toLowerCase();
    if (lower.includes('lunes a jueves')) return ['LUN', 'MAR', 'MIE', 'JUE'];
    if (lower.includes('lunes a viernes')) return ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'];
    if (lower.includes('sab') && lower.includes('dom')) return ['SAB', 'DOM'];
    if (lower.includes('toda')) return this.availableWeekDays.map(d => d.key);

    const result: string[] = [];
    if (lower.includes('lun')) result.push('LUN');
    if (lower.includes('mar')) result.push('MAR');
    if (lower.includes('mie') || lower.includes('mié')) result.push('MIE');
    if (lower.includes('jue')) result.push('JUE');
    if (lower.includes('vie')) result.push('VIE');
    if (lower.includes('sab') || lower.includes('sáb')) result.push('SAB');
    if (lower.includes('dom')) result.push('DOM');
    return result.length > 0 ? result : ['LUN', 'MAR', 'MIE', 'JUE'];
  }

  // ── CRUD: Abrir Modal Ver / Editar Clínica ─────────────────────────────────
  openEditModal(clinic: ClinicItem): void {
    this.isEditing.set(true);
    this.selectedClinic.set(clinic);

    // Parsear días para el selector de píldoras
    const daysArr = this.parseDaysFromText(clinic.days_of_week || '');
    this.selectedWeekDays.set(daysArr);

    // RN: Si la clínica está en curso ('ongoing') o su fecha de inicio ya pasó, se bloquea toda edición (modo solo lectura / ver)
    const today = new Date().toISOString().substring(0, 10);
    const isOngoing = clinic.status === 'ongoing' || (clinic.start_date <= today && clinic.end_date >= today);
    this.isOngoingSelected.set(isOngoing);

    // Convertir el precio numérico para que se muestre limpio sin coma ni ceros raros
    const cleanPrice = clinic.price ? Number(clinic.price) : 0;

    this.clinicForm.patchValue({
      activity_id: clinic.activity_id,
      instructor_id: clinic.instructor_id,
      location_id: clinic.location_id,
      area_id: clinic.area_id,
      sale_type_id: clinic.sale_type_id || 1,
      ns_item_id: clinic.ns_item_id || 3345,
      name: clinic.name,
      description: clinic.description || '',
      venue_details: clinic.venue_details || '',
      days_of_week: clinic.days_of_week || '',
      start_time: clinic.start_time || '',
      end_time: clinic.end_time || '',
      duration_minutes: clinic.duration_minutes || 60,
      start_date: clinic.start_date,
      end_date: clinic.end_date,
      max_capacity: clinic.max_capacity,
      price: cleanPrice,
      status: clinic.status
    });

    if (isOngoing) {
      // Bloquear los campos base de programación (sede, área, profesor, fechas, cupo, precio)
      this.clinicForm.disable();
      // Pero permitir cambiar el Estado Operativo (ej. para marcar como 'completed' o 'cancelled')
      this.clinicForm.get('status')?.enable();
    } else {
      this.clinicForm.enable();
    }

    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  // ── CRUD: Guardar Clínica (Create o Update) ────────────────────────────────
  saveClinic(): void {
    if (this.clinicForm.invalid) {
      this.clinicForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    // getRawValue() incluye campos deshabilitados (location_id, area_id, instructor_id)
    const formVal = this.clinicForm.getRawValue();

    if (this.isEditing() && this.selectedClinic()) {
      const clinicId = this.selectedClinic()!.id;
      this.http.put<{ success: boolean; message: string; data: ClinicItem }>(`${this.apiUrl}/${clinicId}`, formVal).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.showFormModal.set(false);
          this.triggerSuccess('Clínica actualizada exitosamente');
          this.loadClinics();
        },
        error: (err) => {
          this.isSaving.set(false);
          alert(err.error?.message || 'Error al actualizar la clínica');
        }
      });
    } else {
      this.http.post<{ success: boolean; message: string; data: ClinicItem }>(this.apiUrl, formVal).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.showFormModal.set(false);
          this.triggerSuccess('Clínica creada exitosamente');
          this.loadClinics();
        },
        error: (err) => {
          this.isSaving.set(false);
          alert(err.error?.message || 'Error al crear la clínica');
        }
      });
    }
  }

  // ── CRUD: Eliminar Clínica (Soft Delete) ───────────────────────────────────
  deleteClinic(clinic: ClinicItem): void {
    if (!confirm(`¿Estás seguro de eliminar la clínica "${clinic.name}"? Esta acción retirará la clínica de la cartelera activa.`)) {
      return;
    }

    this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${clinic.id}`).subscribe({
      next: () => {
        this.triggerSuccess('Clínica eliminada correctamente');
        this.loadClinics();
      },
      error: (err) => {
        alert(err.error?.message || 'No fue posible eliminar la clínica');
      }
    });
  }

  // Pestaña activa en Modal Operativo (bi-person-fill-gear): 'sustitucion' | 'renovacion'
  activeOperationalTab = signal<'sustitucion' | 'renovacion'>('sustitucion');

  // ── SUSTITUCIONES Y GESTIÓN OPERATIVA: Abrir Modal y Listar ────────────────
  openSubstitutionModal(clinic: ClinicItem, defaultTab: 'sustitucion' | 'renovacion' = 'sustitucion'): void {
    this.selectedClinic.set(clinic);
    this.activeOperationalTab.set(defaultTab);
    this.substitutionForm.reset({
      substitute_instructor_id: '',
      substitute_area_id: '',
      start_date: clinic.start_date,
      end_date: clinic.end_date,
      reason: ''
    });

    this.initRenewForm(clinic);
    this.showSubstitutionModal.set(true);
    this.loadSubstitutions(clinic.id);
    this.loadCycles(clinic.id);
  }

  initRenewForm(clinic: ClinicItem): void {
    this.clinicToRenew.set(clinic);

    // Calcular fechas sugeridas: siguiente mes a partir de su end_date
    let suggestedStart = '';
    let suggestedEnd = '';
    if (clinic.end_date) {
      const parts = clinic.end_date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const mStr = nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
        suggestedStart = `${nextYear}-${mStr}-01`;
        const lastDay = new Date(nextYear, nextMonth, 0).getDate();
        suggestedEnd = `${nextYear}-${mStr}-${lastDay < 10 ? '0' + lastDay : lastDay}`;
      }
    }

    this.renewForm.patchValue({
      start_date: suggestedStart,
      end_date: suggestedEnd,
      price: clinic.price,
      max_capacity: clinic.max_capacity,
      status: 'upcoming'
    });
  }

  closeSubstitutionModal(): void {
    this.showSubstitutionModal.set(false);
  }

  loadSubstitutions(clinicId: number): void {
    this.isLoadingSubstitutions.set(true);
    this.http.get<{ success: boolean; data: ClinicSubstitutionItem[] }>(`${this.apiUrl}/${clinicId}/sustituciones`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.substitutionsList.set(res.data);
        }
        this.isLoadingSubstitutions.set(false);
      },
      error: () => {
        this.isLoadingSubstitutions.set(false);
      }
    });
  }

  // ── SUSTITUCIONES: Registrar Suplencia de Instructor o Área ────────────────
  saveSubstitution(): void {
    if (this.substitutionForm.invalid) {
      this.substitutionForm.markAllAsTouched();
      return;
    }

    const formVal = this.substitutionForm.value;
    if (!formVal.substitute_instructor_id && !formVal.substitute_area_id) {
      alert('Debes seleccionar al menos un profesor sustituto o un área física de sustitución.');
      return;
    }

    const clinicId = this.selectedClinic()!.id;
    this.isSaving.set(true);

    this.http.post<{ success: boolean; message: string; data: ClinicSubstitutionItem }>(`${this.apiUrl}/${clinicId}/sustituciones`, formVal).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.triggerSuccess('Sustitución registrada y notificaciones preparadas');
        this.substitutionForm.reset({
          substitute_instructor_id: '',
          substitute_area_id: '',
          start_date: this.selectedClinic()!.start_date,
          end_date: this.selectedClinic()!.end_date,
          reason: ''
        });
        this.loadSubstitutions(clinicId);
        this.loadClinics();
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(err.error?.message || 'Error al guardar la sustitución');
      }
    });
  }

  // ── SUSTITUCIONES: Cancelar Sustitución Activa ──────────────────────────────
  cancelSubstitution(sub: ClinicSubstitutionItem): void {
    if (!confirm('¿Deseas cancelar anticipadamente esta sustitución?')) {
      return;
    }

    this.http.patch<{ success: boolean }>(`${this.apiUrl}/sustituciones/${sub.id}/cancel`, {}).subscribe({
      next: () => {
        this.triggerSuccess('Sustitución cancelada correctamente');
        if (this.selectedClinic()) {
          this.loadSubstitutions(this.selectedClinic()!.id);
        }
        this.loadClinics();
      },
      error: () => {
        alert('No fue posible cancelar la sustitución');
      }
    });
  }

  // ── Helpers Visuales y UX ──────────────────────────────────────────────────
  private triggerSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 4000);
  }

  private triggerError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => this.errorMessage.set(null), 5000);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ongoing':   return 'bg-success-subtle text-success border-success-subtle';
      case 'upcoming':  return 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
      case 'completed': return 'bg-secondary-subtle text-secondary border-secondary-subtle';
      case 'cancelled': return 'bg-danger-subtle text-danger border-danger-subtle';
      default:          return 'bg-light text-muted border';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ongoing':   return 'En Curso';
      case 'upcoming':  return 'Próxima';
      case 'completed': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default:          return 'Borrador';
    }
  }

  getActivityIcon(name?: string): string {
    if (!name) return 'bi-award-fill';
    const n = name.toLowerCase();
    if (n.includes('tenis')) return 'bi-circle-fill';
    if (n.includes('natac')) return 'bi-water';
    if (n.includes('padel') || n.includes('pádel')) return 'bi-grid-fill';
    if (n.includes('fut')) return 'bi-dribbble';
    if (n.includes('baile') || n.includes('danza')) return 'bi-music-note-beamed';
    return 'bi-trophy-fill';
  }

  getActivityBg(name?: string): string {
    if (!name) return '#2563eb';
    const n = name.toLowerCase();
    if (n.includes('tenis')) return '#16a34a';
    if (n.includes('natac')) return '#0284c7';
    if (n.includes('padel') || n.includes('pádel')) return '#d97706';
    if (n.includes('danza')) return '#ec4899';
    return '#6366f1';
  }

  // ── Formateador de Precios (Evita números con decimales excesivos o mal representados) ─
  formatPrice(price: string | number | undefined | null): string {
    if (price === undefined || price === null || price === '') return '0.00';
    const num = Number(price);
    if (isNaN(num)) return String(price);
    return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN Y GESTIÓN DE VISTAS (LISTADO, INSCRITOS, CHECK-IN / ESCÁNER QR)
  // ═══════════════════════════════════════════════════════════════════════════

  irAListado(): void {
    this.currentView.set('listado');
    this.loadClinics();
  }

  irACheckin(clinic?: ClinicItem): void {
    if (clinic) {
      this.selectedClinic.set(clinic);
    }
    this.scanSimulationResult.set(null);
    this.currentView.set('checkin');
  }

  // Simulación y validación de Check-in en campo con QR
  scanSimulationResult = signal<{ type: 'ok' | 'pendiente' | 'invalido'; message: string; details?: any } | null>(null);

  simularEscaneoQR(tipo: 'ok' | 'pendiente' | 'invalido'): void {
    const clinic = this.selectedClinic();
    if (tipo === 'ok') {
      this.scanSimulationResult.set({
        type: 'ok',
        message: '¡Acceso Concedido!',
        details: {
          alumno: 'Socio Activo (Inscripción Verificada)',
          clinica: clinic?.name || 'Clínica Deportiva',
          estado: 'Pagado / Cupón Válido',
          codigo: 'CLINIC-TKT-VERIFIED-2026'
        }
      });
    } else if (tipo === 'pendiente') {
      this.scanSimulationResult.set({
        type: 'pendiente',
        message: 'Acceso Denegado: Pago Pendiente',
        details: {
          alumno: 'Socio con orden generada en NetSuite',
          clinica: clinic?.name || 'Clínica Deportiva',
          estado: 'Pendiente de Pago en Karlo Pay / Caja',
          codigo: 'CLINIC-TKT-PENDING'
        }
      });
    } else {
      this.scanSimulationResult.set({
        type: 'invalido',
        message: 'Código QR Inválido o No Perteneciente a esta Clínica',
        details: {
          error: 'No se encontró registro de inscripción asociado al token escaneado.'
        }
      });
    }
  }

  cerrarResultadoEscaneo(): void {
    this.scanSimulationResult.set(null);
  }

  // Compatibilidad con botones previos
  irAInscritos(clinic: ClinicItem): void {
    this.selectedClinic.set(clinic);
    this.currentView.set('inscritos');
    this.selectedEnrollmentCycle.set('current');
    this.loadEnrollments(clinic.id, 'current');
    this.loadCycles(clinic.id);
  }

  loadCycles(clinicId: number): void {
    this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/${clinicId}/cycles`)
      .subscribe({
        next: res => {
          if (res.success && res.data) {
            this.cyclesList.set(res.data);
          }
        },
        error: () => {}
      });
  }

  onEnrollmentCycleChange(cycleVal: string): void {
    this.selectedEnrollmentCycle.set(cycleVal);
    const clinic = this.selectedClinic();
    if (clinic) {
      this.loadEnrollments(clinic.id, cycleVal);
    }
  }

  loadEnrollments(clinicId: number, cycle: string = 'current'): void {
    this.isLoadingEnrollments.set(true);
    const cycleQuery = cycle ? `?cycle=${cycle}` : '';
    this.http.get<{ success: boolean; data: ClinicEnrollmentItem[] }>(`${this.apiUrl}/${clinicId}/inscripciones${cycleQuery}`)
      .subscribe({
        next: res => {
          this.isLoadingEnrollments.set(false);
          if (res.success && res.data) {
            this.enrollmentsList.set(res.data);
          }
        },
        error: err => {
          this.isLoadingEnrollments.set(false);
          this.triggerError('Error cargando la lista de inscritos: ' + (err.error?.message || err.message));
        }
      });
  }

  // ── Gestión de Renovación de Clínica (Unificada en Modal Operativo) ───────────
  openRenewModal(clinic: ClinicItem): void {
    this.openSubstitutionModal(clinic, 'renovacion');
  }

  closeRenewModal(): void {
    this.showRenewModal.set(false);
  }

  submitRenew(): void {
    if (this.renewForm.invalid) {
      this.renewForm.markAllAsTouched();
      return;
    }

    const clinic = this.clinicToRenew();
    if (!clinic) return;

    this.isRenewing.set(true);
    const payload = this.renewForm.value;

    this.http.post<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/${clinic.id}/renew`, payload)
      .subscribe({
        next: res => {
          this.isRenewing.set(false);
          if (res.success) {
            this.triggerSuccess(res.message || 'Clínica renovada exitosamente para el nuevo periodo');
            if (res.data) {
              this.selectedClinic.set(res.data);
              this.initRenewForm(res.data);
            }
            this.closeRenewModal();
            this.loadCycles(clinic.id);
            this.loadClinics();
          } else {
            this.triggerError(res.message || 'No fue posible renovar la clínica');
          }
        },
        error: err => {
          this.isRenewing.set(false);
          this.triggerError(err.error?.message || 'Error al renovar la clínica');
        }
      });
  }

  openAddStudentModal(): void {
    this.searchSocioQuery = '';
    this.searchedSocios.set([]);
    this.selectedStudentPayload = null;
    this.studentEmail = '';
    this.studentPhone = '';
    this.paymentMethod = 'karlo_pay';
    this.couponCode = '';
    this.sendPaymentLink = true;
    this.showAddStudentModal.set(true);
  }

  closeAddStudentModal(): void {
    this.showAddStudentModal.set(false);
  }

  searchSocios(): void {
    const q = this.searchSocioQuery.trim();
    if (q.length < 2) return;

    this.isSearchingSocio.set(true);
    this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/socios/buscar?q=${encodeURIComponent(q)}`)
      .subscribe({
        next: res => {
          this.isSearchingSocio.set(false);
          if (res.success && res.data) {
            this.searchedSocios.set(res.data);
          }
        },
        error: err => {
          this.isSearchingSocio.set(false);
          this.triggerError('Error buscando socios: ' + (err.error?.message || err.message));
        }
      });
  }

  selectSocio(socio: any): void {
    this.selectedStudentPayload = {
      socio_id: socio.id,
      full_name: socio.fullname,
      member_number: socio.entityid || socio.membership_id,
      titular_id: socio.titular_id || socio.id
    };
    this.studentEmail = socio.email || '';
    this.studentPhone = socio.phone || '';
  }

  selectFamilyMember(titularSocio: any, familyMember: any): void {
    this.selectedStudentPayload = {
      socio_id: familyMember.id,
      full_name: familyMember.fullname,
      member_number: familyMember.entityid,
      titular_id: titularSocio.titular_id || titularSocio.id
    };
    this.studentEmail = familyMember.email || titularSocio.email || '';
    this.studentPhone = familyMember.phone || titularSocio.phone || '';
  }

  submitEnrollment(): void {
    const clinic = this.selectedClinic();
    if (!clinic || !this.selectedStudentPayload) return;

    this.isSavingEnrollment.set(true);

    const payload = {
      students: [
        {
          socio_id: this.selectedStudentPayload.socio_id,
          full_name: this.selectedStudentPayload.full_name,
          member_number: this.selectedStudentPayload.member_number,
          coupon_code: this.couponCode ? this.couponCode.trim() : null
        }
      ],
      payment_method: this.paymentMethod,
      send_payment_link: this.sendPaymentLink,
      titular_id: this.selectedStudentPayload.titular_id,
      email: this.studentEmail,
      phone: this.studentPhone
    };

    this.http.post<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/${clinic.id}/inscribir`, payload)
      .subscribe({
        next: res => {
          this.isSavingEnrollment.set(false);
          if (res.success) {
            this.triggerSuccess(res.message || 'Inscripción realizada con éxito');
            this.closeAddStudentModal();
            this.loadEnrollments(clinic.id);
            this.loadClinics(); // refrescar contador de cupo
          } else {
            this.triggerError(res.message || 'No se pudo completar la inscripción');
          }
        },
        error: err => {
          this.isSavingEnrollment.set(false);
          this.triggerError(err.error?.message || 'Error al procesar inscripción');
        }
      });
  }

  cancelEnrollment(enr: ClinicEnrollmentItem): void {
    if (!confirm(`¿Estás seguro de cancelar la inscripción de ${enr.full_name}?`)) {
      return;
    }

    this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/inscripciones/${enr.id}/cancel`, {})
      .subscribe({
        next: res => {
          if (res.success) {
            this.triggerSuccess(res.message || 'Inscripción cancelada');
            if (this.selectedClinic()) {
              this.loadEnrollments(this.selectedClinic()!.id);
            }
            this.loadClinics();
          } else {
            this.triggerError(res.message || 'No se pudo cancelar');
          }
        },
        error: err => {
          this.triggerError(err.error?.message || 'Error al cancelar la inscripción');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALES DE CÓDIGO QR
  // ═══════════════════════════════════════════════════════════════════════════

  openClinicQrModal(clinic: ClinicItem): void {
    const qrContent = `CLINICA-${clinic.id}-${clinic.name}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
    this.qrData.set({
      qrUrl,
      token: `CLI-REF-${clinic.id}`,
      title: clinic.name,
      subtitle: `${clinic.location?.name || 'Sede'} · ${clinic.start_date} al ${clinic.end_date}`
    });
    this.showQrModal.set(true);
  }

  viewStudentQr(enr: ClinicEnrollmentItem): void {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(enr.qr_token)}`;
    this.qrData.set({
      qrUrl,
      token: enr.qr_token,
      title: enr.full_name,
      subtitle: `Inscripción a ${this.selectedClinic()?.name || 'Clínica Deportiva'}`
    });
    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
    this.qrData.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CUPONES DE EXCEPCIÓN / REASIGNACIÓN (SOBRECUPO QR)
  // ═══════════════════════════════════════════════════════════════════════════

  openCouponModal(enr?: ClinicEnrollmentItem): void {
    const clinic = this.selectedClinic();
    if (!clinic) return;

    this.couponStudentName = enr ? enr.full_name : '';
    this.couponSocioId = enr?.socio_id || null;
    this.couponTargetClinicId = clinic.id;
    this.couponReason = '';
    this.couponSelectedDates.set([]);

    this.buildCalendarForClinic(clinic);
    this.showCouponModal.set(true);
  }

  closeCouponModal(): void {
    this.showCouponModal.set(false);
  }

  private buildCalendarForClinic(clinic: ClinicItem): void {
    const start = new Date(clinic.start_date + 'T00:00:00');
    const year = start.getFullYear() || new Date().getFullYear();
    const month = start.getMonth() || new Date().getMonth();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.calendarMonthLabel.set(`${monthNames[month]} ${year}`);

    // Días del mes
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 es domingo
    // Ajustar a Lunes=0 ... Domingo=6
    const offset = (firstDayIndex + 6) % 7;

    const daysList: { day: number; dateStr: string; isAvailable: boolean; isCurrentMonth: boolean }[] = [];

    // Offset celdas vacías
    for (let i = 0; i < offset; i++) {
      daysList.push({ day: 0, dateStr: '', isAvailable: false, isCurrentMonth: false });
    }

    const cStartStr = clinic.start_date;
    const cEndStr = clinic.end_date;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayPad = d < 10 ? '0' + d : String(d);
      const mPad = (month + 1) < 10 ? '0' + (month + 1) : String(month + 1);
      const dateStr = `${year}-${mPad}-${dayPad}`;

      const isInside = dateStr >= cStartStr && dateStr <= cEndStr;
      daysList.push({
        day: d,
        dateStr: dateStr,
        isAvailable: isInside,
        isCurrentMonth: true
      });
    }

    this.calendarDays.set(daysList);

    // Preseleccionar por defecto la primera fecha de la clínica o hoy
    if (clinic.start_date) {
      this.couponSelectedDates.set([clinic.start_date]);
    }
  }

  toggleCouponDate(dateStr: string): void {
    if (!dateStr) return;
    const current = [...this.couponSelectedDates()];
    const idx = current.indexOf(dateStr);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(dateStr);
    }
    this.couponSelectedDates.set(current);
  }

  removeCouponDate(dateStr: string): void {
    const current = this.couponSelectedDates().filter(d => d !== dateStr);
    this.couponSelectedDates.set(current);
  }

  seleccionarSemanaCompleta(): void {
    const availables = this.calendarDays().filter(d => d.isAvailable && d.dateStr).map(d => d.dateStr);
    // Tomar los primeros 5 días hábiles disponibles
    const subset = availables.slice(0, 5);
    this.couponSelectedDates.set(subset);
  }

  limpiarDiasSeleccionados(): void {
    this.couponSelectedDates.set([]);
  }

  submitCoupon(): void {
    const clinic = this.selectedClinic();
    if (!clinic) return;

    if (!this.couponStudentName.trim()) {
      this.triggerError('Debes ingresar o seleccionar el nombre del alumno/socio');
      return;
    }

    if (!this.couponReason.trim()) {
      this.triggerError('Debes ingresar el motivo obligatorio de la excepción');
      return;
    }

    if (this.couponSelectedDates().length === 0) {
      this.triggerError('Debes seleccionar al menos un día en el calendario');
      return;
    }

    this.isSavingCoupon.set(true);

    const datesList = this.couponSelectedDates();
    const sortedDates = [...datesList].sort();
    const validUntil = sortedDates[sortedDates.length - 1];

    const payload = {
      source_clinic_id: clinic.id,
      target_clinic_id: this.couponTargetClinicId || clinic.id,
      socio_id: this.couponSocioId,
      student_name: this.couponStudentName.trim(),
      reason: `${this.couponReason.trim()} [Días autorizados: ${datesList.join(', ')}]`,
      validity_type: datesList.length === 1 ? 'single_session' : 'specific_dates',
      valid_until: validUntil
    };

    this.http.post<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/${clinic.id}/cupones`, payload)
      .subscribe({
        next: res => {
          this.isSavingCoupon.set(false);
          if (res.success) {
            this.triggerSuccess(res.message || 'Cupón de sobrecupo emitido con éxito');
            this.closeCouponModal();
            // Abrir el modal QR para mostrar el cupón generado
            if (res.data) {
              this.qrData.set({
                qrUrl: res.data.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(res.data.coupon_code)}`,
                token: res.data.coupon_code,
                title: `Cupón Sobrecupo: ${res.data.student_name}`,
                subtitle: `Autorizado en ${clinic.name} · Días: ${datesList.join(', ')}`
              });
              this.showQrModal.set(true);
            }
          } else {
            this.triggerError(res.message || 'No se pudo emitir el cupón');
          }
        },
        error: err => {
          this.isSavingCoupon.set(false);
          this.triggerError(err.error?.message || 'Error al emitir el cupón');
        }
      });
  }
}

