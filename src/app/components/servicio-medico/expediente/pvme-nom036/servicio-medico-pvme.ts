import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ServicioMedicoService } from '../../../../services/servicio-medico';

export interface NordicRegionRow {
  key: string;
  label: string;
  molestia_12m: 'Si' | 'No' | '';
  impidio_trabajo: 'Si' | 'No' | '';
  molestia_7d: 'Si' | 'No' | '';
  intensidad: number | null;
}

export interface ExploracionRegionRow {
  key: string;
  label: string;
  nordicKey: string;
  guia: string;
  hallazgo: 'Normal' | 'Alterado' | '';
  observaciones: string;
}

@Component({
  selector: 'app-servicio-medico-pvme',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicio-medico-pvme.html',
  styleUrl: './servicio-medico-pvme.scss'
})
export class ServicioMedicoPvmeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() token: string = '';
  @Input() medicalProfile: any = null;
  @Input() medicos: any[] = [];
  @Input() consultas: any[] = [];
  @Input() locations: any[] = [];
  @Output() editorModeChange = new EventEmitter<boolean>();

  isLoading: boolean = false;
  isSaving: boolean = false;
  isGeneratingLink: boolean = false;
  isSavingConfig: boolean = false;
  isSavingPuestoCat: boolean = false;

  evaluations: any[] = [];
  preregistrosPvme: any[] = [];

  // ── Configuración por Puesto y Persona (Asignado por la Doctora) ──────────
  puestosCatalogo: any[] = [];
  empleadoPvmeConfig: any = {
    puesto_config_id: null,
    puesto: '',
    area: '',
    turno: 'Matutino',
    sexo: '',
    edad: '',
    antiguedad: '',
    condicion_gestacion: 'no_aplica',
    fecha_parto: '',
    nivel_riesgo: 'medio',
    aplica_anexo_a: true,
    aplica_anexo_b: true,
    aplica_anexo_c: true,
    periodicidad_meses: 12,
    masa_mayor_puesto: '',
    situacion_frente_limite: 'Dentro de su límite nominal aplicando técnica segura',
    actividad_1: '',
    actividad_2: '',
    actividad_3: '',
    que_manipula: '',
    tipo_esfuerzo: 'Levantamiento, descenso y transporte manual',
    ayuda_mecanica_corresponde: 'Diablo de carga de 200 kg según área',
    notas_doctora: '',
    personalizado_por_persona: false
  };

  showPuestosConfigModal: boolean = false;
  showEmpleadoConfigDrawer: boolean = false;
  openSectionA: string = 'identificacion';
  editingPuesto: any = null;

  toggleSectionA(sec: string): void {
    this.openSectionA = this.openSectionA === sec ? '' : sec;
  }

  // Vista activa: 'historial' o 'editor'
  viewMode: 'historial' | 'editor' = 'historial';
  // Sub-pestaña dentro del editor: 'anexo_b' | 'anexo_a' | 'anexo_c'
  activeAnexo: 'anexo_b' | 'anexo_a' | 'anexo_c' = 'anexo_b';

  currentEvalId: number | null = null;
  currentEstado: 'borrador' | 'tamizaje_completado' | 'bloque1_completado' | 'cerrada_firmada' = 'borrador';
  currentPreregistroId: number | null = null;

  // ── Modelos de los 3 Anexos ───────────────────────────────────────────────
  anexoA: any = {};
  anexoB: any = {};
  anexoC: any = {};

  // ── Modal de Firma en Pantalla (Canvas) ───────────────────────────────────
  signatureModalOpen: boolean = false;
  signatureTargetKey: string = '';
  signatureTargetTitle: string = '';
  private isDrawingSignature: boolean = false;
  private sigCtx: CanvasRenderingContext2D | null = null;

  // ── Select Chosen de Doctoras (Medicos) ───────────────────────────────────
  activeDoctoraDropdown: 'anexoB' | 'anexoA' | 'anexoC' | null = null;
  doctoraSearchTerm: string = '';

  readonly nordicRegionsCatalog: { key: string; label: string }[] = [
    { key: 'cuello', label: 'Cuello' },
    { key: 'hombro_derecho', label: 'Hombro derecho' },
    { key: 'hombro_izquierdo', label: 'Hombro izquierdo' },
    { key: 'codo_antebrazo', label: 'Codo o antebrazo' },
    { key: 'muneca_mano', label: 'Muñeca o mano' },
    { key: 'espalda_alta', label: 'Espalda alta (dorsal)' },
    { key: 'espalda_baja', label: 'Espalda baja (lumbar)' },
    { key: 'cadera_muslo', label: 'Cadera o muslo' },
    { key: 'rodilla', label: 'Rodilla' },
    { key: 'tobillo_pie', label: 'Tobillo o pie' }
  ];

  readonly exploracionRegionsCatalog: { key: string; label: string; nordicKey: string; guia: string }[] = [
    { key: 'columna_cervical', label: 'Columna cervical', nordicKey: 'cuello', guia: 'Movilidad, contractura, signos radiculares' },
    { key: 'hombro_derecho', label: 'Hombro derecho', nordicKey: 'hombro_derecho', guia: 'Arco de movimiento · Neer · Jobe' },
    { key: 'hombro_izquierdo', label: 'Hombro izquierdo', nordicKey: 'hombro_izquierdo', guia: 'Arco de movimiento · Neer · Jobe' },
    { key: 'codo_antebrazo', label: 'Codo / antebrazo', nordicKey: 'codo_antebrazo', guia: 'Epicondilalgia' },
    { key: 'muneca_mano', label: 'Muñeca y mano', nordicKey: 'muneca_mano', guia: 'Phalen · Tinel · Finkelstein · prensión' },
    { key: 'columna_dorsal', label: 'Columna dorsal', nordicKey: 'espalda_alta', guia: 'Movilidad, contractura' },
    { key: 'columna_lumbar', label: 'Columna lumbar', nordicKey: 'espalda_baja', guia: 'Movilidad, contractura · Lasègue' },
    { key: 'cadera', label: 'Cadera', nordicKey: 'cadera_muslo', guia: 'Arco de movimiento, dolor a la carga' },
    { key: 'rodilla', label: 'Rodilla', nordicKey: 'rodilla', guia: 'Arco de movimiento, dolor a la carga' },
    { key: 'tobillo_pie', label: 'Tobillo y pie', nordicKey: 'tobillo_pie', guia: 'Arco de movimiento, dolor a la carga' }
  ];

  constructor(
    private servicioMedico: ServicioMedicoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initBlankForms();
    if (this.token) {
      this.loadPvmeConfig();
      this.loadEvaluations();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['token'] && !changes['token'].firstChange && this.token) {
      this.loadPvmeConfig();
      this.loadEvaluations();
    }
    if (changes['medicalProfile'] && this.medicalProfile && !this.currentEvalId) {
      this.prefillEmployeeData();
    }
  }

  ngOnDestroy(): void {
    this.setBodyScrollLock(false);
  }

  private setBodyScrollLock(locked: boolean): void {
    if (typeof document === 'undefined') return;
    if (locked) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }

  loadPvmeConfig(): void {
    if (!this.token) return;
    this.servicioMedico.getPvmeConfig(this.token).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.puestosCatalogo = Array.isArray(res.data.puestos) ? res.data.puestos : [];
          if (res.data.empleado_config) {
            this.empleadoPvmeConfig = {
              ...this.empleadoPvmeConfig,
              ...res.data.empleado_config
            };
            if (!this.currentEvalId) {
              this.aplicarConfiguracionAFormularios();
            }
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar configuración PVME:', err)
    });
  }

  onPuestoTemplateSelect(puestoId: any): void {
    const found = this.puestosCatalogo.find(p => Number(p.id) === Number(puestoId));
    if (!found) return;
    this.empleadoPvmeConfig.puesto_config_id = found.id;
    this.empleadoPvmeConfig.puesto = found.nombre_puesto;
    if (found.area_departamento) {
      this.empleadoPvmeConfig.area = found.area_departamento;
    }
    this.empleadoPvmeConfig.nivel_riesgo = found.nivel_riesgo || 'medio';
    this.empleadoPvmeConfig.aplica_anexo_a = !!found.aplica_anexo_a;
    this.empleadoPvmeConfig.aplica_anexo_b = !!found.aplica_anexo_b;
    this.empleadoPvmeConfig.aplica_anexo_c = !!found.aplica_anexo_c;
    this.empleadoPvmeConfig.periodicidad_meses = found.periodicidad_meses ?? 12;
    this.empleadoPvmeConfig.masa_mayor_puesto = found.masa_mayor_puesto || '';
    this.empleadoPvmeConfig.situacion_frente_limite = found.situacion_frente_limite || '';
    this.empleadoPvmeConfig.actividad_1 = found.actividad_1 || '';
    this.empleadoPvmeConfig.actividad_2 = found.actividad_2 || '';
    this.empleadoPvmeConfig.actividad_3 = found.actividad_3 || '';
    this.empleadoPvmeConfig.que_manipula = found.que_manipula || '';
    this.empleadoPvmeConfig.tipo_esfuerzo = found.tipo_esfuerzo || '';
    this.empleadoPvmeConfig.ayuda_mecanica_corresponde = found.ayuda_mecanica_corresponde || '';
    this.aplicarConfiguracionAFormularios();
  }

  aplicarConfiguracionAFormularios(): void {
    const cfg = this.empleadoPvmeConfig;
    if (!cfg) return;

    if (this.anexoA) {
      if (cfg.puesto) this.anexoA.puesto = cfg.puesto;
      if (cfg.area) this.anexoA.area = cfg.area;
      if (cfg.turno) this.anexoA.turno = cfg.turno;
      if (cfg.sexo) this.anexoA.sexo = cfg.sexo;
      if (cfg.edad) this.anexoA.edad = cfg.edad;
      if (cfg.antiguedad) this.anexoA.antiguedad = cfg.antiguedad;
      if (cfg.condicion_gestacion) this.anexoA.condicion_gestacion = cfg.condicion_gestacion;
      if (cfg.fecha_parto) this.anexoA.fecha_parto = cfg.fecha_parto;
      if (cfg.nivel_riesgo) this.anexoA.nivel_riesgo = cfg.nivel_riesgo;

      // Calcular fecha próxima valoración sugerida según periodicidad del puesto
      if (!this.anexoA.fecha_proxima_valoracion && Number(cfg.periodicidad_meses) > 0) {
        const base = this.anexoA.fecha ? new Date(this.anexoA.fecha) : new Date();
        if (!isNaN(base.getTime())) {
          base.setMonth(base.getMonth() + Number(cfg.periodicidad_meses));
          this.anexoA.fecha_proxima_valoracion = base.toISOString().slice(0, 10);
        }
      }
    }

    if (this.anexoC) {
      if (cfg.puesto) this.anexoC.puesto = cfg.puesto;
      if (cfg.area) this.anexoC.area = cfg.area;
      if (cfg.turno) this.anexoC.turno = cfg.turno;
      if (cfg.masa_mayor_puesto) this.anexoC.masa_mayor_puesto_kg = cfg.masa_mayor_puesto;
      if (cfg.situacion_frente_limite) this.anexoC.situacion_frente_limite = cfg.situacion_frente_limite;
      if (cfg.actividad_1) this.anexoC.actividad_1 = cfg.actividad_1;
      if (cfg.actividad_2) this.anexoC.actividad_2 = cfg.actividad_2;
      if (cfg.actividad_3) this.anexoC.actividad_3 = cfg.actividad_3;
      if (cfg.que_manipula) this.anexoC.que_manipula = cfg.que_manipula;
      if (cfg.tipo_esfuerzo) this.anexoC.tipo_esfuerzo = cfg.tipo_esfuerzo;
      if (cfg.ayuda_mecanica_corresponde) this.anexoC.ayuda_mecanica_corresponde = cfg.ayuda_mecanica_corresponde;
    }

    this.calcularLimiteNominalTabla1();
  }

  guardarConfiguracionColaborador(): void {
    if (!this.token || this.isSavingConfig) return;
    this.isSavingConfig = true;
    const payload = {
      ...this.empleadoPvmeConfig,
      token: this.token,
      empleado_id: this.medicalProfile?.id || this.medicalProfile?.patient_id,
      number_employee: this.medicalProfile?.number_employee || this.token
    };

    this.servicioMedico.savePvmeEmpleadoConfig(payload)
      .pipe(finalize(() => {
        this.isSavingConfig = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.empleadoPvmeConfig.personalizado_por_persona = true;
            this.showEmpleadoConfigDrawer = false;
            if (this.medicalProfile) {
              this.medicalProfile.puesto = this.empleadoPvmeConfig.puesto;
              this.medicalProfile.area = this.empleadoPvmeConfig.area;
              if (this.empleadoPvmeConfig.edad) {
                this.medicalProfile.age = this.empleadoPvmeConfig.edad;
              }
            }
            this.aplicarConfiguracionAFormularios();
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Perfil de riesgo y formularios del colaborador guardado',
              showConfirmButton: false,
              timer: 2200
            });
          }
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo guardar la configuración del colaborador.', 'error');
        }
      });
  }

  // ── Modal de Catálogo / Matriz de Puestos de la Doctora ───────────────────

  openPuestosConfigModal(): void {
    this.showPuestosConfigModal = true;
    if (this.puestosCatalogo.length > 0 && !this.editingPuesto) {
      this.seleccionarPuestoParaEditar(this.puestosCatalogo[0]);
    } else if (!this.editingPuesto) {
      this.nuevoPuestoConfig();
    }
  }

  closePuestosConfigModal(): void {
    this.showPuestosConfigModal = false;
  }

  seleccionarPuestoParaEditar(p: any): void {
    this.editingPuesto = { ...p };
  }

  nuevoPuestoConfig(): void {
    this.editingPuesto = {
      id: null,
      nombre_puesto: '',
      area_departamento: '',
      nivel_riesgo: 'medio',
      aplica_anexo_a: true,
      aplica_anexo_b: true,
      aplica_anexo_c: true,
      periodicidad_meses: 12,
      masa_mayor_puesto: '',
      situacion_frente_limite: 'Dentro de su límite nominal aplicando técnica segura',
      actividad_1: '',
      actividad_2: '',
      actividad_3: '',
      que_manipula: '',
      tipo_esfuerzo: 'Levantamiento, descenso y transporte manual',
      ayuda_mecanica_corresponde: 'Diablo de carga de 200 kg según área',
      notas_doctora: ''
    };
  }

  guardarPuestoConfig(): void {
    if (!this.editingPuesto || !String(this.editingPuesto.nombre_puesto || '').trim()) {
      Swal.fire('Atención', 'El nombre del puesto es obligatorio.', 'warning');
      return;
    }
    this.isSavingPuestoCat = true;
    this.servicioMedico.savePvmePuestoConfig(this.editingPuesto)
      .pipe(finalize(() => {
        this.isSavingPuestoCat = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.loadPvmeConfig();
            if (res.data) {
              this.editingPuesto = { ...res.data };
            }
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Perfil de puesto guardado en catálogo',
              showConfirmButton: false,
              timer: 2000
            });
          }
        },
        error: (err) => Swal.fire('Error', err?.error?.message || 'No se pudo guardar el puesto.', 'error')
      });
  }

  eliminarPuestoConfig(p: any): void {
    if (!p?.id) return;
    Swal.fire({
      title: `¿Eliminar puesto "${p.nombre_puesto}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.servicioMedico.deletePvmePuestoConfig(p.id).subscribe({
          next: () => {
            this.editingPuesto = null;
            this.loadPvmeConfig();
          }
        });
      }
    });
  }

  loadEvaluations(): void {
    if (!this.token) return;
    this.isLoading = true;
    this.servicioMedico.getPvmeEvaluations(this.token)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res?.success && res?.data) {
            this.evaluations = Array.isArray(res.data.evaluations) ? res.data.evaluations : [];
            this.preregistrosPvme = Array.isArray(res.data.preregistros_pvme) ? res.data.preregistros_pvme : [];
          }
        },
        error: (err) => console.error('Error al cargar valoraciones PVME:', err)
      });
  }

  initBlankForms(): void {
    const today = new Date().toISOString().slice(0, 10);
    const empName = this.getEmployeeFullName();
    const empNum = this.medicalProfile?.number_employee || this.token || '';
    const puesto = this.medicalProfile?.puesto || '';
    const area = this.medicalProfile?.area || this.medicalProfile?.responsable || '';
    const sede = this.medicalProfile?.sede || 'Club Sede Hermes';
    const edad = this.medicalProfile?.age || '';

    this.anexoB = {
      no_empleado: empNum,
      nombre: empName,
      fecha: today,
      folio_cedula: 'Por asignar',
      regiones: this.nordicRegionsCatalog.map(r => ({
        key: r.key,
        label: r.label,
        molestia_12m: 'No',
        impidio_trabajo: 'No',
        molestia_7d: 'No',
        intensidad: 0
      })),
      atribuye_actividad: '',
      ha_recibido_tratamiento: '',
      aplico_nombre: '',
      firma_trabajador_data: '',
      firma_aplico_data: ''
    };

    this.anexoA = {
      folio: '',
      fecha: today,
      tipo_valoracion: 'inicial',
      no_empleado: empNum,
      nombre: empName,
      edad: edad,
      sexo: '',
      turno: 'Matutino',
      puesto: puesto,
      area: area,
      antiguedad: '',
      nivel_riesgo: 'medio',
      folio_visita_medica: '',
      // Bloque I - 1. Somatometría
      peso_kg: '',
      talla_m: '',
      imc: '',
      ta: '',
      fc: '',
      // Bloque I - 2. Antecedentes
      puestos_previos_cargas: '',
      antecedentes_patologicos_relevantes: this.medicalProfile?.antecedentes_traumatismos || this.medicalProfile?.antecedentes_cirugias || '',
      incapacidades_previas_me: '',
      condicion_gestacion: 'no_aplica',
      fecha_parto: '',
      // Bloque I - 3. Exploración física dirigida
      exploracion: this.exploracionRegionsCatalog.map(r => ({
        key: r.key,
        label: r.label,
        nordicKey: r.nordicKey,
        guia: r.guia,
        hallazgo: 'Normal',
        observaciones: ''
      })),
      // Bloque II - 4. Límite de masa
      limite_nominal_kg: 25,
      limite_determinado_kg: 25,
      razon_ajuste: '',
      // Bloque II - 5. Conclusión
      conclusion: 'apto_sin_restriccion',
      vigencia_restriccion_hasta: '',
      recomendaciones_puesto: '',
      restricciones_vinculantes: '',
      periodo_recuperacion: '',
      fecha_proxima_valoracion: '',
      // Firmas Bloque I y II
      medico_valorador_id: null,
      medico_valorador_nombre: '',
      medico_valorador_cedula: '',
      fecha_bloque1: today,
      firma_medico_valorador_data: '',
      fecha_firma_trabajador: today,
      firma_trabajador_data: '',
      medica_designada_nombre: 'Dra. Gloria Blaza Enciso Medina',
      medica_designada_cedula: '3838313',
      fecha_determinacion: today,
      modalidad_determinacion: 'personalmente', // 'personalmente' | 'sobre_cedula'
      medica_designada_firmado: false,
      firma_medica_designada_data: ''
    };

    this.anexoC = {
      formato_num: '',
      formato_total: '203',
      no_empleado: empNum,
      turno: 'Matutino',
      trabajador: empName,
      area: area,
      puesto: puesto,
      nivel_riesgo: 'Medio',
      grupo_tabla1: 'Hombres 18–45 años (25 kg)',
      limite_masa_kg: 25,
      masa_mayor_puesto_kg: '',
      situacion_frente_limite: 'Dentro de su límite nominal sin requerir ayuda mecánica',
      actividad_1: '',
      actividad_2: '',
      actividad_3: '',
      que_manipula: '',
      tipo_esfuerzo: 'Levantamiento, descenso y transporte manual',
      ayuda_mecanica_corresponde: 'Diablo de carga de 200 kg / Patín hidráulico según área',
      cita_fecha: today,
      cita_hora: '10:00',
      cita_sede: sede,
      siguiente_valoracion_fecha: '',
      informo_nombre_cargo: '',
      testigo_jefe_nombre: '',
      fecha_acuse: today,
      firma_trabajador_data: '',
      firma_informo_data: '',
      firma_testigo_data: ''
    };
  }

  prefillEmployeeData(): void {
    if (!this.medicalProfile) return;
    const empName = this.getEmployeeFullName();
    const empNum = this.medicalProfile.number_employee || this.token || '';
    const puesto = this.medicalProfile.puesto || '';
    const area = this.medicalProfile.area || this.medicalProfile.responsable || '';

    if (this.anexoB) {
      this.anexoB.no_empleado = this.anexoB.no_empleado || empNum;
      this.anexoB.nombre = this.anexoB.nombre || empName;
    }
    if (this.anexoA) {
      this.anexoA.no_empleado = this.anexoA.no_empleado || empNum;
      this.anexoA.nombre = this.anexoA.nombre || empName;
      this.anexoA.puesto = this.anexoA.puesto || puesto;
      this.anexoA.area = this.anexoA.area || area;
      if (this.medicalProfile.age && !this.anexoA.edad) {
        this.anexoA.edad = this.medicalProfile.age;
      }
    }
    if (this.anexoC) {
      this.anexoC.no_empleado = this.anexoC.no_empleado || empNum;
      this.anexoC.trabajador = this.anexoC.trabajador || empName;
      this.anexoC.puesto = this.anexoC.puesto || puesto;
      this.anexoC.area = this.anexoC.area || area;
    }
  }

  getEmployeeFullName(): string {
    if (!this.medicalProfile) return '';
    const fn = this.medicalProfile.first_name || this.medicalProfile.firstName || '';
    const ln = this.medicalProfile.last_name || this.medicalProfile.lastName || '';
    return `${fn} ${ln}`.trim() || this.medicalProfile.name || '';
  }

  // ── Acciones de Navegación y Creación ─────────────────────────────────────

  iniciarNuevaValoracion(targetTab?: 'anexo_b' | 'anexo_a' | 'anexo_c'): void {
    this.currentEvalId = null;
    this.currentEstado = 'borrador';
    this.currentPreregistroId = null;
    this.initBlankForms();
    this.prefillEmployeeData();
    this.aplicarConfiguracionAFormularios();
    this.jalarSignosUltimaConsulta(true);
    this.viewMode = 'editor';
    this.setBodyScrollLock(true);
    this.editorModeChange.emit(true);
    if (targetTab) {
      this.activeAnexo = targetTab;
    } else if (this.empleadoPvmeConfig?.aplica_anexo_b) {
      this.activeAnexo = 'anexo_b';
    } else if (this.empleadoPvmeConfig?.aplica_anexo_a) {
      this.activeAnexo = 'anexo_a';
    } else {
      this.activeAnexo = 'anexo_c';
    }
  }

  abrirValoracion(item: any, tab: 'anexo_b' | 'anexo_a' | 'anexo_c' = 'anexo_a', openEditor: boolean = true): void {
    this.currentEvalId = item.id;
    this.currentEstado = item.estado || 'borrador';
    this.currentPreregistroId = item.preregistro_id || null;
    this.initBlankForms();

    if (item.anexo_b && typeof item.anexo_b === 'object') {
      const mergedRegions = this.nordicRegionsCatalog.map(cat => {
        const found = Array.isArray(item.anexo_b.regiones)
          ? item.anexo_b.regiones.find((r: any) => r.key === cat.key)
          : null;
        return found ? { ...cat, ...found } : {
          key: cat.key,
          label: cat.label,
          molestia_12m: 'No',
          impidio_trabajo: 'No',
          molestia_7d: 'No',
          intensidad: 0
        };
      });
      this.anexoB = { ...this.anexoB, ...item.anexo_b, regiones: mergedRegions };
    }

    if (item.anexo_a && typeof item.anexo_a === 'object') {
      const mergedExp = this.exploracionRegionsCatalog.map(cat => {
        const found = Array.isArray(item.anexo_a.exploracion)
          ? item.anexo_a.exploracion.find((r: any) => r.key === cat.key)
          : null;
        return found ? { ...cat, ...found } : {
          key: cat.key,
          label: cat.label,
          nordicKey: cat.nordicKey,
          guia: cat.guia,
          hallazgo: 'Normal',
          observaciones: ''
        };
      });
      this.anexoA = { ...this.anexoA, ...item.anexo_a, folio: item.folio || item.anexo_a.folio, exploracion: mergedExp };
    }

    if (item.anexo_c && typeof item.anexo_c === 'object') {
      this.anexoC = { ...this.anexoC, ...item.anexo_c };
    }

    this.prefillEmployeeData();
    if (openEditor) {
      this.viewMode = 'editor';
      this.editorModeChange.emit(true);
      this.activeAnexo = tab;
    }
  }

  volverAlHistorial(): void {
    this.viewMode = 'historial';
    this.setBodyScrollLock(false);
    this.editorModeChange.emit(false);
    this.loadEvaluations();
  }

  // ── Reglas Clínicas y Cálculos Automáticos (NOM-036-1-STPS-2018) ──────────

  calcularImc(): void {
    const peso = parseFloat(this.anexoA.peso_kg);
    let talla = parseFloat(this.anexoA.talla_m);
    if (!isNaN(peso) && peso > 0 && !isNaN(talla) && talla > 0) {
      if (talla > 3) {
        talla = talla / 100;
        this.anexoA.talla_m = talla.toFixed(2);
      }
      this.anexoA.imc = (peso / (talla * talla)).toFixed(1);
    } else {
      this.anexoA.imc = '';
    }
  }

  calcularLimiteNominalTabla1(): void {
    const edad = parseInt(this.anexoA.edad, 10);
    const sexo = (this.anexoA.sexo || '').toLowerCase();

    if (!isNaN(edad) && edad < 18) {
      this.anexoA.limite_nominal_kg = 7;
      this.anexoC.grupo_tabla1 = 'Menores de 18 años (7 kg)';
    } else if (sexo === 'femenino' || sexo === 'f' || sexo === 'mujer') {
      if (this.anexoA.condicion_gestacion === 'no_aplica') {
        this.anexoA.condicion_gestacion = 'no';
      }
      if (this.anexoA.condicion_gestacion === 'gestacion' || this.anexoA.condicion_gestacion === 'posparto') {
        this.anexoA.limite_nominal_kg = 10;
        this.anexoC.grupo_tabla1 = 'Trabajadoras durante la gestación (10 kg)';
      } else if (!isNaN(edad) && edad > 45) {
        this.anexoA.limite_nominal_kg = 15;
        this.anexoC.grupo_tabla1 = 'Mujeres mayores de 45 años (15 kg)';
      } else {
        this.anexoA.limite_nominal_kg = 20;
        this.anexoC.grupo_tabla1 = 'Mujeres de 18 a 45 años (20 kg)';
      }
    } else {
      if (!isNaN(edad) && edad > 45) {
        this.anexoA.limite_nominal_kg = 20;
        this.anexoC.grupo_tabla1 = 'Hombres mayores de 45 años (20 kg)';
      } else {
        this.anexoA.limite_nominal_kg = 25;
        this.anexoC.grupo_tabla1 = 'Hombres de 18 a 45 años (25 kg)';
      }
      this.anexoA.condicion_gestacion = 'no_aplica';
      this.anexoA.fecha_parto = '';
    }

    if (!this.anexoA.limite_determinado_kg || this.anexoA.condicion_gestacion === 'gestacion' || this.anexoA.condicion_gestacion === 'posparto') {
      this.anexoA.limite_determinado_kg = this.anexoA.limite_nominal_kg;
    }
    this.sincronizarAnexoAconAnexoC();
  }

  onCondicionGestacionChange(): void {
    if (this.anexoA.condicion_gestacion === 'no_aplica' || this.anexoA.condicion_gestacion === 'no') {
      this.anexoA.fecha_parto = '';
    }
    this.calcularLimiteNominalTabla1();
  }

  // ── Getters de Campos Condicionales (Anexo A, B y C) ──────────────────────

  get isMujer(): boolean {
    const s = (this.anexoA?.sexo || '').toLowerCase();
    return s === 'femenino' || s === 'f' || s === 'mujer';
  }

  get isMayorDe45(): boolean {
    const edad = parseInt(this.anexoA?.edad, 10);
    return !isNaN(edad) && edad > 45;
  }

  get requiereFechaParto(): boolean {
    return this.anexoA?.condicion_gestacion === 'gestacion' || this.anexoA?.condicion_gestacion === 'posparto';
  }

  get requiereFolioVisita(): boolean {
    return this.anexoA?.tipo_valoracion === 'a_demanda' || this.anexoA?.tipo_valoracion === 'sintomas' || this.anexoA?.tipo_valoracion === 'reincorporacion';
  }

  get requiereRazonAjuste(): boolean {
    if (!this.anexoA?.limite_determinado_kg || !this.anexoA?.limite_nominal_kg) return false;
    return Number(this.anexoA.limite_determinado_kg) !== Number(this.anexoA.limite_nominal_kg);
  }

  get requiereVigenciaRestriccion(): boolean {
    return this.anexoA?.conclusion === 'apto_con_restriccion_temporal';
  }

  get requierePeriodoRecuperacion(): boolean {
    return this.anexoA?.conclusion === 'no_apto_temporal';
  }

  get tieneMolestiasAnexoB(): boolean {
    return this.regionesPositivas12m.length > 0 || (this.anexoB?.regiones || []).some((r: NordicRegionRow) => r.molestia_7d === 'Si');
  }

  sincronizarAnexoAconAnexoC(): void {
    this.anexoC.no_empleado = this.anexoA.no_empleado;
    this.anexoC.trabajador = this.anexoA.nombre;
    this.anexoC.turno = this.anexoA.turno;
    this.anexoC.puesto = this.anexoA.puesto;
    this.anexoC.area = this.anexoA.area;
    const mapRiesgo: Record<string, string> = {
      fuera: 'Fuera de exposición',
      muy_alto: 'Muy alto',
      alto: 'Alto',
      medio: 'Medio',
      bajo: 'Bajo'
    };
    this.anexoC.nivel_riesgo = mapRiesgo[this.anexoA.nivel_riesgo] || this.anexoA.nivel_riesgo;
    this.anexoC.limite_masa_kg = this.anexoA.limite_determinado_kg || this.anexoA.limite_nominal_kg || 25;
    if (this.anexoA.fecha_proxima_valoracion) {
      this.anexoC.siguiente_valoracion_fecha = this.anexoA.fecha_proxima_valoracion;
    }
  }

  jalarSignosUltimaConsulta(silent: boolean = false): void {
    if (!this.consultas || this.consultas.length === 0) {
      if (!silent) {
        Swal.fire('Sin visitas previas', 'Este colaborador no tiene consultas médicas registradas de donde importar somatometría.', 'info');
      }
      return;
    }
    const ultima = this.consultas[0];
    if (ultima.peso) this.anexoA.peso_kg = ultima.peso;
    if (ultima.talla) this.anexoA.talla_m = ultima.talla;
    if (ultima.imc) this.anexoA.imc = ultima.imc;
    if (ultima.ta_sistolica || ultima.ta_diastolica) {
      this.anexoA.ta = `${ultima.ta_sistolica || '-'}/${ultima.ta_diastolica || '-'}`;
    }
    if (ultima.fc) this.anexoA.fc = ultima.fc;
    if (ultima.id && ultima.id > 0 && !this.anexoA.folio_visita_medica) {
      this.anexoA.folio_visita_medica = String(ultima.id);
    }
    this.calcularImc();
    if (!silent) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Somatometría importada de la última visita',
        showConfirmButton: false,
        timer: 2200
      });
    }
  }

  onMedicoValoradorChange(medicoId: any): void {
    const med = this.medicos.find(m => String(m.id) === String(medicoId));
    if (med) {
      this.anexoA.medico_valorador_nombre = `${med.first_name || ''} ${med.last_name || ''}`.trim();
      if (!this.anexoB.aplico_nombre) {
        this.anexoB.aplico_nombre = this.anexoA.medico_valorador_nombre;
      }
      if (!this.anexoC.informo_nombre_cargo) {
        this.anexoC.informo_nombre_cargo = `${this.anexoA.medico_valorador_nombre} · Médico del Servicio Médico`;
      }
    }
  }

  get filteredDoctoras(): any[] {
    const list = Array.isArray(this.medicos) ? this.medicos : [];
    const term = (this.doctoraSearchTerm || '').trim().toLowerCase();
    if (!term) return list;
    return list.filter(m =>
      `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase().includes(term)
    );
  }

  toggleDoctoraDropdown(target: 'anexoB' | 'anexoA' | 'anexoC', event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.activeDoctoraDropdown === target) {
      this.activeDoctoraDropdown = null;
      return;
    }
    this.activeDoctoraDropdown = target;
    this.doctoraSearchTerm = '';
    setTimeout(() => {
      const searchInput = document.getElementById(`pvme-chosen-search-${target}`) as HTMLInputElement | null;
      if (searchInput) {
        searchInput.focus();
      }
    }, 30);
  }

  onDoctoraSearchInput(target: 'anexoB' | 'anexoA' | 'anexoC', event: any): void {
    this.activeDoctoraDropdown = target;
    this.doctoraSearchTerm = event?.target?.value || '';
  }

  closeDoctoraDropdownDelayed(): void {
    setTimeout(() => {
      this.activeDoctoraDropdown = null;
      this.cdr.detectChanges();
    }, 180);
  }

  selectDoctora(target: 'anexoB' | 'anexoA' | 'anexoC', med: any | null): void {
    const fullName = med ? `${med.first_name || ''} ${med.last_name || ''}`.trim() : '';
    if (target === 'anexoB') {
      this.anexoB.aplico_nombre = fullName;
      if (med && !this.anexoA.medico_valorador_nombre) {
        this.anexoA.medico_valorador_id = med.id;
        this.anexoA.medico_valorador_nombre = fullName;
      }
      if (med && !this.anexoC.informo_nombre_cargo) {
        this.anexoC.informo_nombre_cargo = fullName;
      }
    } else if (target === 'anexoA') {
      this.anexoA.medico_valorador_id = med ? med.id : null;
      this.anexoA.medico_valorador_nombre = fullName;
      if (med && !this.anexoB.aplico_nombre) {
        this.anexoB.aplico_nombre = fullName;
      }
      if (med && !this.anexoC.informo_nombre_cargo) {
        this.anexoC.informo_nombre_cargo = fullName;
      }
    } else if (target === 'anexoC') {
      this.anexoC.informo_nombre_cargo = fullName;
    }
    this.activeDoctoraDropdown = null;
    this.doctoraSearchTerm = '';
  }

  // ── Alertas del Cuestionario Nórdico (Regla SMD-PVME-15) ──────────────────

  get regionesPositivas7dConInterferencia(): NordicRegionRow[] {
    if (!Array.isArray(this.anexoB?.regiones)) return [];
    return this.anexoB.regiones.filter(
      (r: NordicRegionRow) => r.molestia_7d === 'Si' && r.impidio_trabajo === 'Si'
    );
  }

  get regionesPositivas12m(): NordicRegionRow[] {
    if (!Array.isArray(this.anexoB?.regiones)) return [];
    return this.anexoB.regiones.filter((r: NordicRegionRow) => r.molestia_12m === 'Si');
  }

  get alertaReglaPvme15(): boolean {
    return this.regionesPositivas12m.length >= 2;
  }

  isExploracionObligatoria(nordicKey: string): boolean {
    if (!Array.isArray(this.anexoB?.regiones)) return false;
    const row = this.anexoB.regiones.find((r: NordicRegionRow) => r.key === nordicKey);
    return !!(row && (row.molestia_7d === 'Si' || row.molestia_12m === 'Si'));
  }

  // ── Guardado de la Valoración (Anexos A, B y C) ───────────────────────────

  guardarValoracion(nuevoEstado?: 'borrador' | 'tamizaje_completado' | 'bloque1_completado' | 'cerrada_firmada'): void {
    this.sincronizarAnexoAconAnexoC();
    const targetEstado = nuevoEstado || this.currentEstado || 'borrador';

    // Validación normativa si se intenta cerrar y firmar como Médica Designada
    if (targetEstado === 'cerrada_firmada') {
      if (this.requiereFechaParto && !String(this.anexoA.fecha_parto || '').trim()) {
        Swal.fire(
          'Fecha de parto / FPP requerida',
          'Cuando se declara condición de gestación o puerperio (Regla SMD-PVME-14), es obligatorio indicar la fecha probable de parto o fecha de parto.',
          'warning'
        );
        this.activeAnexo = 'anexo_a';
        return;
      }
      const regAlteradaSinObs = (this.anexoA.exploracion || []).find(
        (exp: ExploracionRegionRow) => exp.hallazgo === 'Alterado' && !String(exp.observaciones || '').trim()
      );
      if (regAlteradaSinObs) {
        Swal.fire(
          'Observación clínica requerida',
          `La región "${regAlteradaSinObs.label}" fue marcada como Alterado en la exploración física dirigida; debe describir los hallazgos y maniobras.`,
          'warning'
        );
        this.activeAnexo = 'anexo_a';
        return;
      }
      if (!this.anexoA.limite_determinado_kg || !this.anexoA.conclusion) {
        Swal.fire(
          'Apartados 4 y 5 incompletos',
          'Conforme al Bloque II del protocolo SST-PRO-PVME-01, esta cédula NO puede cerrarse mientras el límite de masa y la conclusión de aptitud estén sin llenar.',
          'warning'
        );
        this.activeAnexo = 'anexo_a';
        return;
      }
      if (
        Number(this.anexoA.limite_determinado_kg) !== Number(this.anexoA.limite_nominal_kg) &&
        !String(this.anexoA.razon_ajuste || '').trim()
      ) {
        Swal.fire(
          'Razón clínica requerida',
          'Cuando el límite que determina esta valoración es distinto del nominal de la Tabla 1, debe asentarse la razón clínica del ajuste.',
          'warning'
        );
        this.activeAnexo = 'anexo_a';
        return;
      }
      if (this.requiereVigenciaRestriccion && !String(this.anexoA.vigencia_restriccion_hasta || '').trim()) {
        Swal.fire(
          'Vigencia de restricción requerida',
          'Cuando la conclusión es "Apto con restricción temporal", debe indicar la fecha de vigencia de la restricción.',
          'warning'
        );
        this.activeAnexo = 'anexo_a';
        return;
      }
      if (this.requierePeriodoRecuperacion && !String(this.anexoA.periodo_recuperacion || '').trim()) {
        Swal.fire(
          'Periodo de recuperación requerido',
          'Cuando la conclusión es "No apto temporal para el puesto", debe asentar el periodo de recuperación conforme al numeral 9.5.',
          'warning'
        );
        this.activeAnexo = 'anexo_a';
        return;
      }
      if (this.regionesPositivas7dConInterferencia.length > 0 && this.anexoA.conclusion === 'apto_sin_restriccion') {
        const tieneJustificacion = String(this.anexoA.recomendaciones_puesto || '').trim().length >= 5;
        if (!tieneJustificacion) {
          Swal.fire(
            'Regla clínica Anexo B',
            'El trabajador presenta molestia positiva a 7 días CON interferencia laboral. La conclusión no puede ser "Apto sin restricción" sin que la cédula justifique clínicamente el motivo en Recomendaciones/Observaciones.',
            'warning'
          );
          this.activeAnexo = 'anexo_a';
          return;
        }
      }
      this.anexoA.medica_designada_firmado = true;
    }

    this.isSaving = true;
    const payload = {
      id: this.currentEvalId,
      token: this.token,
      empleado_id: this.medicalProfile?.id || this.medicalProfile?.patient_id,
      number_employee: this.medicalProfile?.number_employee || this.token,
      preregistro_id: this.currentPreregistroId,
      folio: this.anexoA.folio,
      fecha_valoracion: this.anexoA.fecha,
      tipo_valoracion: this.anexoA.tipo_valoracion,
      nivel_riesgo: this.anexoA.nivel_riesgo,
      conclusion: this.anexoA.conclusion,
      limite_masa_nominal_kg: this.anexoA.limite_nominal_kg,
      limite_masa_determinado_kg: this.anexoA.limite_determinado_kg,
      proxima_valoracion: this.anexoA.fecha_proxima_valoracion || null,
      medico_valorador_id: this.anexoA.medico_valorador_id,
      medica_designada_firmado: !!this.anexoA.medica_designada_firmado,
      estado: targetEstado,
      anexo_a: this.anexoA,
      anexo_b: this.anexoB,
      anexo_c: this.anexoC
    };

    this.servicioMedico.savePvmeEvaluation(payload)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res?.success) {
            this.currentEvalId = res.data?.id || this.currentEvalId;
            this.currentEstado = res.data?.estado || targetEstado;
            if (res.data?.folio) {
              this.anexoA.folio = res.data.folio;
              this.anexoB.folio_cedula = res.data.folio;
            }
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: res.message || 'Valoración PVME guardada',
              showConfirmButton: false,
              timer: 2500
            });
            this.loadEvaluations();
          } else {
            Swal.fire('Error', res?.message || 'No se pudo guardar la valoración.', 'error');
          }
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'Error al guardar la valoración PVME.', 'error');
        }
      });
  }

  eliminarBorrador(item: any): void {
    Swal.fire({
      title: `¿Eliminar borrador ${item.folio}?`,
      text: 'Esta acción eliminará el borrador no cerrado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then(result => {
      if (result.isConfirmed) {
        this.servicioMedico.deletePvmeEvaluation(item.id).subscribe({
          next: (res: any) => {
            if (res?.success) {
              this.loadEvaluations();
              Swal.fire('Eliminado', 'El borrador fue eliminado.', 'success');
            }
          },
          error: (err) => Swal.fire('No permitido', err?.error?.message || 'No se pudo eliminar.', 'error')
        });
      }
    });
  }

  // ── Envío de Enlace Previo (Anexo B + Anexo C) por Preregistros ───────────

  enviarEnlacePrevioColaborador(): void {
    const empId = this.medicalProfile?.id || this.medicalProfile?.patient_id;
    const email = this.medicalProfile?.email || '';
    const nombre = this.getEmployeeFullName();

    if (!empId) {
      Swal.fire('Atención', 'No se encontró el ID interno del colaborador.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Enviar Tamizaje NOM-036 (Anexo B y C)',
      html: `
        <div class="text-start small">
          <p class="mb-2">Se generará una liga única para que <strong>${nombre}</strong> conteste su <strong>Cuestionario Nórdico (Anexo B)</strong> y revise su <strong>Información de Riesgos (Anexo C)</strong> antes de pasar a consultorio.</p>
          <label class="form-label fw-semibold mb-1">Correo electrónico del colaborador (opcional para envío automático):</label>
          <input id="swal-pvme-email" type="email" class="form-control form-control-sm" value="${email}" placeholder="correo@centrolibanes.org.mx">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-link-45deg me-1"></i>Generar liga y enviar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (!res.isConfirmed) return;
      const inputEl = document.getElementById('swal-pvme-email') as HTMLInputElement;
      const emailDestino = inputEl ? inputEl.value.trim() : email;

      this.isGeneratingLink = true;
      this.servicioMedico.generatePreregistro({
        tipo_destinatario: 'empleado',
        empleado_id: empId,
        questionnaire_variant: 'pvme_nom036',
        email_destino: emailDestino,
        vigencia_horas: 72
      })
        .pipe(finalize(() => {
          this.isGeneratingLink = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (genRes: any) => {
            if (genRes?.success && genRes?.data) {
              this.loadEvaluations();
              const url = genRes.data.public_url;
              Swal.fire({
                icon: 'success',
                title: 'Liga NOM-036 Generada',
                html: `
                  <div class="text-start small">
                    <p class="mb-2">${genRes.message}</p>
                    <div class="input-group input-group-sm mb-2">
                      <input type="text" class="form-control" value="${url}" readonly id="pvme-public-url-input">
                    </div>
                  </div>
                `,
                confirmButtonText: 'Copiar liga al portapapeles'
              }).then(() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                }
              });
            }
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se pudo generar el enlace.', 'error');
          }
        });
    });
  }

  // ── Pad de Firma Digital (Canvas) ─────────────────────────────────────────

  openSignaturePad(targetKey: string, title: string): void {
    this.signatureTargetKey = targetKey;
    this.signatureTargetTitle = title;
    this.signatureModalOpen = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      const canvas = document.getElementById('pvmeSignatureCanvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      this.sigCtx = ctx;
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 60);
  }

  closeSignaturePad(): void {
    this.signatureModalOpen = false;
    this.isDrawingSignature = false;
    this.sigCtx = null;
  }

  clearSignatureCanvas(): void {
    const canvas = document.getElementById('pvmeSignatureCanvas') as HTMLCanvasElement | null;
    if (canvas && this.sigCtx) {
      this.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  startSigDraw(event: MouseEvent | TouchEvent): void {
    const canvas = document.getElementById('pvmeSignatureCanvas') as HTMLCanvasElement | null;
    if (!canvas || !this.sigCtx) return;
    event.preventDefault();
    this.isDrawingSignature = true;
    const pos = this.getCanvasPoint(canvas, event);
    this.sigCtx.beginPath();
    this.sigCtx.moveTo(pos.x, pos.y);
  }

  moveSigDraw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawingSignature) return;
    const canvas = document.getElementById('pvmeSignatureCanvas') as HTMLCanvasElement | null;
    if (!canvas || !this.sigCtx) return;
    event.preventDefault();
    const pos = this.getCanvasPoint(canvas, event);
    this.sigCtx.lineTo(pos.x, pos.y);
    this.sigCtx.stroke();
  }

  endSigDraw(): void {
    this.isDrawingSignature = false;
  }

  private getCanvasPoint(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  applySignatureCanvas(): void {
    const canvas = document.getElementById('pvmeSignatureCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    switch (this.signatureTargetKey) {
      case 'anexoB_trabajador':
        this.anexoB.firma_trabajador_data = dataUrl;
        break;
      case 'anexoB_aplico':
        this.anexoB.firma_aplico_data = dataUrl;
        break;
      case 'anexoA_medico':
      case 'anexoA_medico_valorador':
        this.anexoA.firma_medico_valorador_data = dataUrl;
        break;
      case 'anexoA_trabajador':
        this.anexoA.firma_trabajador_data = dataUrl;
        break;
      case 'anexoA_medica_designada':
        this.anexoA.firma_medica_designada_data = dataUrl;
        this.anexoA.medica_designada_firmado = true;
        break;
      case 'anexoC_trabajador':
        this.anexoC.firma_trabajador_data = dataUrl;
        break;
      case 'anexoC_informo':
        this.anexoC.firma_informo_data = dataUrl;
        break;
      case 'anexoC_testigo':
        this.anexoC.firma_testigo_data = dataUrl;
        break;
    }

    this.closeSignaturePad();
    this.cdr.detectChanges();
  }

  // ── Etiquetas legibles ────────────────────────────────────────────────────

  getConclusionLabel(code: string): string {
    const map: Record<string, string> = {
      apto_sin_restriccion: 'Apto sin restricción',
      apto_con_recomendaciones: 'Apto con recomendaciones',
      apto_con_restriccion_temporal: 'Apto con restricción temporal',
      requiere_estudio_especializado: 'Requiere estudio o valoración especializada',
      no_apto_temporal: 'No apto temporal para el puesto'
    };
    return map[code] || code || 'Pendiente';
  }

  getEstadoBadge(estado: string): { label: string; css: string } {
    switch (estado) {
      case 'cerrada_firmada':
        return { label: 'Cerrada y Firmada (Médica Designada)', css: 'bg-success-subtle text-success border-success-subtle' };
      case 'bloque1_completado':
        return { label: 'Bloque I Completo · Pendiente Médica Designada', css: 'bg-warning-subtle text-warning-emphasis border-warning-subtle' };
      case 'tamizaje_completado':
        return { label: 'Tamizaje Nórdico Recibido', css: 'bg-info-subtle text-info-emphasis border-info-subtle' };
      default:
        return { label: 'Borrador en captura', css: 'bg-secondary-subtle text-secondary border-secondary-subtle' };
    }
  }

  // ── Impresión / Generación de PDF Oficial Exacto (Anexos A, B y C) ────────

  imprimirFormatoOficial(tipo: 'anexo_a' | 'anexo_b' | 'anexo_c' | 'todos'): void {
    this.sincronizarAnexoAconAnexoC();
    const win = window.open('', '_blank', 'width=1024,height=860');
    if (!win) {
      Swal.fire('Ventana bloqueada', 'Permite las ventanas emergentes en tu navegador para imprimir el formato oficial.', 'warning');
      return;
    }

    let htmlContent = '';
    if (tipo === 'anexo_b') {
      htmlContent = this.buildPrintAnexoB();
    } else if (tipo === 'anexo_a') {
      htmlContent = this.buildPrintAnexoA();
    } else if (tipo === 'anexo_c') {
      htmlContent = this.buildPrintAnexoC();
    } else {
      // Paquete completo (Anexo B + Anexo A + Anexo C)
      const extractBody = (doc: string) => {
        const m = doc.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        return m ? m[1] : doc;
      };
      htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
      <title>Paquete PVME NOM-036 — ${this.anexoA.nombre || ''}</title>
      <style>${this.getCommonPrintStyles()}</style></head><body>
      ${extractBody(this.buildPrintAnexoB())}
      <div class="page-break"></div>
      ${extractBody(this.buildPrintAnexoA())}
      <div class="page-break"></div>
      ${extractBody(this.buildPrintAnexoC())}
      </body></html>`;
    }

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 350);
  }

  private getCommonPrintStyles(): string {
    return `
      @page { size: letter portrait; margin: 12mm 14mm; }
      * { box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
      body { margin: 0; padding: 0; color: #1e293b; font-size: 11px; line-height: 1.38; }
      .page { page-break-after: always; position: relative; min-height: 248mm; display: flex; flex-direction: column; }
      .page:last-child { page-break-after: auto; }
      .top-meta { text-align: right; font-size: 9.5px; color: #64748b; margin-bottom: 6px; }
      h1 { font-size: 14.5px; font-weight: 700; color: #1e3a5f; margin: 0 0 3px 0; text-transform: uppercase; }
      h2 { font-size: 12px; font-weight: 700; color: #1e3a5f; margin: 12px 0 5px 0; }
      .sub-meta { font-size: 10px; color: #475569; margin-bottom: 8px; }
      .notice-box { background: #eef2f7; border-left: 3.5px solid #1e3a5f; padding: 7px 10px; font-size: 10px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      th, td { border: 1px solid #cbd5e1; padding: 5px 7px; vertical-align: middle; font-size: 10.5px; }
      th, .cell-label { background: #edf2f9; font-weight: 700; color: #1e3a5f; text-align: left; }
      .chk { display: inline-block; width: 11px; height: 11px; border: 1.2px solid #334155; text-align: center; line-height: 10px; font-size: 9px; font-weight: bold; margin-right: 3px; vertical-align: middle; }
      .sig-grid { display: flex; justify-content: space-between; gap: 18px; margin-top: 26px; }
      .sig-col { flex: 1; text-align: center; font-size: 10px; }
      .sig-line { border-top: 1.2px solid #0f172a; padding-top: 4px; margin-top: 42px; }
      .sig-img { max-height: 38px; display: block; margin: 0 auto -36px auto; }
      .footer-meta { margin-top: auto; padding-top: 8px; text-align: center; font-size: 9px; color: #64748b; }
    `;
  }

  private chk(cond: boolean): string {
    return `<span class="chk">${cond ? '✓' : '&nbsp;'}</span>`;
  }

  private buildPrintAnexoB(): string {
    const b = this.anexoB;
    const rowsHtml = (b.regiones || []).map((r: NordicRegionRow) => `
      <tr>
        <td style="font-weight:700;">${r.label}</td>
        <td>${this.chk(r.molestia_12m === 'Si')} Sí &nbsp; ${this.chk(r.molestia_12m === 'No')} No</td>
        <td>${this.chk(r.impidio_trabajo === 'Si')} Sí &nbsp; ${this.chk(r.impidio_trabajo === 'No')} No</td>
        <td>${this.chk(r.molestia_7d === 'Si')} Sí &nbsp; ${this.chk(r.molestia_7d === 'No')} No</td>
        <td style="text-align:center;font-weight:600;">${r.molestia_12m === 'Si' || r.molestia_7d === 'Si' ? (r.intensidad ?? '') : ''}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Anexo B - ${b.no_empleado}</title><style>${this.getCommonPrintStyles()}</style></head><body>
      <div class="page">
        <div class="top-meta">SST – PRO – PVME – 01 · v2.0 rev 03 · 24 / 09 / 2026</div>
        <h1>ANEXO B · CUESTIONARIO NÓRDICO MUSCULOESQUELÉTICO</h1>
        <div class="sub-meta">Instrumento de tamizaje. Marque una casilla por columna y por región. Este cuestionario orienta la exploración; no constituye un diagnóstico. Los diez renglones cubren las nueve regiones anatómicas del cuestionario, con el hombro desglosado por lado.</div>
        <div class="notice-box">
          <strong>DÓNDE VIVE</strong> EXPEDIENTE CLÍNICO, exclusivamente. Se archiva junto con la cédula del Anexo A, cinco años. Es el documento más sensible del protocolo: recoge síntomas referidos por el trabajador. Nunca se entrega, ni completo ni resumido, al jefe de área ni a Recursos Humanos. Regla SMD-PVME-17.
        </div>
        <table>
          <tr>
            <td class="cell-label" style="width:14%;">No. de empleado</td>
            <td style="width:16%;">${b.no_empleado || ''}</td>
            <td class="cell-label" style="width:10%;">Nombre</td>
            <td style="width:30%;">${b.nombre || ''}</td>
            <td class="cell-label" style="width:8%;">Fecha</td>
            <td style="width:10%;">${b.fecha || ''}</td>
            <td class="cell-label" style="width:12%;">Folio de la cédula</td>
            <td style="width:10%;">${b.folio_cedula || ''}</td>
          </tr>
        </table>
        <table>
          <thead>
            <tr>
              <th style="width:26%;">Región anatómica</th>
              <th style="width:20%;">¿Molestia en los últimos 12 meses?</th>
              <th style="width:20%;">¿Le impidió hacer su trabajo?</th>
              <th style="width:20%;">¿Molestia en los últimos 7 días?</th>
              <th style="width:14%;">Intensidad (0 a 10)</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <table>
          <tr>
            <td class="cell-label" style="width:36%;">¿Atribuye la molestia a alguna actividad de su trabajo? ¿A cuál?</td>
            <td>${b.atribuye_actividad || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">¿Ha recibido tratamiento por esta molestia?</td>
            <td>${b.ha_recibido_tratamiento || ''}</td>
          </tr>
        </table>
        <div class="notice-box" style="margin-top:6px;">
          <div style="font-weight:700;color:#1e3a5f;margin-bottom:4px;">CÓMO SE LEE ESTE CUESTIONARIO</div>
          <div style="margin-bottom:3px;"><strong>Positivo a 7 días CON interferencia:</strong> explore obligatoriamente esa región y asiéntelo. La conclusión no puede ser “apto sin restricción” sin que la cédula diga por qué.</div>
          <div style="margin-bottom:3px;"><strong>Positivo a 12 meses SIN molestia actual:</strong> es antecedente. Se explora y se anota; por sí solo no restringe.</div>
          <div><strong>Dos o más regiones positivas a 12 meses en el mismo trabajador, o dos o más trabajadores del mismo puesto positivos en la misma región:</strong> se revisa la evaluación ergonómica del puesto. Es la regla SMD-PVME-15 y es la vía por la que la vigilancia médica corrige la evaluación de riesgo, y no sólo la registra.</div>
        </div>
        <div class="sig-grid">
          <div class="sig-col">
            ${b.firma_trabajador_data ? `<img class="sig-img" src="${b.firma_trabajador_data}">` : ''}
            <div class="sig-line">Firma del trabajador</div>
          </div>
          <div class="sig-col">
            ${b.firma_aplico_data ? `<img class="sig-img" src="${b.firma_aplico_data}">` : ''}
            <div class="sig-line">Aplicó (nombre y firma)<br><small>${b.aplico_nombre || ''}</small></div>
          </div>
        </div>
        <div class="footer-meta">Documento clínico · expediente del trabajador · regla SMD-PVME-17</div>
      </div>
    </body></html>`;
  }

  private buildPrintAnexoA(): string {
    const a = this.anexoA;
    const exp1 = (a.exploracion || []).slice(0, 6);
    const exp2 = (a.exploracion || []).slice(6, 10);

    const renderExpRows = (list: ExploracionRegionRow[]) => list.map(r => `
      <tr>
        <td style="font-weight:700;width:25%;">${r.label}</td>
        <td style="width:23%;">${this.chk(r.hallazgo === 'Normal')} Normal &nbsp; ${this.chk(r.hallazgo === 'Alterado')} Alterado</td>
        <td>${r.observaciones ? `<strong>${r.observaciones}</strong> <span style="color:#64748b;">(${r.guia})</span>` : `<span style="color:#64748b;">${r.guia}</span>`}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Anexo A - ${a.folio || a.no_empleado}</title><style>${this.getCommonPrintStyles()}</style></head><body>
      <!-- PÁGINA 1 -->
      <div class="page">
        <div class="top-meta">SST – PRO – PVME – 01 · v2.0 rev 03 · 24 / 09 / 2026</div>
        <h1>ANEXO A · CÉDULA DE VALORACIÓN MÉDICA MUSCULOESQUELÉTICA</h1>
        <div class="sub-meta">Documento clínico. Se resguarda en el expediente del trabajador; al expediente de SST sólo se traslada la conclusión.</div>
        <div class="notice-box">
          <strong>DÓNDE VIVE</strong> EXPEDIENTE CLÍNICO, exclusivamente. Resguardo del Servicio Médico, cinco años (numeral 9.4). No se entrega copia al jefe de área ni a Recursos Humanos. De esta cédula sólo salen la conclusión de aptitud, el límite de masa y las medidas, por la vía del Anexo D. Regla SMD-PVME-17.
        </div>
        <table>
          <tr>
            <td class="cell-label" style="width:9%;">Folio</td>
            <td style="width:14%;">${a.folio || ''}</td>
            <td class="cell-label" style="width:9%;">Fecha</td>
            <td style="width:14%;">${a.fecha || ''}</td>
            <td class="cell-label" style="width:13%;">Tipo de valoración</td>
            <td colspan="3">
              ${this.chk(a.tipo_valoracion === 'inicial')} Inicial &nbsp;
              ${this.chk(a.tipo_valoracion === 'periodica')} Periódica &nbsp;
              ${this.chk(a.tipo_valoracion === 'reincorporacion')} Reincorporación &nbsp;
              ${this.chk(a.tipo_valoracion === 'cambio_puesto')} Cambio de puesto &nbsp;
              ${this.chk(a.tipo_valoracion === 'a_demanda')} A demanda
            </td>
          </tr>
          <tr>
            <td class="cell-label">No. de empleado</td>
            <td>${a.no_empleado || ''}</td>
            <td class="cell-label">Nombre</td>
            <td colspan="2">${a.nombre || ''}</td>
            <td class="cell-label" style="width:8%;">Edad</td>
            <td style="width:10%;">${a.edad || ''}</td>
            <td><strong>Sexo:</strong> ${a.sexo || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Turno</td>
            <td>${a.turno || ''}</td>
            <td class="cell-label">Puesto</td>
            <td colspan="2">${a.puesto || ''}</td>
            <td class="cell-label">Área</td>
            <td colspan="2">${a.area || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Antigüedad</td>
            <td>${a.antiguedad || ''}</td>
            <td class="cell-label">Nivel de riesgo</td>
            <td colspan="3">
              ${this.chk(a.nivel_riesgo === 'fuera')} Fuera &nbsp;
              ${this.chk(a.nivel_riesgo === 'muy_alto')} Muy alto &nbsp;
              ${this.chk(a.nivel_riesgo === 'alto')} Alto &nbsp;
              ${this.chk(a.nivel_riesgo === 'medio')} Medio &nbsp;
              ${this.chk(a.nivel_riesgo === 'bajo')} Bajo
            </td>
            <td class="cell-label">Folio de visita médica</td>
            <td>${a.folio_visita_medica || ''}</td>
          </tr>
        </table>

        <h2>BLOQUE I · APARTADOS 1 A 3 — LOS LLENA EL MÉDICO QUE PRACTICA LA VALORACIÓN</h2>
        <div class="sub-meta">Somatometría, antecedentes y exploración física dirigida. No son actuaciones reservadas: las practica cualquier médico del Servicio Médico que haya acreditado la capacitación de este protocolo.</div>

        <div style="font-weight:700;margin-bottom:4px;">1. Somatometría</div>
        <table>
          <tr>
            <td class="cell-label">Peso (kg)</td><td>${a.peso_kg || ''}</td>
            <td class="cell-label">Talla (m)</td><td>${a.talla_m || ''}</td>
            <td class="cell-label">IMC</td><td>${a.imc || ''}</td>
            <td class="cell-label">T/A</td><td>${a.ta || ''}</td>
            <td class="cell-label">Frecuencia cardiaca</td><td>${a.fc || ''}</td>
          </tr>
        </table>

        <div style="font-weight:700;margin-bottom:4px;">2. Antecedentes</div>
        <table>
          <tr>
            <td class="cell-label" style="width:36%;">Puestos previos con manejo de cargas</td>
            <td>${a.puestos_previos_cargas || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Antecedentes patológicos relevantes (columna, articulares, reumáticos, quirúrgicos)</td>
            <td>${a.antecedentes_patologicos_relevantes || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Incapacidades previas por causa musculoesquelética</td>
            <td>${a.incapacidades_previas_me || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Condición de gestación o puerperio declarada por la trabajadora (regla SMD-PVME-14)</td>
            <td>
              ${this.chk(a.condicion_gestacion === 'no_aplica')} No aplica &nbsp;
              ${this.chk(a.condicion_gestacion === 'no')} No &nbsp;
              ${this.chk(a.condicion_gestacion === 'si')} Sí — fecha probable de parto o fecha de parto: <u>${a.fecha_parto || '______________'}</u>
            </td>
          </tr>
        </table>

        <div style="font-weight:700;margin-bottom:4px;">3. Exploración física dirigida</div>
        <table>
          <thead>
            <tr><th style="width:25%;">Región</th><th style="width:23%;">Hallazgo</th><th>Observaciones y maniobras</th></tr>
          </thead>
          <tbody>${renderExpRows(exp1)}</tbody>
        </table>
        <div class="footer-meta">Documento clínico · expediente del trabajador · regla SMD-PVME-17</div>
      </div>

      <!-- PÁGINA 2 -->
      <div class="page">
        <div class="top-meta">SST – PRO – PVME – 01 · v2.0 rev 03 · 24 / 09 / 2026</div>
        <table>
          <tbody>${renderExpRows(exp2)}</tbody>
        </table>

        <h2>BLOQUE II · APARTADOS 4 Y 5 — LOS LLENA ÚNICAMENTE LA MÉDICA DESIGNADA</h2>
        <div class="sub-meta">Determinación del límite de masa aplicable y de la aptitud física. Son actuaciones reservadas por la nota al pie de la Tabla 1 y por el numeral 9.5. Esta cédula NO se cierra, NO se archiva y NO se asienta como valoración practicada en el Anexo D mientras estos dos apartados estén sin llenar y sin firma.</div>

        <div style="font-weight:700;margin-bottom:4px;">4. Límite de masa aplicable a este trabajador</div>
        <table>
          <tr>
            <td class="cell-label" style="width:32%;">Límite nominal de la Tabla 1</td>
            <td style="width:18%;font-weight:700;font-size:12px;">${a.limite_nominal_kg ?? '____'} kg</td>
            <td style="font-size:9.5px;color:#475569;">Por sexo y grupo de edad: 7 kg menores de 18; 20 kg mujeres 18–45; 25 kg hombres 18–45; 15 kg mujeres mayores de 45; 20 kg hombres mayores de 45.</td>
          </tr>
          <tr>
            <td class="cell-label">Límite que determina esta valoración</td>
            <td style="font-weight:700;font-size:12px;">${a.limite_determinado_kg ?? '____'} kg</td>
            <td style="font-size:9.5px;color:#475569;">Para mayores de 45 años la nota de la Tabla 1 remite a esta valoración, que puede determinar un valor menor o mayor al nominal. Si es distinto del nominal, asentar la razón clínica.</td>
          </tr>
          <tr>
            <td class="cell-label">Razón del ajuste</td>
            <td colspan="2">${a.razon_ajuste || ''}</td>
          </tr>
        </table>

        <div style="font-weight:700;margin-bottom:4px;">5. Conclusión</div>
        <table>
          <tr>
            <td colspan="2" style="line-height:1.7;">
              <div>${this.chk(a.conclusion === 'apto_sin_restriccion')} Apto sin restricción</div>
              <div>${this.chk(a.conclusion === 'apto_con_recomendaciones')} Apto con recomendaciones</div>
              <div>${this.chk(a.conclusion === 'apto_con_restriccion_temporal')} Apto con restricción temporal — vigencia hasta: <u>${a.vigencia_restriccion_hasta || '____________________'}</u></div>
              <div>${this.chk(a.conclusion === 'requiere_estudio_especializado')} Requiere estudio o valoración especializada</div>
              <div>${this.chk(a.conclusion === 'no_apto_temporal')} No apto temporal para el puesto</div>
            </td>
          </tr>
          <tr>
            <td class="cell-label" style="width:36%;">Recomendaciones al puesto</td>
            <td>${a.recomendaciones_puesto || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Restricciones vinculantes (peso, frecuencia, maniobra)</td>
            <td>${a.restricciones_vinculantes || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Periodo de recuperación, si procede (numeral 9.5)</td>
            <td>${a.periodo_recuperacion || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Fecha de próxima valoración</td>
            <td>${a.fecha_proxima_valoracion || ''}</td>
          </tr>
        </table>

        <div class="sig-grid">
          <div class="sig-col">
            ${a.firma_medico_valorador_data ? `<img class="sig-img" src="${a.firma_medico_valorador_data}">` : ''}
            <div class="sig-line">
              <strong>Nombre y firma del médico que practica la valoración</strong><br>
              ${a.medico_valorador_nombre || ''}<br>
              Cédula profesional: <u>${a.medico_valorador_cedula || '____________'}</u><br>
              <span style="color:#64748b;font-size:9px;">Responde por los apartados 1 a 3 · Fecha: ${a.fecha_bloque1 || '____/____/______'}</span>
            </div>
          </div>
          <div class="sig-col">
            ${a.firma_trabajador_data ? `<img class="sig-img" src="${a.firma_trabajador_data}">` : ''}
            <div class="sig-line">
              <strong>Firma del trabajador</strong><br>
              (enterado del resultado)<br>
              <span style="color:#64748b;font-size:9px;">Fecha: ${a.fecha_firma_trabajador || '____/____/______'}</span>
            </div>
          </div>
          <div class="sig-col">
            ${a.firma_medica_designada_data ? `<img class="sig-img" src="${a.firma_medica_designada_data}">` : ''}
            <div class="sig-line">
              <strong>${a.medica_designada_nombre || 'Dra. Gloria Blaza Enciso Medina'} · céd. prof. ${a.medica_designada_cedula || '3838313'}</strong><br>
              Médica designada conforme al renglón D-081<br>
              <span style="color:#64748b;font-size:8.5px;">DETERMINA Y RESPONDE POR LOS APARTADOS 4 Y 5.<br>Fecha de determinación: ${a.fecha_determinacion || '____/____/______'}</span><br>
              <span style="font-size:8.5px;">
                ${this.chk(a.modalidad_determinacion === 'personalmente')} La valoración la practiqué personalmente &nbsp;
                ${this.chk(a.modalidad_determinacion === 'sobre_cedula')} Determiné sobre la cédula practicada por el médico que firma a la izquierda
              </span>
            </div>
          </div>
        </div>
        <div style="text-align:center;font-size:9.5px;color:#64748b;margin-top:10px;">Sin la firma de la médica designada la cédula está incompleta y la valoración no puede asentarse como practicada.</div>
        <div class="footer-meta">Documento clínico · expediente del trabajador · regla SMD-PVME-17</div>
      </div>
    </body></html>`;
  }

  private buildPrintAnexoC(): string {
    const c = this.anexoC;
    const limKg = c.limite_masa_kg || '____';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Anexo C - ${c.no_empleado}</title><style>${this.getCommonPrintStyles()}</style></head><body>
      <!-- PÁGINA 1 -->
      <div class="page">
        <div class="top-meta">ANEXO C · información de riesgos · SST – ANX – C – 01 · 24 / 09 / 2026</div>
        <h1>ANEXO C INFORMACIÓN DE RIESGOS POR MANEJO MANUAL DE CARGAS</h1>
        <div class="sub-meta">SST – ANX – C – 01 · Formato <u>${c.formato_num || '____'}</u> de ${c.formato_total || '203'} · ORIGINAL: expediente de SST</div>

        <table>
          <tr>
            <td class="cell-label" style="width:18%;">No. de empleado</td>
            <td style="width:32%;">${c.no_empleado || ''}</td>
            <td class="cell-label" style="width:18%;">Turno</td>
            <td style="width:32%;">${c.turno || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Trabajador</td>
            <td>${c.trabajador || ''}</td>
            <td class="cell-label">Área</td>
            <td>${c.area || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Puesto</td>
            <td>${c.puesto || ''}</td>
            <td class="cell-label">Nivel de riesgo del puesto</td>
            <td>${c.nivel_riesgo || ''}</td>
          </tr>
        </table>

        <h2>1 El peso máximo que usted puede manejar</h2>
        <table>
          <tr>
            <td class="cell-label" style="width:34%;">Grupo que le corresponde en la Tabla 1</td>
            <td>${c.grupo_tabla1 || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">SU LÍMITE DE MASA</td>
            <td style="font-size:13px;font-weight:700;"><u>&nbsp;&nbsp;${limKg}&nbsp;&nbsp;</u> kg</td>
          </tr>
          <tr>
            <td class="cell-label">Masa mayor que se maneja en su puesto</td>
            <td>${c.masa_mayor_puesto_kg || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Situación de su puesto frente a su límite</td>
            <td>${c.situacion_frente_limite || ''}</td>
          </tr>
        </table>

        <h2>2 Las actividades de su puesto que implican manejo de cargas</h2>
        <div style="margin: 4px 0 8px 12px; line-height: 1.7;">
          <div>● <u>${c.actividad_1 || '________________________________________________________________________________'}</u></div>
          <div>● <u>${c.actividad_2 || '________________________________________________________________________________'}</u></div>
          <div>● <u>${c.actividad_3 || '________________________________________________________________________________'}</u></div>
        </div>
        <table>
          <tr>
            <td class="cell-label" style="width:34%;">Qué manipula</td>
            <td>${c.que_manipula || ''}</td>
          </tr>
          <tr>
            <td class="cell-label">Tipo de esfuerzo</td>
            <td>${c.tipo_esfuerzo || ''}</td>
          </tr>
        </table>

        <h2>3 Qué le puede pasar a su salud</h2>
        <p style="margin:0 0 8px 0;text-align:justify;">
          El manejo manual de cargas sin la técnica y las medidas adecuadas produce trastornos musculoesqueléticos: dolor y lesión de la espalda baja, lesiones de disco, dolor de cuello, lesiones del hombro, codo de tenista, síndrome del túnel del carpo y hernias. Se desarrollan de forma gradual, por acumulación a lo largo de meses o años, y no necesariamente a partir de un solo esfuerzo. Por eso la molestia se reporta cuando aparece, no cuando ya impide trabajar.
        </p>

        <h2>4 Cómo se previene</h2>
        <table>
          <tr>
            <td class="cell-label" style="width:28%;">Técnica</td>
            <td>
              Acerque la carga al cuerpo antes de levantarla.<br>
              Flexione las rodillas, no la cintura. Espalda recta, fuerza con las piernas.<br>
              No gire el tronco con la carga en las manos: mueva los pies.<br>
              Baje la carga de forma controlada, flexionando de nuevo las rodillas.
            </td>
          </tr>
          <tr>
            <td class="cell-label">Está prohibido</td>
            <td>
              Manejar cargas por encima de sus <strong><u>&nbsp;${limKg}&nbsp;</u> kg</strong> sin ayuda mecánica o sin el número de personas establecido.<br>
              Realizar en solitario las maniobras que el Procedimiento reserva a dos o más personas.<br>
              Manipular cargas con postura forzada, sobre piso mojado o con fatiga excesiva.<br>
              Transportar cargas inestables sin asegurarlas.
            </td>
          </tr>
          <tr>
            <td class="cell-label">Ayudas mecánicas de la unidad</td>
            <td>
              Polipasto eléctrico de cadena H-LIFT de 500 kg: uno en almacén y otro en calle de servicio.<br>
              Patín hidráulico NOVAL de 3 toneladas: taller de mantenimiento. Es el que se usa para deslizar la rejilla de agua sin levantarla.<br>
              Ocho diablos de 200 kg distribuidos en áreas diversas.<br>
              La plataforma GENIE NO es ayuda para cargas: eleva personas, 136 kg y un solo ocupante.
            </td>
          </tr>
          <tr>
            <td class="cell-label">La que le corresponde usar a usted</td>
            <td>${c.ayuda_mecanica_corresponde || ''}</td>
          </tr>
        </table>
        <div class="footer-meta">ORIGINAL: expediente de SST · COPIA: trabajador · el jefe de área firma como testigo y no conserva ejemplar · regla SMD-PVME-17</div>
      </div>

      <!-- PÁGINA 2 -->
      <div class="page">
        <div class="top-meta">ANEXO C · información de riesgos · SST – ANX – C – 01 · 24 / 09 / 2026</div>
        <h2>5 Su vigilancia a la salud</h2>
        <table>
          <tr>
            <td class="cell-label" style="width:34%;">Su valoración está programada para</td>
            <td>
              <strong>${c.cita_fecha || '____ / ____ / ______'} · ${c.cita_hora || '______'} h</strong> &nbsp; Sede: <u>${c.cita_sede || '______________________'}</u>. Es una valoración musculoesquelética, no un examen general. Dura alrededor de 30 minutos.
            </td>
          </tr>
          <tr>
            <td class="cell-label">Siguiente valoración</td>
            <td>
              <strong>${c.siguiente_valoracion_fecha || '____ / ____ / ______'}</strong> &nbsp; La periodicidad depende del nivel de riesgo de su puesto. Se adelanta si cambia su puesto, su carga o su estado de salud.
            </td>
          </tr>
        </table>

        <p style="margin:8px 0 12px 0;text-align:justify;">
          <strong>No espere a su cita.</strong> Si presenta dolor, molestia, hormigueo o pérdida de fuerza que atribuya a su trabajo, acuda al Servicio Médico el mismo día. Reportarlo a tiempo es lo que permite corregir la tarea antes de que la lesión se establezca, y no tiene ninguna consecuencia sobre su empleo.
        </p>

        <h2>6 Acuse de recibo</h2>
        <p style="margin:0 0 20px 0;text-align:justify;">
          Declaro que se me informó el peso máximo que puedo manejar conforme a la Tabla 1 de la NOM-036-1-STPS-2018, el nivel de riesgo de mi puesto, las actividades de mi puesto que implican manejo de cargas, los daños que la exposición puede ocasionar a mi salud, las medidas de prevención y prohibiciones aplicables, y la fecha de mi valoración médica; y que se me dio oportunidad de preguntar.
        </p>

        <div class="sig-grid">
          <div class="sig-col">
            ${c.firma_trabajador_data ? `<img class="sig-img" src="${c.firma_trabajador_data}">` : ''}
            <div class="sig-line">Firma del trabajador<br><small>${c.trabajador || ''}</small></div>
          </div>
          <div class="sig-col">
            ${c.firma_informo_data ? `<img class="sig-img" src="${c.firma_informo_data}">` : ''}
            <div class="sig-line"><strong>Informó</strong><br>Nombre, cargo y firma<br><small>${c.informo_nombre_cargo || ''}</small></div>
          </div>
          <div class="sig-col">
            ${c.firma_testigo_data ? `<img class="sig-img" src="${c.firma_testigo_data}">` : ''}
            <div class="sig-line"><strong>Testigo — jefe de área</strong><br><small>${c.testigo_jefe_nombre || ''}</small><br>Fecha: ${c.fecha_acuse || '____ / ____ / ______'}</div>
          </div>
        </div>
        <div class="footer-meta">ORIGINAL: expediente de SST · COPIA: trabajador · el jefe de área firma como testigo y no conserva ejemplar · regla SMD-PVME-17</div>
      </div>
    </body></html>`;
  }
}
