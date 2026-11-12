import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ServicioMedicoService } from '../../../services/servicio-medico';

@Component({
  selector: 'app-servicio-medico-cuestionario-publico',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './servicio-medico-cuestionario-publico.html',
  styleUrl: './servicio-medico-cuestionario-publico.scss'
})
export class ServicioMedicoCuestionarioPublico implements OnInit, OnDestroy {
  token: string = '';
  isLoading: boolean = true;
  errorState: 'invalid' | 'expired' | 'cancelled' | 'rejected' | null = null;
  isSubmitted: boolean = false;
  isSubmitting: boolean = false;

  preregistroData: any = null;
  consentStatus: 'accepted' | 'privacy_accepted' | 'rejected' | null = null;
  consentStep: 1 | 2 = 1;
  privacyNoticeRead: boolean = false;
  sensitiveConsentRead: boolean = false;
  isSavingConsent: boolean = false;

  // Autoguardado (1500ms debounce)
  lastSavedAt: string | null = null;
  isSavingDraft: boolean = false;
  private draftSubject = new Subject<void>();
  private draftSub?: Subscription;

  // Catálogos Exactos del Cuestionario de Historia Clínica (Centro Libanés) — actualizables desde settings
  parentescos: string[] = ['Padre', 'Madre', 'Abuelo(a)', 'Hijo(a)', 'Hermano(a)', 'Esposo(a)', 'Otro'];
  gruposSanguineos: string[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  enfermedadesActualesCat: string[] = [
    'Cardiovasculares',
    'Crónicas',
    'Dermatológicas',
    'Digestivas',
    'Infecciosas',
    'Metabólicas',
    'Musculoesqueléticas',
    'Respiratorias',
    'Salud mental',
    'Otras'
  ];
  tratamientosCat: string[] = [
    'Farmacológicos',
    'Menores',
    'Preventivos',
    'Terapias',
    'Otras'
  ];
  enfermedadesPersonalesCat: string[] = [
    'Ninguna',
    'Cáncer (benigno, maligno, mama, cervicouterino, próstata)',
    'Cardiopatías (HTA, isquémica, ECV, IC, reumática, congénita, miocardiopatía, arritmias, endocarditis, pericarditis)',
    'Diabetes',
    'Enfermedades autoinmunes (lupus, artritis reumatoide, esclerosis múltiple)',
    'Enfermedades respiratorias crónicas (asma, EPOC, hipertensión pulmonar)',
    'Hepatopatías (cirrosis, hepatitis, hígado graso)',
    'Hipertensión arterial',
    'Nefropatías (ERC, litiasis, glomerulonefritis)',
    'Trastornos psiquiátricos (depresión, TDAH, ansiedad)',
    'Otras'
  ];
  alergiasCat: string[] = [
    'Ninguna',
    'Alergias a medicamentos',
    'Alergias a picaduras de insectos',
    'Alergias alimentarias',
    'Alergias cutáneas (por contacto)',
    'Alergias respiratorias',
    'Otras'
  ];
  enfermedadesFamiliaresCat: string[] = [
    'Ninguna',
    'Cáncer',
    'Cardiopatías',
    'Diabetes',
    'Enfermedades autoinmunes',
    'Enfermedades respiratorias crónicas',
    'Hepatopatías',
    'Hipertensión arterial',
    'Nefropatías',
    'Trastornos psiquiátricos',
    'Otras'
  ];
  frecuenciasConsumoCat: string[] = [
    'Nunca',
    'Rara vez (menos de una vez al año)',
    'Ocasionalmente (1–3 veces al año)',
    'Frecuentemente (1–2 veces por mes)',
    'Muy frecuentemente (3–5 veces por mes)',
    'Diario o casi diario',
    'Otras'
  ];
  frecuenciasActividadFisicaCat: string[] = [
    'Nunca',
    'Rara vez (menos de una vez al mes)',
    'Ocasionalmente (1–2 veces por mes)',
    'Regularmente (1–2 veces por semana)',
    'Frecuentemente (3–5 veces por semana)',
    'Diario o casi diario'
  ];
  alimentacionCat: string[] = [
    'Muy buena – Dieta balanceada, rica en frutas, verduras, proteínas y baja en procesados',
    'Buena – Alimentación generalmente saludable, con algunos excesos ocasionales',
    'Regular – Alimentación poco balanceada, consumo frecuente de alimentos procesados',
    'Mala – Dieta alta en grasas, azúcares y alimentos ultraprocesados',
    'Muy mala – Alimentación desordenada, con omisión de comidas o consumo excesivo de comida chatarra',
    'Bajo supervisión nutricional – Sigue un plan alimenticio indicado por un profesional'
  ];
  vacunasCat: string[] = [
    'Ninguna',
    'COVID-19',
    'Hepatitis B',
    'Influenza',
    'Neumococo',
    'Sarampión, Rubéola y Parotiditis (SRP)',
    'Tétanos y Difteria (Td o Tdap)',
    'Otras'
  ];
  mascotasCat: string[] = [
    'Ave (perico, canario, loro, etc.)',
    'Cerdo miniatura',
    'Conejo',
    'Gato',
    'Hámster',
    'Hurón',
    'Perro',
    'Pez',
    'Reptil (iguana, serpiente, etc.)',
    'Tortuga',
    'Otras'
  ];
  estudiosCat: string[] = [
    'No',
    'Biometría hemática (hemograma completo)',
    'Examen general de orina (EGO)',
    'Glucosa en ayunas',
    'Hemoglobina glicosilada (HbA1c)',
    'Perfil lipídico',
    'Perfil tiroideo (TSH, T3, T4)',
    'Prueba de anticuerpos antinucleares (ANA)',
    'Prueba ELISA',
    'Pruebas de función hepática',
    'Química sanguínea',
    'Otras'
  ];
  tiposSeguroCat: string[] = [
    'Seguro de Gastos Médicos Mayores',
    'Seguro de Gastos Médicos Menores',
    'Seguro público (IMSS, ISSSTE)',
    'Otro'
  ];
  motivosVisitaCat: string[] = [
    'Actualización de datos',
    'Registro nuevo de información médica'
  ];

  // Catálogos del Cuestionario de Evento Simplificado (Externos / Curso de Verano)
  alergiasSimplificadoCat: string[] = [
    'Medicamentos',
    'Alimentos',
    'Picaduras de insectos',
    'Otra'
  ];
  sintomasSimplificadoCat: string[] = [
    'Ninguno',
    'Conjuntivitis (ojos rojos con secreción)',
    'Diarrea',
    'Dolor abdominal',
    'Dolor de garganta',
    'Escurrimiento nasal',
    'Erupciones en la piel',
    'Fiebre',
    'Tos',
    'Vómitos'
  ];

  // Configuración dinámica de textos legales y variantes
  settings: any = {
    header_privacy_title: 'Aviso Integral de Privacidad',
    header_consent_title: 'Aviso de privacidad y consentimiento',
    questionnaire_main_title: 'Cuestionario de Historia Clínica',
    simplified_main_title: 'Cuestionario de Salud — Invitado a Evento',
    pvme_main_title: 'Vigilancia Médica NOM-036-1-STPS-2018 (Anexo B y Anexo C)',
    institution_subtitle: 'Centro Libanés A.C. · Servicio Médico',
    privacy_notice_title: 'AVISO INTEGRAL DE PRIVACIDAD PARA ASPIRANTES Y COLABORADORES DE CENTRO LIBANÉS, A.C.',
    privacy_notice_subtitle: 'Antes de otorgar tu consentimiento, lee con atención el Aviso Integral de Privacidad.',
    privacy_notice_checkbox: 'He leído y acepto el presente Aviso Integral de Privacidad de Centro Libanés, A.C.',
    privacy_notice_html: '',
    privacy_applies_to: ['empleado', 'prospecto_empleado'],
    sensitive_consent_title: 'CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES SENSIBLES',
    sensitive_consent_subtitle: 'Lee con atención el siguiente texto. Para continuar con el cuestionario médico debes otorgar tu consentimiento expreso.',
    sensitive_consent_checkbox: 'He leído y acepto los términos antes descritos, otorgando mi consentimiento expreso para el tratamiento de mis datos personales sensibles de salud.',
    sensitive_consent_html: '',
    sec1_title: '1. Datos personales',
    sec1_subtitle: 'Información básica de identificación.',
    sec2_title: '2. Estado de salud actual',
    sec2_q_enfermo: '¿Actualmente se encuentra enfermo?*',
    sec3_title: '3. Antecedentes personales',
    sec3_q_enfermedades: '¿Ha tenido o tiene alguna de las siguientes enfermedades?*',
    sec3_q_medicamento: '¿Tomas algún medicamento?',
    sec3_q_hospitalizado: '¿Ha sido hospitalizado o intervenido quirúrgicamente?*',
    sec3_q_traumatismo: '¿Has tenido algún traumatismo grave que requiera férulas o yeso?*',
    sec3_q_alergias: 'Seleccione si cuenta con una condición de alergia*',
    sec3_q_transfusion: '¿Alguna vez ha tenido una transfusión sanguínea?*',
    sec4_title: '4. Antecedentes familiares',
    sec4_subtitle: 'Solo familiares directos: padres, hermanos o abuelos.',
    sec4_q_familiares: '¿Hay antecedentes familiares de enfermedades hereditarias o crónicas?',
    sec5_title: '5. Hábitos y estilo de vida',
    sec6_title: '6. Estudios de laboratorio',
    sec6_q_estudios: '¿Cuenta con estudios de laboratorio recientes?',
    sec7_title: '7. Información complementaria',
    sec7_notas_hint: 'Por favor escriba alguna otra información relevante de su salud que no contemplamos en este cuestionario.',
    footer_submit_note: 'Al enviar, tu información será revisada por el equipo médico antes de tu cita.',
    footer_submit_btn: 'Enviar cuestionario',
    simplified_disclaimer_title: 'Leyenda de responsabilidad y compromiso',
    simplified_disclaimer_text: 'Conscientes de que la salud y el bienestar de los participantes es una prioridad compartida, declaro que la información proporcionada en este cuestionario es verdadera, completa y basada en el estado real de salud. Entiendo que omitir o proporcionar información incorrecta puede poner en riesgo la salud propia y la de los demás participantes y del personal del evento. Me comprometo a informar cualquier cambio en el estado de salud y a no acudir al evento cuando presente signos o síntomas de enfermedad, con el objetivo de prevenir la propagación de virus y bacterias y contribuir a un entorno seguro para todos.',
    simplified_disclaimer_checkbox: 'Declaro que la información es verdadera y acepto la responsabilidad descrita.',
    pvme_anexo_c_title: '3. Anexo C · Información de Riesgos por Manejo Manual de Cargas',
    pvme_anexo_c_html: '',
    pvme_anexo_c_checkbox: 'Manifiesto que recibí por escrito y me fue explicada la información sobre el peso máximo que puedo cargar según mi sexo y edad (Tabla 1 de la NOM-036-1-STPS-2018), los riesgos a la salud, las medidas de prevención, prohibiciones y ayudas mecánicas disponibles, y que me comprometo a aplicarlas y reportar cualquier molestia al Servicio Médico.',
    thank_you_title: '¡Gracias!',
    thank_you_message: 'Recibimos tu información. El equipo médico la revisará antes de tu cita. Si necesitas ajustar algo, comunícate con el Servicio Médico al ext. 3921.',
    simplified_thank_you_message: 'Recibimos la información. El Servicio Médico la revisará antes del evento.'
  };

  showBirthdateEditor: boolean = false;

  readonly nordicRegionsCat: { key: string; label: string }[] = [
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

  // Modelo de Respuestas JSONB
  r: any = {
    nombre_completo: '',
    fecha_nacimiento: '',
    edad: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_parentesco: 'Padre',
    contacto_emergencia_telefono: '',
    grupo_sanguineo: 'O+',

    // Campos exclusivos de Vigilancia NOM-036 (Anexo B + Anexo C)
    anexo_b: {
      fecha: new Date().toISOString().slice(0, 10),
      regiones: [
        { key: 'cuello', label: 'Cuello', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'hombro_derecho', label: 'Hombro derecho', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'hombro_izquierdo', label: 'Hombro izquierdo', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'codo_antebrazo', label: 'Codo o antebrazo', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'muneca_mano', label: 'Muñeca o mano', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'espalda_alta', label: 'Espalda alta (dorsal)', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'espalda_baja', label: 'Espalda baja (lumbar)', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'cadera_muslo', label: 'Cadera o muslo', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'rodilla', label: 'Rodilla', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 },
        { key: 'tobillo_pie', label: 'Tobillo o pie', molestia_12m: 'No', impidio_trabajo: 'No', molestia_7d: 'No', intensidad: 0 }
      ],
      atribuye_actividad: '',
      ha_recibido_tratamiento: ''
    },
    anexo_c: {
      turno: 'Matutino',
      area: '',
      puesto: '',
      actividad_1: '',
      actividad_2: '',
      actividad_3: '',
      que_manipula: '',
      acepta_acuse_riesgos: false
    },

    // Campos exclusivos de CuestionarioEventoSimplificado (externo)
    responsable_nombre: '',
    telefono_contacto: '',
    telefono_alterno: '',
    padece_enfermedad_cronica: 'No',
    enfermedad_cronica_cual: '',
    tiene_alergia_conocida: 'No',
    alergias_simplificado: [] as string[],
    alergia_otra_especifique: '',
    toma_medicamento_continuo: 'No',
    medicamento_continuo_detalle: '',
    hospitalizado_ultimo_anio: 'No',
    hospitalizado_ultimo_anio_explique: '',
    sintomas_ultimos_14_dias: ['Ninguno'] as string[],
    contacto_enfermo_reciente: 'No',
    contacto_enfermo_especifique: '',
    condicion_especial_cuidado: 'No',
    condicion_especial_describa: '',
    autoriza_atencion_basica: '',
    acepta_leyenda_responsabilidad: false,
    comentarios_adicionales: '',

    enfermo_actualmente: 'No',
    enfermedad_actual: [] as string[],
    enfermedad_actual_otra: '',
    sintomas_desde: '',
    recibio_tratamiento: 'No',
    tratamiento_recibido: [] as string[],
    tratamiento_recibido_otro: '',

    enfermedades_personales: ['Ninguna'] as string[],
    enfermedades_personales_otra: '',
    enfermedades_desde: '',
    toma_medicamento: 'No',
    medicamentos_actuales: '',
    hospitalizado_o_cirugia: 'No',
    hospitalizacion_motivo: '',
    hospitalizacion_fecha: '',
    traumatismo_grave: 'No',
    traumatismo_evento: '',
    traumatismo_fecha: '',
    transfusion_sanguinea: 'No',
    transfusion_motivo: '',
    transfusion_fecha: '',
    alergias_tipo: ['Ninguna'] as string[],
    alergias_tipo_otra: '',
    alergias_reaccion: '',

    antecedentes_familiares_si: 'No',
    enfermedades_familiares: ['Ninguna'] as string[],
    enfermedades_familiares_otra: '',

    fuma: 'No',
    fuma_desde: '',
    fuma_cantidad: '',
    alcohol: 'No',
    alcohol_frecuencia: 'Ocasionalmente (1–3 veces al año)',
    drogas: 'Nunca',
    drogas_cuales: '',
    drogas_ultima_vez: '',
    actividad_fisica: 'No',
    actividad_fisica_frecuencia: '',
    alimentacion: 'Buena – Alimentación generalmente saludable, con algunos excesos ocasionales',
    vacunas_ultimo_anio: ['Ninguna'] as string[],
    vacunas_otra: '',
    tiene_mascotas: 'No',
    numero_mascotas: '',
    tipo_mascotas: [] as string[],
    tipo_mascotas_otra: '',
    ultima_desparasitacion: '',

    estudios_laboratorio: ['No'] as string[],
    estudios_laboratorio_otra: '',
    estudios_dato_relevante: 'No',
    estudios_dato_relevante_detalle: '',

    cuenta_seguro_medico: 'No',
    tipo_seguro: [] as string[],
    tipo_seguro_otro: '',
    seguro_medico_aseguradora: '',
    tipo_visita: 'Actualización de datos',
    motivo_visita: 'Actualización de datos',
    notas_adicionales: '',
    observaciones_importantes: ''
  };

  constructor(
    private route: ActivatedRoute,
    private servicioMedico: ServicioMedicoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.setupAutosave();
    this.loadQuestionnaire();
  }

  ngOnDestroy(): void {
    this.draftSub?.unsubscribe();
  }

  loadQuestionnaire(): void {
    if (!this.token) {
      this.errorState = 'invalid';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.servicioMedico.getPublicCuestionario(this.token).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!res?.success || !res.data) {
          this.errorState = 'invalid';
          this.cdr.detectChanges();
          return;
        }

        const d = res.data;
        this.preregistroData = d;
        if (d.settings && typeof d.settings === 'object') {
          this.settings = { ...this.settings, ...d.settings };
          if (['socio', 'prospecto_socio', 'externo'].includes(d.tipo_destinatario)) {
            if (d.settings.sensitive_consent_socio_title) {
              this.settings.sensitive_consent_title = d.settings.sensitive_consent_socio_title;
            }
            if (d.settings.sensitive_consent_socio_subtitle) {
              this.settings.sensitive_consent_subtitle = d.settings.sensitive_consent_socio_subtitle;
            }
            if (d.settings.sensitive_consent_socio_checkbox) {
              this.settings.sensitive_consent_checkbox = d.settings.sensitive_consent_socio_checkbox;
            }
            const currentConsentHtml = String(this.settings.sensitive_consent_html || '');
            if (
              currentConsentHtml.includes('Aspirantes y Colaboradores') ||
              currentConsentHtml.includes('médica ocupacional')
            ) {
              this.settings.sensitive_consent_html = d.settings.sensitive_consent_socio_html || '';
            }
          }
          if (Array.isArray(d.settings.cat_parentescos) && d.settings.cat_parentescos.length > 0) {
            this.parentescos = d.settings.cat_parentescos;
          }
          if (Array.isArray(d.settings.cat_enfermedades_actuales) && d.settings.cat_enfermedades_actuales.length > 0) {
            this.enfermedadesActualesCat = d.settings.cat_enfermedades_actuales;
          }
          if (Array.isArray(d.settings.cat_tratamientos) && d.settings.cat_tratamientos.length > 0) {
            this.tratamientosCat = d.settings.cat_tratamientos;
          }
          if (Array.isArray(d.settings.cat_enfermedades_personales) && d.settings.cat_enfermedades_personales.length > 0) {
            this.enfermedadesPersonalesCat = d.settings.cat_enfermedades_personales;
          }
          if (Array.isArray(d.settings.cat_alergias) && d.settings.cat_alergias.length > 0) {
            this.alergiasCat = d.settings.cat_alergias;
          }
          if (Array.isArray(d.settings.cat_enfermedades_familiares) && d.settings.cat_enfermedades_familiares.length > 0) {
            this.enfermedadesFamiliaresCat = d.settings.cat_enfermedades_familiares;
          }
          if (Array.isArray(d.settings.cat_vacunas) && d.settings.cat_vacunas.length > 0) {
            this.vacunasCat = d.settings.cat_vacunas;
          }
          if (Array.isArray(d.settings.cat_mascotas) && d.settings.cat_mascotas.length > 0) {
            this.mascotasCat = d.settings.cat_mascotas;
          }
          if (Array.isArray(d.settings.cat_estudios) && d.settings.cat_estudios.length > 0) {
            this.estudiosCat = d.settings.cat_estudios;
          }
          if (Array.isArray(d.settings.cat_tipos_seguro) && d.settings.cat_tipos_seguro.length > 0) {
            this.tiposSeguroCat = d.settings.cat_tipos_seguro;
          }
          if (Array.isArray(d.settings.cat_motivos_visita) && d.settings.cat_motivos_visita.length > 0) {
            this.motivosVisitaCat = d.settings.cat_motivos_visita;
          }
          if (Array.isArray(d.settings.cat_alergias_simplificado) && d.settings.cat_alergias_simplificado.length > 0) {
            this.alergiasSimplificadoCat = d.settings.cat_alergias_simplificado;
          }
          if (Array.isArray(d.settings.cat_sintomas_simplificado) && d.settings.cat_sintomas_simplificado.length > 0) {
            this.sintomasSimplificadoCat = d.settings.cat_sintomas_simplificado;
          }
        }
        this.privacyNoticeRead = !!d.privacy_notice_accepted;
        this.sensitiveConsentRead = !!d.sensitive_consent_accepted;

        if (d.consent_status === 'accepted' && d.sensitive_consent_accepted) {
          this.consentStatus = 'accepted';
          this.consentStep = 2;
        } else if (!this.requiresEmployeePrivacyNotice || d.privacy_notice_accepted) {
          this.consentStatus = d.privacy_notice_accepted ? 'privacy_accepted' : (d.consent_status || null);
          this.consentStep = 2;
        } else {
          this.consentStatus = d.consent_status || null;
          this.consentStep = 1;
        }

        if (d.estado === 'expirado') {
          this.errorState = 'expired';
        } else if (d.estado === 'cancelado') {
          this.errorState = 'cancelled';
        } else if (d.estado === 'rechazado') {
          this.errorState = 'rejected';
        } else if (d.estado === 'en_revision' || d.estado === 'sincronizado') {
          this.isSubmitted = true;
        }

        if (d.respuestas && typeof d.respuestas === 'object') {
          this.r = { ...this.r, ...d.respuestas };
        }
        const mapParentesco: Record<string, string> = {
          Abuelo: 'Abuelo(a)',
          Hijo: 'Hijo(a)',
          Hermano: 'Hermano(a)',
          Esposo: 'Esposo(a)'
        };
        if (this.r.contacto_emergencia_parentesco && mapParentesco[this.r.contacto_emergencia_parentesco]) {
          this.r.contacto_emergencia_parentesco = mapParentesco[this.r.contacto_emergencia_parentesco];
        }
        if (Array.isArray(this.r.enfermedades_familiares)) {
          this.r.enfermedades_familiares = this.r.enfermedades_familiares.map((item: string) =>
            item.replace(/\s*\(.*\)$/, '')
          );
        }
        if (!this.r.nombre_completo && d.nombre_destinatario) {
          this.r.nombre_completo = d.nombre_destinatario;
        }
        if (!this.r.fecha_nacimiento && d.fecha_nacimiento) {
          this.r.fecha_nacimiento = d.fecha_nacimiento;
        }
        this.recalculateAge();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorState = 'invalid';
        this.cdr.detectChanges();
      }
    });
  }

  get requiresEmployeePrivacyNotice(): boolean {
    const t = this.preregistroData?.tipo_destinatario;
    const appliesTo = Array.isArray(this.settings?.privacy_applies_to)
      ? this.settings.privacy_applies_to
      : ['empleado', 'prospecto_empleado'];
    return appliesTo.includes(t);
  }

  get isSocioRecipient(): boolean {
    const t = this.preregistroData?.tipo_destinatario;
    return !t || ['socio', 'prospecto_socio', 'externo'].includes(t);
  }

  get recipientRoleBadge(): string {
    const t = this.preregistroData?.tipo_destinatario;
    const cred = this.preregistroData?.credencial_destinatario || '';
    if (t === 'socio') {
      return cred ? `Socio · ${cred}` : 'Socio';
    }
    if (t === 'prospecto_socio') {
      return 'Prospecto a Socio';
    }
    if (t === 'empleado') {
      return cred ? `Colaborador · ${cred}` : 'Colaborador';
    }
    if (t === 'prospecto_empleado') {
      return 'Prospecto a Colaborador';
    }
    if (t === 'externo') {
      return 'Invitado / Participante';
    }
    return cred;
  }

  get isSimplifiedVariant(): boolean {
    return this.preregistroData?.questionnaire_variant === 'evento_simplificado';
  }

  get isPvmeVariant(): boolean {
    return this.preregistroData?.questionnaire_variant === 'pvme_nom036';
  }

  get isNombreReadonly(): boolean {
    const t = this.preregistroData?.tipo_destinatario;
    return (t === 'socio' || t === 'empleado') && !!this.preregistroData?.nombre_destinatario;
  }

  get isEdadReadonly(): boolean {
    const t = this.preregistroData?.tipo_destinatario;
    return t === 'socio' && !!this.preregistroData?.fecha_nacimiento;
  }

  recalculateAge(): void {
    if (!this.r.fecha_nacimiento) return;
    const birth = new Date(this.r.fecha_nacimiento);
    if (isNaN(birth.getTime())) return;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age >= 0 && age <= 120) {
      this.r.edad = String(age);
    }
  }

  onBirthdateChange(): void {
    this.recalculateAge();
    this.triggerDraftSave();
  }

  // ── Consentimiento Legal (2 Pasos: 1. Aviso de Privacidad, 2. Datos Sensibles) ──
  submitPrivacyConsent(decision: 'accepted' | 'rejected'): void {
    if (decision === 'accepted' && !this.privacyNoticeRead) {
      Swal.fire(
        'Aviso Integral de Privacidad',
        'Debes marcar la casilla "' + (this.settings.privacy_notice_checkbox || 'He leído y acepto el presente Aviso Integral de Privacidad de Centro Libanés, A.C.') + '" para continuar.',
        'warning'
      );
      return;
    }

    this.isSavingConsent = true;
    const sourceUrl = typeof window !== 'undefined' ? window.location.href : '';

    this.servicioMedico.savePublicConsent(this.token, {
      consent_step: 'privacy',
      consent_status: decision === 'accepted' ? 'privacy_accepted' : 'rejected',
      privacy_notice_accepted: decision === 'accepted',
      sensitive_consent_accepted: false,
      source_url: sourceUrl
    }).subscribe({
      next: () => {
        this.isSavingConsent = false;
        if (decision === 'accepted') {
          this.consentStatus = 'privacy_accepted';
          this.consentStep = 2;
        } else {
          this.consentStatus = 'rejected';
        }
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingConsent = false;
        Swal.fire('Error', 'No se pudo registrar la aceptación del Aviso de Privacidad. Intenta nuevamente.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  submitSensitiveConsent(decision: 'accepted' | 'rejected'): void {
    if (decision === 'accepted' && !this.sensitiveConsentRead) {
      Swal.fire(
        'Consentimiento de Datos Sensibles',
        'Debes marcar la casilla para otorgar tu consentimiento expreso antes de continuar al cuestionario.',
        'warning'
      );
      return;
    }

    this.isSavingConsent = true;
    const sourceUrl = typeof window !== 'undefined' ? window.location.href : '';

    this.servicioMedico.savePublicConsent(this.token, {
      consent_step: 'sensitive',
      consent_status: decision,
      privacy_notice_accepted: this.requiresEmployeePrivacyNotice ? true : this.privacyNoticeRead,
      sensitive_consent_accepted: decision === 'accepted',
      source_url: sourceUrl
    }).subscribe({
      next: () => {
        this.isSavingConsent = false;
        this.consentStatus = decision;
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingConsent = false;
        Swal.fire('Error', 'No se pudo registrar el consentimiento de datos sensibles. Intenta nuevamente.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── Autoguardado Silencioso ──────────────────────────────────────────────
  private setupAutosave(): void {
    this.draftSub = this.draftSubject.pipe(
      debounceTime(1500),
      switchMap(() => {
        if (!this.token || this.consentStatus !== 'accepted' || this.isSubmitted || this.errorState) {
          return of(null);
        }
        this.isSavingDraft = true;
        this.cdr.detectChanges();
        return this.servicioMedico.savePublicDraft(this.token, this.r).pipe(catchError(() => of(null)));
      })
    ).subscribe((res: any) => {
      this.isSavingDraft = false;
      if (res?.success && res.saved_at) {
        this.lastSavedAt = res.saved_at;
      }
      this.cdr.detectChanges();
    });
  }

  triggerDraftSave(): void {
    this.draftSubject.next();
  }

  // ── Helpers para Selectores tipo Chosen (ng-select con Tab, Backspace y escritura directa) ──
  onChosenFocus(select: any): void {
    if (!select) return;
    select._replaceOnFirstInput = true;
    if (typeof select.open === 'function' && !select.isOpen?.()) {
      select.open();
    }
    this.prepareChosenInput(select);
  }

  onChosenOpen(select: any): void {
    if (!select) return;
    select._replaceOnFirstInput = true;
    this.prepareChosenInput(select);
  }

  private prepareChosenInput(select: any): void {
    select.itemsList?.resetFilteredItems?.();
    select.itemsList?.markSelectedOrDefault?.(true);
    setTimeout(() => {
      const inputEl: HTMLInputElement | undefined = select?.searchInput?.()?.nativeElement;
      if (inputEl) {
        if (document.activeElement !== inputEl) {
          inputEl.focus();
        }
        const len = (inputEl.value || '').length;
        try {
          inputEl.setSelectionRange(len, len);
        } catch {}
      }
      this.cdr.detectChanges();
    });
  }

  onChosenKeydown(select: any, event: KeyboardEvent): void {
    if (!select || !event) return;
    const key = event.key;

    if (key === 'Backspace' || key === 'Delete' || key === 'ArrowLeft' || key === 'ArrowRight') {
      select._replaceOnFirstInput = false;
      return;
    }

    if (key === 'Tab') {
      if (select.isOpen?.() && !select._replaceOnFirstInput && select.itemsList?.markedItem) {
        select.select(select.itemsList.markedItem);
      }
      return;
    }

    // Si el usuario entra con Tab (puntero al final de "Padre|") y empieza a escribir directamente una letra,
    // limpiamos el texto previo justo antes de que se inserte la nueva letra para filtrar de inmediato.
    if (
      select._replaceOnFirstInput &&
      key &&
      key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      select._replaceOnFirstInput = false;
      const inputEl: HTMLInputElement | undefined = select?.searchInput?.()?.nativeElement;
      if (inputEl) {
        inputEl.value = '';
      }
    }
  }

  // ── Helpers para Checkboxes con opción excluyente ("Ninguna" / "No") ─────
  isSelected(listKey: string, option: string): boolean {
    const arr = Array.isArray(this.r[listKey]) ? this.r[listKey] : [];
    return arr.includes(option);
  }

  toggleMultiOption(listKey: string, option: string, exclusiveWord?: string): void {
    let arr: string[] = Array.isArray(this.r[listKey]) ? [...this.r[listKey]] : [];

    if (exclusiveWord && option === exclusiveWord) {
      arr = [exclusiveWord];
    } else {
      if (exclusiveWord) {
        arr = arr.filter(x => x !== exclusiveWord);
      }
      if (arr.includes(option)) {
        arr = arr.filter(x => x !== option);
      } else {
        arr.push(option);
      }
      if (arr.length === 0 && exclusiveWord) {
        arr = [exclusiveWord];
      }
    }

    this.r[listKey] = arr;
    this.triggerDraftSave();
  }

  // ── Envío Final del Cuestionario ─────────────────────────────────────────
  submitQuestionnaire(): void {
    if (this.isSubmitting) return;

    const nombre = (this.r.nombre_completo || '').trim();

    if (this.isPvmeVariant) {
      if (!nombre) {
        Swal.fire('Campo requerido', 'Por favor ingresa tu nombre completo.', 'warning');
        return;
      }
      if (!this.r.anexo_c?.acepta_acuse_riesgos) {
        Swal.fire(
          'Acuse de información requerido',
          'Debes confirmar la casilla de acuse de recibo de información de riesgos por manejo manual de cargas (Anexo C · NOM-036-1-STPS-2018).',
          'warning'
        );
        return;
      }
    } else if (this.isSimplifiedVariant) {
      if (!nombre) {
        Swal.fire('Campo requerido', 'Nombre es obligatorio', 'warning');
        return;
      }
      if (!(this.r.responsable_nombre || '').trim()) {
        Swal.fire('Campo requerido', 'Nombre del padre/madre/tutor es obligatorio', 'warning');
        return;
      }
      if (!(this.r.telefono_contacto || '').trim()) {
        Swal.fire('Campo requerido', 'Teléfono de contacto es obligatorio', 'warning');
        return;
      }
      if (!this.r.autoriza_atencion_basica) {
        Swal.fire('Campo requerido', 'Indique si autoriza atención médica básica', 'warning');
        return;
      }
      if (!this.r.acepta_leyenda_responsabilidad) {
        Swal.fire('Campo requerido', 'Debe aceptar la leyenda de responsabilidad y compromiso', 'warning');
        return;
      }
    } else {
      if (!nombre) {
        Swal.fire('Campo requerido', 'Por favor ingresa tu nombre completo.', 'warning');
        return;
      }

      const contacto = (this.r.contacto_emergencia_nombre || '').trim();
      const words = contacto.split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        Swal.fire('Contacto de emergencia', 'El nombre del contacto de emergencia debe incluir nombre y apellido (mínimo 2 palabras).', 'warning');
        return;
      }

      const tel = String(this.r.contacto_emergencia_telefono || '').replace(/\D+/g, '');
      if (tel.length !== 10) {
        Swal.fire('Teléfono de emergencia', 'El teléfono de emergencia debe tener exactamente 10 dígitos numéricos.', 'warning');
        return;
      }
      this.r.contacto_emergencia_telefono = tel;
    }

    this.isSubmitting = true;
    this.servicioMedico.submitPublicCuestionario(this.token, this.r).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res?.success) {
          this.isSubmitted = true;
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          Swal.fire('Atención', res?.message || 'No se pudo enviar el cuestionario.', 'warning');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        Swal.fire('Atención', err?.error?.message || 'Error al enviar el cuestionario.', 'error');
        this.cdr.detectChanges();
      }
    });
  }
}
