import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
  Input, Output, EventEmitter, signal, inject, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorarioSustitucionService } from '../../../../services/deportivo/horario-sustitucion.service';
import {
  HorarioEfectivo, EquipoConHorarios, HorarioSustitucion,
  DIAS_SEMANA, CreateSustitucionRequest, HorariosFormDataResponse,
} from '../../../../models/deportivo/horario-sustitucion.model';

@Component({
  selector: 'app-sustitucion-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './sustitucion-form.html',
  styleUrl: './sustitucion-form.scss',
})
export class SustitucionFormComponent implements OnInit {
  @Input() horario!: HorarioEfectivo;
  @Input() equipo!: EquipoConHorarios;
  @Input() sustitucionEditar: HorarioSustitucion | null = null;

  @Output() saved    = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  private svc = inject(HorarioSustitucionService);
  private cdr = inject(ChangeDetectorRef);

  readonly diasSemana = DIAS_SEMANA;

  // ── Estado ───────────────────────────────────────────────────────────────
  formData   = signal<HorariosFormDataResponse['data'] | null>(null);
  loading    = signal(true);
  saving     = signal(false);
  error      = signal<string | null>(null);

  // Paso actual: 1=qué cambia, 2=cuándo
  paso       = signal(1);

  // ── Checkboxes — qué campos se sustituyen (signals para que computed() las observe)
  cambiarCoach    = signal(false);
  cambiarArea     = signal(false);
  cambiarDia      = signal(false);
  cambiarHora     = signal(false);

  // ── Valores nuevos
  coach_id_sustituto:    number | null = null;
  area_id_sustituto:     number | null = null;
  dia_semana_sustituto:  number | null = null;
  hora_inicio_sustituta: string        = '';
  hora_fin_sustituta:    string        = '';

  // ── Fechas y motivo
  fecha_inicio = '';
  fecha_fin    = '';
  motivo       = '';

  // ── Computed helpers
  isEditing = computed(() => !!this.sustitucionEditar);

  readonly hoyISO = new Date().toISOString().split('T')[0];

  // Habilita "Siguiente" en cuanto al menos UN checkbox esté marcado.
  // La validación de que el valor esté seleccionado se hace en irPaso2().
  tieneCambio = computed(() =>
    this.cambiarCoach() || this.cambiarArea() || this.cambiarDia() || this.cambiarHora()
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.svc.getFormData().subscribe({
      next: res => {
        this.formData.set(res.data);
        this.loading.set(false);
        if (this.sustitucionEditar) this._patchFromSustitucion();
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('Error al cargar datos del formulario.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private _patchFromSustitucion(): void {
    const s = this.sustitucionEditar!;
    this.fecha_inicio = s.fecha_inicio;
    this.fecha_fin    = s.fecha_fin;
    this.motivo       = s.motivo ?? '';

    if (s.coach_id_sustituto !== null) {
      this.cambiarCoach.set(true);
      this.coach_id_sustituto   = s.coach_id_sustituto;
    }
    if (s.area_id_sustituto !== null) {
      this.cambiarArea.set(true);
      this.area_id_sustituto    = s.area_id_sustituto;
    }
    if (s.dia_semana_sustituto !== null) {
      this.cambiarDia.set(true);
      this.dia_semana_sustituto = s.dia_semana_sustituto;
    }
    if (s.hora_inicio_sustituta || s.hora_fin_sustituta) {
      this.cambiarHora.set(true);
      this.hora_inicio_sustituta = (s.hora_inicio_sustituta ?? '').substring(0, 5);
      this.hora_fin_sustituta    = (s.hora_fin_sustituta    ?? '').substring(0, 5);
    }
  }

  // ── Navegación entre pasos ────────────────────────────────────────────────
  irPaso2(): void {
    if (!this.tieneCambio()) {
      this.error.set('Selecciona al menos un campo a sustituir.');
      return;
    }
    // Validar que cada opción marcada tenga un valor asignado
    if (this.cambiarCoach() && !this.coach_id_sustituto) {
      this.error.set('Selecciona el profesor sustituto.');
      return;
    }
    if (this.cambiarArea() && !this.area_id_sustituto) {
      this.error.set('Selecciona el área sustituta.');
      return;
    }
    if (this.cambiarDia() && !this.dia_semana_sustituto) {
      this.error.set('Selecciona el día de la semana.');
      return;
    }
    if (this.cambiarHora() && (!this.hora_inicio_sustituta || !this.hora_fin_sustituta)) {
      this.error.set('Indica la hora de inicio y fin.');
      return;
    }
    this.error.set(null);
    this.paso.set(2);
  }

  volverPaso1(): void {
    this.paso.set(1);
    this.error.set(null);
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  guardar(): void {
    this.error.set(null);

    if (!this.fecha_inicio || !this.fecha_fin) {
      this.error.set('Las fechas de inicio y fin son obligatorias.');
      return;
    }
    if (this.fecha_fin < this.fecha_inicio) {
      this.error.set('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return;
    }

    const payload: CreateSustitucionRequest = {
      equipo_id:  this.equipo.id,
      horario_id: this.horario.horario_id,
      fecha_inicio: this.fecha_inicio,
      fecha_fin:    this.fecha_fin,
      motivo: this.motivo || null,
      coach_id_sustituto:    this.cambiarCoach() ? this.coach_id_sustituto    : null,
      area_id_sustituto:     this.cambiarArea()  ? this.area_id_sustituto     : null,
      dia_semana_sustituto:  this.cambiarDia()   ? this.dia_semana_sustituto  : null,
      hora_inicio_sustituta: this.cambiarHora()  ? this.hora_inicio_sustituta : null,
      hora_fin_sustituta:    this.cambiarHora()  ? this.hora_fin_sustituta    : null,
    };

    this.saving.set(true);
    const req$ = this.isEditing()
      ? this.svc.update(this.sustitucionEditar!.id, payload)
      : this.svc.create(payload);

    req$.subscribe({
      next: res => {
        this.saving.set(false);
        this.saved.emit(res.message);
        this.cdr.markForCheck();
      },
      error: err => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error al guardar la sustitución.';
        this.error.set(msg);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  // ── Helpers template ─────────────────────────────────────────────────────
  diaLabel(num: number | null): string {
    if (!num) return '—';
    return this.diasSemana.find(d => d.num === num)?.label ?? `Día ${num}`;
  }

  horaFmt(t: string | null): string {
    if (!t) return '--';
    return t.substring(0, 5);
  }

  getNombreInstructor(id: number | null): string {
    if (!id) return '—';
    const inst = this.formData()?.instructores?.find(i => i.id === id);
    return inst ? inst.full_name : `ID ${id}`;
  }

  getNombreArea(id: number | null): string {
    if (!id) return '—';
    const area = this.formData()?.areas?.find(a => a.area_id === id);
    return area ? area.area_name : `ID ${id}`;
  }
}
