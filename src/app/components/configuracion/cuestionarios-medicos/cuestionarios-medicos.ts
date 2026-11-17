import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ServicioMedicoService } from '../../../services/servicio-medico';
import { AuthService } from '../../../services/auth.service';

export interface CatalogDef {
  key: string;
  label: string;
  sectionHint: string;
}

const DEFAULT_PRIVACY_HTML = `<p>Centro Libanés, A.C. (en lo sucesivo "Centro Libanés"), con domicilio en Hermes número 67, Colonia Crédito Constructor, Alcaldía Benito Juárez, Código Postal 03940, Ciudad de México, es responsable del tratamiento de sus datos personales, del uso que se les dé y de su debida protección, de conformidad con lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, su Reglamento y demás disposiciones aplicables.</p>
<p>La privacidad y confianza de nuestros aspirantes y colaboradores es muy importante para Centro Libanés. Por ello, queremos asegurarnos de que conozca cómo salvaguardamos la integridad, privacidad y protección de sus datos personales.</p>
<p>Para Centro Libanés resulta necesaria la recopilación de ciertos datos personales para llevar a cabo las actividades inherentes a su objeto social y dar cumplimiento a las obligaciones derivadas de la relación jurídica que exista con usted. En este sentido, tenemos el compromiso legal y social de implementar las medidas de seguridad administrativas, técnicas y físicas necesarias para proteger sus datos personales y garantizar su tratamiento legítimo, controlado e informado, conforme a las finalidades descritas en el presente Aviso Integral de Privacidad.</p>
<p>Lo anterior tiene como propósito brindarle pleno control y decisión sobre sus datos personales. Por ello, le recomendamos leer atentamente la siguiente información.</p>
<p class="fw-bold text-dark mt-3 mb-2">I. DATOS PERSONALES QUE PODRÁN SER RECABADOS</p>
<p>Para las finalidades señaladas en el presente Aviso Integral de Privacidad, Centro Libanés podrá recabar y tratar, de manera enunciativa más no limitativa, las siguientes categorías de datos personales:</p>
<p><strong>A. Datos de identificación:</strong> Nombre completo, domicilio, teléfono particular, celular y/o de trabajo, correo electrónico, estado civil, nacionalidad, firma, RFC, CURP, lugar y fecha de nacimiento, edad, fotografía, imagen, audio y video, identificación oficial, número de seguridad social, así como nombres de familiares, dependientes, beneficiarios y contactos de emergencia.</p>
<p><strong>B. Datos laborales:</strong> Ocupación, puesto, área o departamento, domicilio, teléfono y correo de trabajo, experiencia laboral, actividades extracurriculares, referencias laborales y personales, información relacionada con reclutamiento, selección, desempeño, capacitación y evaluaciones internas.</p>
<p><strong>C. Datos académicos:</strong> Trayectoria educativa, certificados, constancias de estudios, título profesional, número de cédula profesional y demás información académica relacionada con el perfil del titular.</p>
<p><strong>D. Datos patrimoniales y financieros:</strong> Cuentas bancarias, CLABE interbancaria, institución financiera, información para pago de nómina, compensaciones, prestaciones, seguros, afores, ingresos y egresos, así como datos de facturación.</p>
<p><strong>E. Datos personales sensibles:</strong> Estado de salud presente o futuro, historial médico, enfermedades o padecimientos, certificados y resultados médicos, información para atención de emergencias, estudios psicométricos, evaluaciones socioeconómicas y demás información sensible necesaria para la relación laboral o proceso de reclutamiento. Asimismo, tratándose de colaboradores activos, Centro Libanés podrá recabar y tratar certificados de incapacidad laboral, constancias médicas, avisos de enfermedad, dictámenes médicos, formatos emitidos por el Instituto Mexicano del Seguro Social, médicos tratantes, médicos del trabajo o autoridades competentes, así como demás documentación médica relacionada con la relación laboral vigente, con la finalidad de dar cumplimiento a obligaciones legales, laborales, de seguridad social, salud ocupacional, prevención de riesgos y demás disposiciones aplicables.</p>
<p><strong>F. Datos biométricos:</strong> Huella digital, reconocimiento facial y demás datos biométricos utilizados para control de acceso, control de asistencia, seguridad institucional y cumplimiento de políticas internas.</p>
<p class="fw-bold text-dark mt-3 mb-2">II. FINALIDADES PRIMARIAS DEL TRATAMIENTO</p>
<p>Los datos personales serán utilizados para las siguientes finalidades primarias, necesarias para la relación jurídica entre el titular y Centro Libanés:</p>
<p class="mb-1"><strong>A. Aspirantes:</strong></p>
<p class="mb-2">• Gestionar procesos de reclutamiento, selección, evaluación y contratación.</p>
<p class="mb-1"><strong>B. Colaboradores:</strong></p>
<p class="mb-2">• Integrar y administrar expedientes laborales.<br />• Elaborar contratos y documentación laboral.<br />• Gestionar altas, bajas y movimientos laborales.<br />• Administrar nómina, prestaciones, beneficios, pagos y obligaciones fiscales.<br />• Cumplir obligaciones ante autoridades laborales, fiscales y de seguridad social.<br />• Gestionar controles de acceso, asistencia y seguridad institucional.<br />• Operar plataformas y sistemas institucionales.<br />• Gestionar capacitación y desarrollo organizacional.<br />• Realizar evaluaciones internas.<br />• Atender situaciones médicas, emergencias y servicios de atención médica derivados de la relación laboral.<br />• Dar cumplimiento a políticas internas y protocolos de seguridad.</p>
<p class="fw-bold text-dark mt-3 mb-2">III. FINALIDADES SECUNDARIAS</p>
<p class="mb-2">Adicionalmente, Centro Libanés podrá utilizar los datos personales para:<br />• Aplicación de encuestas internas y elaboración de estadísticas institucionales.<br />• Evaluación y mejora de procesos internos.<br />• Programas institucionales de bienestar.<br />• Comunicación institucional interna.<br />• Invitaciones a actividades, eventos y programas de integración.<br />• Captación y uso de fotografías, audio y video para fines informativos y de memoria institucional de las actividades y eventos organizados por Centro Libanés, incluyendo su publicación en redes sociales, página de internet, boletines, revistas y demás medios institucionales.</p>
<p>En caso de que no desee que sus datos personales sean tratados para las finalidades secundarias antes señaladas, podrá manifestarlo conforme al procedimiento descrito en el presente Aviso Integral de Privacidad.</p>
<p class="fw-bold text-dark mt-3 mb-2">IV. TRANSFERENCIAS Y REMISIONES DE DATOS PERSONALES</p>
<p>Centro Libanés podrá transferir sus datos personales a terceros nacionales o extranjeros, sin requerir consentimiento del titular en los casos previstos por la legislación aplicable, incluyendo autoridades laborales, fiscales o judiciales, instituciones bancarias, instituciones de seguridad social, aseguradoras y demás entidades que resulten necesarias para el cumplimiento de obligaciones legales, contractuales o derivadas de la relación jurídica con el titular.</p>
<p>Asimismo, Centro Libanés podrá compartir datos personales con proveedores, prestadores de servicios y plataformas tecnológicas que actúen por cuenta de Centro Libanés para la operación, administración y gestión de procesos laborales, médicos, administrativos, tecnológicos, de seguridad y capacitación, quienes asumirán las obligaciones correspondientes en materia de confidencialidad, protección y tratamiento de datos personales, conforme a la legislación aplicable.</p>
<p class="fw-bold text-dark mt-3 mb-2">V. USO DE PLATAFORMAS Y TECNOLOGÍAS</p>
<p>Centro Libanés podrá utilizar sistemas, plataformas digitales, medios electrónicos y herramientas tecnológicas para la administración de procesos laborales, capacitación, evaluación, control de acceso y demás actividades relacionadas con la operación y gestión interna de Centro Libanés.</p>
<p>Asimismo, podrá utilizar plataformas y herramientas tecnológicas para la validación de la calidad de empleado o colaborador para la aplicación de beneficios, promociones o descuentos proporcionados por terceros autorizados dentro de las instalaciones de Centro Libanés.</p>
<p>Centro Libanés también podrá utilizar tecnologías de videovigilancia, control de acceso y herramientas de comunicación electrónica y mensajería institucional.</p>
<p class="fw-bold text-dark mt-3 mb-2">VI. VIDEOVIGILANCIA Y CONTROL DE ACCESO</p>
<p>Las instalaciones de Centro Libanés podrán contar con sistemas de videovigilancia, monitoreo y mecanismos de control de acceso físico, electrónico y biométrico, incluyendo tecnologías de reconocimiento facial y, en su caso, herramientas de grabación de audio y voz en determinadas áreas, con la finalidad de salvaguardar la seguridad de las personas, proteger bienes e instalaciones, controlar accesos, verificar la identidad de las personas, atender incidentes y dar cumplimiento a los protocolos internos de seguridad.</p>
<p>Las imágenes, grabaciones, audios y demás información obtenida mediante dichos sistemas podrán ser utilizadas para fines de seguridad, control de accesos, atención de incidentes, seguimiento operativo y cumplimiento de disposiciones legales y reglamentarias aplicables.</p>
<p class="fw-bold text-dark mt-3 mb-2">VII. CONSENTIMIENTO PARA DATOS SENSIBLES Y BIOMÉTRICOS</p>
<p>Centro Libanés podrá tratar datos personales sensibles y biométricos cuando éstos resulten necesarios para el cumplimiento de las finalidades previstas en el presente Aviso Integral de Privacidad, de conformidad con la legislación aplicable.</p>
<p>En aquellos casos en que la normatividad vigente o la naturaleza del tratamiento así lo requieran, Centro Libanés recabará el consentimiento expreso del titular a través de los medios físicos o electrónicos que resulten procedentes.</p>
<p class="fw-bold text-dark mt-3 mb-2">VIII. LIMITACIÓN DEL USO O DIVULGACIÓN DE DATOS PERSONALES</p>
<p>El titular podrá solicitar la limitación del uso o divulgación de sus datos personales para determinadas finalidades, conforme a los mecanismos y procedimientos establecidos por Centro Libanés, mediante solicitud dirigida al área responsable de protección de datos personales a través del correo electrónico avisodeprivacidad@centrolibanes.org.mx</p>
<p class="fw-bold text-dark mt-3 mb-2">IX. DERECHOS ARCO</p>
<p>El titular podrá ejercer en cualquier momento sus derechos de acceso, rectificación, cancelación y oposición respecto de sus datos personales, mediante solicitud dirigida al área responsable de protección de datos personales de Centro Libanés a través del correo electrónico avisodeprivacidad@centrolibanes.org.mx</p>
<p>Centro Libanés dará trámite a las solicitudes conforme a los plazos, términos y procedimientos establecidos en la legislación aplicable.</p>
<p class="fw-bold text-dark mt-3 mb-2">X. REVOCACIÓN DEL CONSENTIMIENTO</p>
<p>El titular podrá revocar el consentimiento otorgado para el tratamiento de sus datos personales, siguiendo el procedimiento señalado para el ejercicio de derechos ARCO, salvo en los casos en que el tratamiento resulte necesario por disposición legal o derivado de la relación jurídica existente.</p>
<p class="fw-bold text-dark mt-3 mb-2">XI. CONSERVACIÓN DE DATOS PERSONALES</p>
<p>En el caso de aspirantes que no sean contratados, Centro Libanés podrá conservar sus datos personales únicamente durante el tiempo necesario para atender posibles aclaraciones, dar seguimiento a futuros procesos de reclutamiento o cumplir obligaciones legales aplicables, procediendo posteriormente a su bloqueo, supresión o eliminación conforme a las políticas internas y la legislación aplicable.</p>
<p>Tratándose de colaboradores activos y exempleados, Centro Libanés podrá conservar los datos personales, incluyendo información laboral, administrativa, fiscal, de seguridad social, médica y demás información relacionada con la relación laboral, durante el tiempo que resulte necesario para el cumplimiento de obligaciones legales, contractuales, fiscales, laborales, de seguridad social, prevención de riesgos, atención de auditorías, procedimientos administrativos o judiciales y demás finalidades legítimas relacionadas con la relación laboral y su terminación, conforme a los plazos establecidos en la legislación aplicable y las políticas internas de conservación de información.</p>
<p>Una vez concluidos los plazos de conservación aplicables y cuando los datos personales ya no resulten necesarios para las finalidades que motivaron su tratamiento, Centro Libanés procederá a su bloqueo, supresión, cancelación o eliminación conforme a las disposiciones legales y administrativas aplicables.</p>
<p class="fw-bold text-dark mt-3 mb-2">XII. CAMBIOS AL AVISO DE PRIVACIDAD</p>
<p>Centro Libanés se reserva el derecho de modificar o actualizar el presente Aviso Integral de Privacidad en cualquier momento, derivado de reformas legales, políticas internas o nuevos requerimientos para la operación y administración institucional.</p>
<p>Las modificaciones al presente Aviso Integral de Privacidad estarán disponibles a través de la página oficial de internet de Centro Libanés, medios electrónicos institucionales o comunicados internos que, en su caso, se emitan para tal efecto.</p>
<p class="fw-bold text-dark mt-3 mb-2">XIII. ACEPTACIÓN DEL AVISO INTEGRAL DE PRIVACIDAD</p>
<p>El titular manifiesta que el presente Aviso Integral de Privacidad le ha sido dado a conocer y que entiende el alcance y contenido del mismo.</p>
<p class="mb-0">Cuando la legislación aplicable o la naturaleza del tratamiento así lo requieran, particularmente tratándose de datos personales sensibles y/o biométricos, Centro Libanés recabará el consentimiento expreso del titular a través de los medios físicos, electrónicos o mecanismos que resulten procedentes.</p>`;

const DEFAULT_CONSENT_HTML = `<p>Declaro que previamente se me puso a disposición el Aviso Integral de Privacidad para Aspirantes y Colaboradores de Centro Libanés, A.C., y que conozco el alcance, contenido y finalidades del tratamiento de mis datos personales y datos personales sensibles.</p>
<p>Asimismo, otorgo mi consentimiento expreso para que Centro Libanés, A.C., a través del personal médico y/o personal estrictamente autorizado, recabe, utilice, almacene, conserve y trate los datos personales sensibles relacionados con mi estado de salud, antecedentes médicos, padecimientos, historial clínico, información de emergencia y demás información médica contenida en el presente cuestionario, exclusivamente para finalidades relacionadas con:</p>
<p class="mb-2">1. Valoración y atención médica ocupacional.<br />2. Integración y administración de expediente médico.<br />3. Prevención y atención de emergencias médicas.<br />4. Cumplimiento de obligaciones en materia de seguridad y salud en el trabajo.<br />5. Implementación de medidas preventivas y de protección dentro de las instalaciones de Centro Libanés y demás finalidades necesarias derivadas de la relación jurídica, conforme al Aviso Integral de Privacidad aplicable.</p>
<p>Centro Libanés, A.C., se obliga a tratar la información médica y sensible proporcionada bajo estrictas medidas de confidencialidad, seguridad administrativa, técnica y física, limitando el acceso únicamente al personal que requiera conocer dicha información conforme a sus funciones y atribuciones.</p>
<p>Asimismo, se hace constar que los datos personales sensibles recabados mediante el presente cuestionario serán tratados bajo criterios de licitud, necesidad, proporcionalidad y minimización de datos, solicitándose únicamente aquella información razonablemente necesaria para las finalidades médicas, ocupacionales, de seguridad y atención correspondientes.</p>
<p>De igual forma, Centro Libanés, A.C., manifiesta que la información médica proporcionada no será utilizada para fines discriminatorios, prácticas de exclusión indebida o tratamientos contrarios a la dignidad de las personas, observando en todo momento la legislación aplicable en materia de protección de datos personales, derechos laborales, igualdad y no discriminación.</p>
<p class="mb-0">Entiendo que puedo ejercer en cualquier momento mis derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como revocar mi consentimiento, conforme a los mecanismos establecidos en el Aviso Integral de Privacidad correspondiente.</p>`;

const DEFAULT_CONSENT_SOCIO_HTML = `<p>Declaro que previamente se me puso a disposición el Aviso de Privacidad para Socios, Usuarios e Invitados de Centro Libanés, A.C., y que conozco el alcance, contenido y finalidades del tratamiento de mis datos personales y datos personales sensibles.</p>
<p>Asimismo, otorgo mi consentimiento expreso para que Centro Libanés, A.C., a través del personal del Servicio Médico y/o personal clínico estrictamente autorizado, recabe, utilice, almacene, conserve y trate los datos personales sensibles relacionados con mi estado de salud, antecedentes médicos, padecimientos, alergias, medicamentos, historial clínico, contacto de emergencia y demás información médica contenida en el presente cuestionario, exclusivamente para finalidades relacionadas con:</p>
<p class="mb-2">1. Integración, actualización y administración de mi expediente clínico en el Servicio Médico de Centro Libanés.<br />2. Valoración médica preventiva y orientación de salud para la práctica segura de actividades deportivas, físicas, culturales, recreativas y sociales dentro de las instalaciones del Club.<br />3. Prevención, primeros auxilios y atención oportuna de emergencias o eventualidades médicas dentro de las instalaciones de Centro Libanés.<br />4. Coordinación con servicios médicos de urgencia, ambulancias, hospitales o contactos de emergencia designados por el titular en caso de ser necesario.<br />5. Implementación de medidas preventivas, sanitarias y de protección civil en beneficio de los Socios, Usuarios e Invitados, conforme al Aviso de Privacidad aplicable.</p>
<p>Centro Libanés, A.C., se obliga a tratar la información médica y sensible proporcionada bajo estrictas medidas de confidencialidad y secreto profesional, así como de seguridad administrativa, técnica y física, limitando su consulta únicamente al personal médico y clínico autorizado.</p>
<p>Asimismo, se hace constar que los datos personales sensibles recabados mediante el presente cuestionario serán tratados bajo criterios de licitud, necesidad, proporcionalidad y minimización de datos, solicitándose únicamente aquella información razonablemente necesaria para las finalidades médicas, preventivas y de atención de emergencias antes descritas, sin que en ningún caso sea utilizada para fines discriminatorios o contrarios a la dignidad de las personas.</p>
<p class="mb-0">Entiendo que puedo ejercer en cualquier momento mis derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así como revocar mi consentimiento, mediante solicitud dirigida al correo electrónico <strong>avisodeprivacidad@centrolibanes.org.mx</strong> conforme a los mecanismos establecidos en el Aviso de Privacidad de Centro Libanés, A.C.</p>`;

const DEFAULT_PVME_ANEXO_C_HTML = `<p class="fw-bold mb-1">1. Límites máximos de carga individual (Tabla 1 de la NOM-036-1-STPS-2018):</p>
<p class="mb-2">• Hombres de 18 a 45 años: <strong>25 kg</strong> · Hombres mayores de 45 años: <strong>20 kg</strong><br>• Mujeres de 18 a 45 años: <strong>20 kg</strong> · Mujeres mayores de 45 años: <strong>15 kg</strong><br>• Trabajadoras durante la gestación: <strong>10 kg</strong> · Menores de 18 años: <strong>7 kg</strong></p>
<p class="fw-bold mb-1">2. Riesgos a la salud por manejo manual de cargas:</p>
<p class="mb-2">Lumbalgia aguda y crónica, síndrome del manguito rotador, tendinitis bicipital, epicondilitis, tenosinovitis de De Quervain, síndrome del túnel del carpo, gonalgia, esguinces de tobillo y fatiga muscular.</p>
<p class="fw-bold text-dark mb-1">3. Prohibiciones absolutas y técnica segura:</p>
<p class="mb-2">• Prohibido cargar de forma individual objetos que superen su límite personal de masa.<br>• Prohibido levantar cargas por encima del nivel de los hombros (120 cm) o desde el nivel del piso con la espalda doblada.<br>• Prohibido girar el tronco mientras sostiene una carga: mueva primero los pies.<br>• Durante el embarazo y las primeras 10 semanas posparto queda prohibido cargar más de 10 kg, realizar cargas repetitivas o empujar/jalar.</p>
<p class="fw-bold mb-1">4. Ayudas mecánicas disponibles en Centro Libanés:</p>
<p class="mb-0">Polipasto eléctrico H-LIFT de 500 kg (Salón Baalbek), Patín hidráulico NOVAL de 3 toneladas (Almacén General) y 8 diablos de carga de 200 kg. <em>El elevador GENIE es exclusivo para elevación de personal y NO debe usarse como montacargas.</em></p>`;

@Component({
  selector: 'app-cuestionarios-medicos-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card border-0 shadow-sm cm-config-card">
      <!-- ENCABEZADO AMPLIO Y DESPEJADO -->
      <div class="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-start align-items-lg-center flex-column flex-lg-row gap-3">
        <div>
          <h4 class="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
            <i class="bi bi-file-earmark-medical text-primary"></i>
            Formularios y Avisos Firmados
          </h4>
          <p class="text-muted mb-0" style="font-size: 0.92rem;">
            Configura los textos legales, encabezados, preguntas y listas de opciones que firman y responden socios y colaboradores.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-outline-secondary px-3 py-2 rounded-3"
            [disabled]="isLoading || isSaving"
            (click)="restoreDefaults()">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Restaurar valores oficiales
          </button>
          <button
            type="button"
            class="btn btn-dark px-4 py-2 rounded-3 fw-semibold"
            [disabled]="isLoading || isSaving"
            (click)="saveSettings()">
            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!isSaving" class="bi bi-check2-circle me-2"></i>Guardar cambios
          </button>
        </div>
      </div>

      <div class="card-body p-4 p-lg-5">
        <!-- PESTAÑAS INTERNAS ESPACIADAS -->
        <div class="cm-tabs-nav mb-5">
          <button
            type="button"
            class="cm-tab-pill"
            [class.active]="activeTab === 'paso1'"
            (click)="activeTab = 'paso1'">
            <i class="bi bi-shield-check me-2"></i>1. Aviso Integral de Privacidad
          </button>
          <button
            type="button"
            class="cm-tab-pill"
            [class.active]="activeTab === 'paso2'"
            (click)="activeTab = 'paso2'">
            <i class="bi bi-file-earmark-lock2 me-2"></i>2. Consentimiento Datos Sensibles
          </button>
          <button
            type="button"
            class="cm-tab-pill"
            [class.active]="activeTab === 'cuestionario'"
            (click)="activeTab = 'cuestionario'">
            <i class="bi bi-clipboard2-pulse me-2"></i>3. Cuestionario de Historia Clínica
          </button>
          <button
            type="button"
            class="cm-tab-pill"
            [class.active]="activeTab === 'simplificado'"
            (click)="activeTab = 'simplificado'">
            <i class="bi bi-calendar2-check me-2"></i>4. Eventos, NOM-036 y Mensajes
          </button>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════
             TAB 1: AVISO INTEGRAL DE PRIVACIDAD (PANTALLA 1)
             ═══════════════════════════════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'paso1'" class="d-flex flex-column gap-4">
          <!-- Bloque 1: Destinatarios -->
          <div class="cm-section-box">
            <label class="form-label fw-bold text-dark mb-1">
              ¿A qué tipos de destinatario se solicita firmar el Aviso Integral de Privacidad?
            </label>
            <p class="text-muted small mb-3">
              Los destinatarios marcados verán y aceptarán primero este Aviso Integral de Privacidad antes de pasar al Consentimiento de Datos Sensibles.
            </p>
            <div class="d-flex flex-wrap gap-3">
              <label
                class="cm-dest-chip"
                [class.is-checked]="isDestinatarioSelected(tipo.value)"
                *ngFor="let tipo of destinatariosCatalogo">
                <input
                  type="checkbox"
                  class="form-check-input m-0"
                  [checked]="isDestinatarioSelected(tipo.value)"
                  (change)="toggleDestinatario(tipo.value)" />
                <span>{{ tipo.label }}</span>
              </label>
            </div>
          </div>

          <!-- Bloque 2: Títulos e Instrucciones (100% de ancho cada campo largo para que nada se corte) -->
          <div class="cm-section-box">
            <h6 class="fw-bold text-dark mb-3">Encabezados y Textos de Firma</h6>
            <div class="row g-4">
              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Título de la pantalla superior</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.header_privacy_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Encabezado oficial del documento</label>
                <input type="text" class="form-control cm-input fw-semibold" [(ngModel)]="form.privacy_notice_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Subtítulo / Instrucción para el lector</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.privacy_notice_subtitle" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Texto de la casilla de firma / aceptación (Checkbox)</label>
                <textarea rows="2" class="form-control cm-textarea fw-semibold" [(ngModel)]="form.privacy_notice_checkbox"></textarea>
              </div>
            </div>
          </div>

          <!-- Bloque 3: Editor Visual del Documento -->
          <div class="cm-section-box">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div>
                <h6 class="fw-bold text-dark mb-1">Contenido del Aviso Integral de Privacidad</h6>
                <p class="text-muted small mb-0">Haz clic sobre cualquier párrafo para modificarlo directamente.</p>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm px-3"
                  [ngClass]="!showRawHtmlPaso1 ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="showRawHtmlPaso1 = false">
                  <i class="bi bi-eye me-1"></i>Editor Visual
                </button>
                <button
                  type="button"
                  class="btn btn-sm px-3"
                  [ngClass]="showRawHtmlPaso1 ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="showRawHtmlPaso1 = true">
                  <i class="bi bi-code-slash me-1"></i>Código HTML
                </button>
              </div>
            </div>

            <div *ngIf="!showRawHtmlPaso1" class="cm-wysiwyg-toolbar d-flex flex-wrap align-items-center gap-2 p-3 border rounded-top bg-light">
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('bold')">
                <i class="bi bi-type-bold me-1"></i>Negrita
              </button>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('italic')">
                <i class="bi bi-type-italic me-1"></i>Cursiva
              </button>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('underline')">
                <i class="bi bi-type-underline me-1"></i>Subrayado
              </button>
              <span class="vr mx-1"></span>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('insertUnorderedList')">
                <i class="bi bi-list-ul me-1"></i>Lista con viñetas
              </button>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('insertOrderedList')">
                <i class="bi bi-list-ol me-1"></i>Lista numerada
              </button>
            </div>

            <div
              *ngIf="!showRawHtmlPaso1"
              class="cm-wysiwyg-editor border border-top-0 rounded-bottom p-4 bg-white"
              contenteditable="true"
              [innerHTML]="form.privacy_notice_html"
              (blur)="onRichTextBlur('privacy_notice_html', $event)">
            </div>

            <textarea
              *ngIf="showRawHtmlPaso1"
              class="form-control cm-textarea font-monospace small"
              rows="16"
              [(ngModel)]="form.privacy_notice_html"></textarea>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════
             TAB 2: CONSENTIMIENTO DE DATOS PERSONALES SENSIBLES (PANTALLA 2)
             ═══════════════════════════════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'paso2'" class="d-flex flex-column gap-4">
          <div class="cm-section-box">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h6 class="fw-bold text-dark mb-1">Destinatario del Consentimiento de Datos Sensibles</h6>
                <p class="text-muted small mb-0">
                  Los Socios / Invitados y los Colaboradores ven redacciones distintas acordes a su relación con Centro Libanés.
                </p>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm px-3 fw-semibold"
                  [ngClass]="consentAudienceTab === 'socio' ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="consentAudienceTab = 'socio'">
                  <i class="bi bi-person-vcard me-1"></i>Socios e Invitados
                </button>
                <button
                  type="button"
                  class="btn btn-sm px-3 fw-semibold"
                  [ngClass]="consentAudienceTab === 'empleado' ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="consentAudienceTab = 'empleado'">
                  <i class="bi bi-person-workspace me-1"></i>Colaboradores y Aspirantes
                </button>
              </div>
            </div>

            <div class="row g-4" *ngIf="consentAudienceTab === 'socio'">
              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Título de la pantalla superior</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.header_consent_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Encabezado oficial del consentimiento (Socios e Invitados)</label>
                <input type="text" class="form-control cm-input fw-semibold" [(ngModel)]="form.sensitive_consent_socio_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Subtítulo / Instrucción breve (Socios e Invitados)</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sensitive_consent_socio_subtitle" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Texto de la casilla de consentimiento expreso (Checkbox Socios)</label>
                <textarea rows="2" class="form-control cm-textarea fw-semibold" [(ngModel)]="form.sensitive_consent_socio_checkbox"></textarea>
              </div>
            </div>

            <div class="row g-4" *ngIf="consentAudienceTab === 'empleado'">
              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Título de la pantalla superior</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.header_consent_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Encabezado oficial del consentimiento (Colaboradores)</label>
                <input type="text" class="form-control cm-input fw-semibold" [(ngModel)]="form.sensitive_consent_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Subtítulo / Instrucción breve (Colaboradores)</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sensitive_consent_subtitle" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Texto de la casilla de consentimiento expreso (Checkbox Colaboradores)</label>
                <textarea rows="2" class="form-control cm-textarea fw-semibold" [(ngModel)]="form.sensitive_consent_checkbox"></textarea>
              </div>
            </div>
          </div>

          <div class="cm-section-box">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div>
                <h6 class="fw-bold text-dark mb-1">
                  Contenido del Consentimiento ({{ consentAudienceTab === 'socio' ? 'Socios, Usuarios e Invitados' : 'Colaboradores y Aspirantes' }})
                </h6>
                <p class="text-muted small mb-0">Haz clic sobre cualquier párrafo para modificarlo directamente.</p>
              </div>
              <div class="btn-group">
                <button
                  type="button"
                  class="btn btn-sm px-3"
                  [ngClass]="!showRawHtmlPaso2 ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="showRawHtmlPaso2 = false">
                  <i class="bi bi-eye me-1"></i>Editor Visual
                </button>
                <button
                  type="button"
                  class="btn btn-sm px-3"
                  [ngClass]="showRawHtmlPaso2 ? 'btn-dark' : 'btn-outline-secondary'"
                  (click)="showRawHtmlPaso2 = true">
                  <i class="bi bi-code-slash me-1"></i>Código HTML
                </button>
              </div>
            </div>

            <div *ngIf="!showRawHtmlPaso2" class="cm-wysiwyg-toolbar d-flex flex-wrap align-items-center gap-2 p-3 border rounded-top bg-light">
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('bold')">
                <i class="bi bi-type-bold me-1"></i>Negrita
              </button>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('italic')">
                <i class="bi bi-type-italic me-1"></i>Cursiva
              </button>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('underline')">
                <i class="bi bi-type-underline me-1"></i>Subrayado
              </button>
              <span class="vr mx-1"></span>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('insertUnorderedList')">
                <i class="bi bi-list-ul me-1"></i>Lista con viñetas
              </button>
              <button type="button" class="btn btn-sm btn-white border bg-white px-3" (click)="execCmd('insertOrderedList')">
                <i class="bi bi-list-ol me-1"></i>Lista numerada
              </button>
            </div>

            <ng-container *ngIf="consentAudienceTab === 'socio'">
              <div
                *ngIf="!showRawHtmlPaso2"
                class="cm-wysiwyg-editor border border-top-0 rounded-bottom p-4 bg-white"
                contenteditable="true"
                [innerHTML]="form.sensitive_consent_socio_html"
                (blur)="onRichTextBlur('sensitive_consent_socio_html', $event)">
              </div>

              <textarea
                *ngIf="showRawHtmlPaso2"
                class="form-control cm-textarea font-monospace small"
                rows="14"
                [(ngModel)]="form.sensitive_consent_socio_html"></textarea>
            </ng-container>

            <ng-container *ngIf="consentAudienceTab === 'empleado'">
              <div
                *ngIf="!showRawHtmlPaso2"
                class="cm-wysiwyg-editor border border-top-0 rounded-bottom p-4 bg-white"
                contenteditable="true"
                [innerHTML]="form.sensitive_consent_html"
                (blur)="onRichTextBlur('sensitive_consent_html', $event)">
              </div>

              <textarea
                *ngIf="showRawHtmlPaso2"
                class="form-control cm-textarea font-monospace small"
                rows="14"
                [(ngModel)]="form.sensitive_consent_html"></textarea>
            </ng-container>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════
             TAB 3: CUESTIONARIO DE HISTORIA CLÍNICA (APILADO Y AMPLIO)
             ═══════════════════════════════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'cuestionario'" class="d-flex flex-column gap-4">
          <!-- Bloque A: Opciones de Respuesta / Catálogos -->
          <div class="cm-section-box">
            <h6 class="fw-bold text-dark mb-1">
              <i class="bi bi-ui-checks-grid me-2 text-primary"></i>Opciones de Respuesta del Cuestionario (Botones y Listas)
            </h6>
            <p class="text-muted small mb-4">
              Selecciona qué pregunta deseas configurar para editar sus opciones existentes, agregar nuevas o eliminar las que no se requieran.
            </p>

            <div class="row g-3 align-items-end mb-4">
              <div class="col-12 col-lg-6">
                <label class="form-label fw-semibold text-secondary mb-2">Pregunta / Catálogo de opciones:</label>
                <select class="form-select cm-input fw-semibold" [(ngModel)]="selectedCatalogKey">
                  <option *ngFor="let c of catalogDefinitions" [value]="c.key">
                    {{ c.label }} ({{ getCatalogItems(c.key).length }} opciones) — {{ c.sectionHint }}
                  </option>
                </select>
              </div>

              <div class="col-12 col-lg-6">
                <label class="form-label fw-semibold text-secondary mb-2">Agregar nueva opción a esta lista:</label>
                <div class="d-flex gap-2">
                  <input
                    type="text"
                    class="form-control cm-input"
                    placeholder="Escribe la nueva opción..."
                    [(ngModel)]="newCatalogOptionText"
                    (keydown.enter)="$event.preventDefault(); addCatalogOption()" />
                  <button
                    type="button"
                    class="btn btn-dark px-4 rounded-3 text-nowrap fw-semibold"
                    (click)="addCatalogOption()">
                    <i class="bi bi-plus-lg me-1"></i>Agregar
                  </button>
                </div>
              </div>
            </div>

            <div class="cm-catalog-list d-flex flex-column gap-2">
              <div
                class="d-flex align-items-center gap-3 p-2 px-3 rounded-3 bg-white border"
                *ngFor="let item of getCatalogItems(selectedCatalogKey); let idx = index; trackBy: trackByIndex">
                <span class="badge bg-light text-secondary border px-2 py-1">{{ idx + 1 }}</span>
                <input
                  type="text"
                  class="form-control border-0 fw-medium shadow-none px-2"
                  [ngModel]="form[selectedCatalogKey][idx]"
                  (ngModelChange)="updateCatalogOption(idx, $event)" />
                <div class="d-flex gap-1">
                  <button
                    type="button"
                    class="btn btn-sm btn-light border"
                    title="Subir"
                    [disabled]="idx === 0"
                    (click)="moveCatalogOption(idx, -1)">
                    <i class="bi bi-arrow-up"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-light border"
                    title="Bajar"
                    [disabled]="idx === getCatalogItems(selectedCatalogKey).length - 1"
                    (click)="moveCatalogOption(idx, 1)">
                    <i class="bi bi-arrow-down"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    title="Eliminar opción"
                    (click)="removeCatalogOption(idx)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bloque B: Títulos de las 7 Secciones -->
          <div class="cm-section-box">
            <h6 class="fw-bold text-dark mb-1">
              <i class="bi bi-card-heading me-2 text-primary"></i>Títulos y Encabezados de las Secciones
            </h6>
            <p class="text-muted small mb-4">
              Personaliza los títulos principales que aparecen en cada bloque del Cuestionario de Historia Clínica.
            </p>

            <div class="row g-4">
              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Título principal del cuestionario</label>
                <input type="text" class="form-control cm-input fw-bold" [(ngModel)]="form.questionnaire_main_title" />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 1 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec1_title" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 1 — Descripción breve</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec1_subtitle" />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 2 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec2_title" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 2 — Pregunta principal</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec2_q_enfermo" />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 3 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec3_title" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 3 — Pregunta de enfermedades</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec3_q_enfermedades" />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 4 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec4_title" />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 4 — Descripción breve</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec4_subtitle" />
              </div>

              <div class="col-md-4">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 5 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec5_title" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 6 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec6_title" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold text-secondary mb-2">Sección 7 — Título</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.sec7_title" />
              </div>

              <div class="col-md-8">
                <label class="form-label fw-semibold text-secondary mb-2">Nota informativa antes del botón Enviar</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.footer_submit_note" />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold text-secondary mb-2">Texto del botón Enviar</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.footer_submit_btn" />
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════════
             TAB 4: EVENTOS SIMPLIFICADOS, NOM-036 Y MENSAJES DE CONFIRMACIÓN
             ═══════════════════════════════════════════════════════════════════ -->
        <div *ngIf="activeTab === 'simplificado'" class="d-flex flex-column gap-4">
          <!-- Bloque 1: Eventos / Invitados -->
          <div class="cm-section-box">
            <h6 class="fw-bold text-dark mb-1">
              1. Leyenda de Responsabilidad y Compromiso (Invitados / Eventos / Curso de Verano)
            </h6>
            <p class="text-muted small mb-4">
              Texto legal que firman padres, tutores o invitados externos al final del cuestionario simplificado.
            </p>

            <div class="row g-4">
              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Título del Cuestionario Simplificado</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.simplified_main_title" />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-semibold text-secondary mb-2">Título de la tarjeta de responsabilidad</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.simplified_disclaimer_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Texto íntegro de la leyenda de responsabilidad y compromiso</label>
                <textarea
                  class="form-control cm-textarea"
                  rows="4"
                  [(ngModel)]="form.simplified_disclaimer_text"></textarea>
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Texto del checkbox obligatorio de aceptación</label>
                <input type="text" class="form-control cm-input fw-semibold" [(ngModel)]="form.simplified_disclaimer_checkbox" />
              </div>
            </div>
          </div>

          <!-- Bloque 2: Anexo C NOM-036 -->
          <div class="cm-section-box">
            <h6 class="fw-bold text-dark mb-1">
              2. Acuse de Información de Riesgos · Vigilancia NOM-036-1-STPS-2018 (Anexo C)
            </h6>
            <p class="text-muted small mb-4">
              Texto informativo sobre límites de carga (Tabla 1) y acuse firmado por el colaborador cuando responde la liga de Vigilancia NOM-036.
            </p>

            <div class="row g-4">
              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Título de la tarjeta Anexo C</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.pvme_anexo_c_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Contenido informativo de riesgos y ayudas mecánicas (Anexo C)</label>
                <div
                  class="cm-wysiwyg-editor border rounded-3 p-4 bg-white"
                  style="min-height: 200px;"
                  contenteditable="true"
                  [innerHTML]="form.pvme_anexo_c_html"
                  (blur)="onRichTextBlur('pvme_anexo_c_html', $event)">
                </div>
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Texto de la casilla de firma / acuse de riesgos (Checkbox)</label>
                <textarea rows="3" class="form-control cm-textarea fw-semibold" [(ngModel)]="form.pvme_anexo_c_checkbox"></textarea>
              </div>
            </div>
          </div>

          <!-- Bloque 3: Mensajes finales -->
          <div class="cm-section-box">
            <h6 class="fw-bold text-dark mb-3">
              3. Mensajes de pantalla final (al terminar y enviar cuestionario)
            </h6>

            <div class="row g-4">
              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Título de confirmación</label>
                <input type="text" class="form-control cm-input" [(ngModel)]="form.thank_you_title" />
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Mensaje final — Historia Clínica Completa (Socios / Colaboradores / Prospectos)</label>
                <textarea rows="2" class="form-control cm-textarea" [(ngModel)]="form.thank_you_message"></textarea>
              </div>

              <div class="col-12">
                <label class="form-label fw-semibold text-secondary mb-2">Mensaje final — Cuestionario de Salud Invitado a Evento (Externos)</label>
                <textarea rows="2" class="form-control cm-textarea" [(ngModel)]="form.simplified_thank_you_message"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cm-config-card {
      border-radius: 16px;
    }
    .cm-tabs-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      background: #f1f5f9;
      padding: 0.5rem;
      border-radius: 14px;
    }
    .cm-tab-pill {
      border: 0;
      background: transparent;
      color: #475569;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      transition: all 0.2s ease;
    }
    .cm-tab-pill:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }
    .cm-tab-pill.active {
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.16);
    }
    .cm-section-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem 1.75rem;
    }
    .cm-dest-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.65rem 1.15rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .cm-dest-chip.is-checked {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1e3a8a;
    }
    .cm-input {
      border-radius: 10px !important;
      padding: 0.65rem 1rem !important;
      font-size: 0.92rem;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }
    .cm-textarea {
      border-radius: 12px !important;
      padding: 0.75rem 1rem !important;
      font-size: 0.92rem;
      line-height: 1.55;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }
    .cm-wysiwyg-editor {
      min-height: 360px;
      max-height: 560px;
      overflow-y: auto;
      font-size: 0.94rem;
      line-height: 1.75;
      color: #1e293b;
      outline: none;
    }
    .cm-wysiwyg-editor:focus {
      box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.25);
    }
  `]
})
export class CuestionariosMedicosConfigComponent implements OnInit {
  @Input() showCloseButton: boolean = false;
  @Output() closed = new EventEmitter<void>();

  activeTab: 'paso1' | 'paso2' | 'cuestionario' | 'simplificado' = 'paso1';
  consentAudienceTab: 'socio' | 'empleado' = 'socio';
  isLoading = false;
  isSaving = false;

  showRawHtmlPaso1 = false;
  showRawHtmlPaso2 = false;

  selectedCatalogKey: string = 'cat_enfermedades_personales';
  newCatalogOptionText: string = '';

  readonly destinatariosCatalogo = [
    { value: 'empleado', label: 'Colaborador activo' },
    { value: 'prospecto_empleado', label: 'Prospecto a colaborador' },
    { value: 'socio', label: 'Socio activo' },
    { value: 'prospecto_socio', label: 'Prospecto a socio' },
    { value: 'externo', label: 'Externo / Invitado a evento' }
  ];

  readonly catalogDefinitions: CatalogDef[] = [
    { key: 'cat_enfermedades_personales', label: 'Enfermedades personales (Antecedentes)', sectionHint: 'Sección 3' },
    { key: 'cat_alergias', label: 'Condiciones de alergia', sectionHint: 'Sección 3' },
    { key: 'cat_enfermedades_actuales', label: 'Enfermedades actuales', sectionHint: 'Sección 2' },
    { key: 'cat_tratamientos', label: 'Tipos de tratamiento recibido', sectionHint: 'Sección 2' },
    { key: 'cat_enfermedades_familiares', label: 'Enfermedades hereditarias / familiares', sectionHint: 'Sección 4' },
    { key: 'cat_vacunas', label: 'Vacunas aplicadas en el último año', sectionHint: 'Sección 5' },
    { key: 'cat_estudios', label: 'Estudios de laboratorio recientes', sectionHint: 'Sección 6' },
    { key: 'cat_tipos_seguro', label: 'Tipos de seguro médico', sectionHint: 'Sección 7' },
    { key: 'cat_motivos_visita', label: 'Motivos de la visita', sectionHint: 'Sección 7' },
    { key: 'cat_parentescos', label: 'Parentescos de contacto de emergencia', sectionHint: 'Sección 1' },
    { key: 'cat_mascotas', label: 'Tipos de mascotas', sectionHint: 'Sección 5' },
    { key: 'cat_sintomas_simplificado', label: 'Síntomas últimos 14 días (Invitados / Eventos)', sectionHint: 'Evento Simplificado' },
    { key: 'cat_alergias_simplificado', label: 'Alergias (Invitados / Eventos)', sectionHint: 'Evento Simplificado' }
  ];

  form: any = {
    header_privacy_title: 'Aviso Integral de Privacidad',
    header_consent_title: 'Aviso de privacidad y consentimiento',
    questionnaire_main_title: 'Cuestionario de Historia Clínica',
    simplified_main_title: 'Cuestionario de Salud — Invitado a Evento',
    pvme_main_title: 'Vigilancia Médica NOM-036-1-STPS-2018 (Anexo B y Anexo C)',
    privacy_notice_title: 'AVISO INTEGRAL DE PRIVACIDAD PARA ASPIRANTES Y COLABORADORES DE CENTRO LIBANÉS, A.C.',
    privacy_notice_subtitle: 'Antes de otorgar tu consentimiento, lee con atención el Aviso Integral de Privacidad.',
    privacy_notice_checkbox: 'He leído y acepto el presente Aviso Integral de Privacidad de Centro Libanés, A.C.',
    privacy_notice_html: DEFAULT_PRIVACY_HTML,
    privacy_applies_to: ['empleado', 'prospecto_empleado'],
    sensitive_consent_title: 'CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES SENSIBLES',
    sensitive_consent_subtitle: 'Lee con atención el siguiente texto. Para continuar con el cuestionario médico debes otorgar tu consentimiento expreso.',
    sensitive_consent_checkbox: 'He leído y acepto los términos antes descritos, otorgando mi consentimiento expreso para el tratamiento de mis datos personales sensibles de salud.',
    sensitive_consent_html: DEFAULT_CONSENT_HTML,
    sensitive_consent_socio_title: 'CONSENTIMIENTO PARA EL TRATAMIENTO DE DATOS PERSONALES SENSIBLES DE SALUD — SOCIOS Y USUARIOS',
    sensitive_consent_socio_subtitle: 'Lee con atención el siguiente texto. Para continuar con tu cuestionario de historia clínica debes otorgar tu consentimiento expreso.',
    sensitive_consent_socio_checkbox: 'He leído y acepto los términos antes descritos, otorgando mi consentimiento expreso para el tratamiento de mis datos personales sensibles de salud por parte del Servicio Médico de Centro Libanés, A.C.',
    sensitive_consent_socio_html: DEFAULT_CONSENT_SOCIO_HTML,
    sec1_title: '1. Datos personales',
    sec1_subtitle: 'Información básica de identificación.',
    sec2_title: '2. Estado de salud actual',
    sec2_q_enfermo: '¿Actualmente se encuentra enfermo?*',
    sec3_title: '3. Antecedentes personales',
    sec3_q_enfermedades: '¿Ha tenido o tiene alguna de las siguientes enfermedades?*',
    sec4_title: '4. Antecedentes familiares',
    sec4_subtitle: 'Solo familiares directos: padres, hermanos o abuelos.',
    sec5_title: '5. Hábitos y estilo de vida',
    sec6_title: '6. Estudios de laboratorio',
    sec7_title: '7. Información complementaria',
    footer_submit_note: 'Al enviar, tu información será revisada por el equipo médico antes de tu cita.',
    footer_submit_btn: 'Enviar cuestionario',
    cat_parentescos: ['Padre', 'Madre', 'Abuelo(a)', 'Hijo(a)', 'Hermano(a)', 'Esposo(a)', 'Otro'],
    cat_enfermedades_actuales: [
      'Cardiovasculares', 'Crónicas', 'Dermatológicas', 'Digestivas', 'Infecciosas',
      'Metabólicas', 'Musculoesqueléticas', 'Respiratorias', 'Salud mental', 'Otras'
    ],
    cat_tratamientos: ['Farmacológicos', 'Menores', 'Preventivos', 'Terapias', 'Otras'],
    cat_enfermedades_personales: [
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
    ],
    cat_alergias: [
      'Ninguna',
      'Alergias a medicamentos',
      'Alergias a picaduras de insectos',
      'Alergias alimentarias',
      'Alergias cutáneas (por contacto)',
      'Alergias respiratorias',
      'Otras'
    ],
    cat_enfermedades_familiares: [
      'Ninguna', 'Cáncer', 'Cardiopatías', 'Diabetes', 'Enfermedades autoinmunes',
      'Enfermedades respiratorias crónicas', 'Hepatopatías', 'Hipertensión arterial',
      'Nefropatías', 'Trastornos psiquiátricos', 'Otras'
    ],
    cat_vacunas: [
      'Ninguna', 'COVID-19', 'Hepatitis B', 'Influenza', 'Neumococo',
      'Sarampión, Rubéola y Parotiditis (SRP)', 'Tétanos y Difteria (Td o Tdap)', 'Otras'
    ],
    cat_mascotas: [
      'Ave (perico, canario, loro, etc.)', 'Cerdo miniatura', 'Conejo', 'Gato',
      'Hámster', 'Hurón', 'Perro', 'Pez', 'Reptil (iguana, serpiente, etc.)', 'Tortuga', 'Otras'
    ],
    cat_estudios: [
      'No', 'Biometría hemática (hemograma completo)', 'Examen general de orina (EGO)',
      'Glucosa en ayunas', 'Hemoglobina glicosilada (HbA1c)', 'Perfil lipídico',
      'Perfil tiroideo (TSH, T3, T4)', 'Prueba de anticuerpos antinucleares (ANA)',
      'Prueba ELISA', 'Pruebas de función hepática', 'Química sanguínea', 'Otras'
    ],
    cat_tipos_seguro: [
      'Seguro de Gastos Médicos Mayores',
      'Seguro de Gastos Médicos Menores',
      'Seguro público (IMSS, ISSSTE)',
      'Otro'
    ],
    cat_motivos_visita: [
      'Actualización de datos',
      'Registro nuevo de información médica'
    ],
    cat_alergias_simplificado: ['Medicamentos', 'Alimentos', 'Picaduras de insectos', 'Otra'],
    cat_sintomas_simplificado: [
      'Ninguno', 'Conjuntivitis (ojos rojos con secreción)', 'Diarrea', 'Dolor abdominal',
      'Dolor de garganta', 'Escurrimiento nasal', 'Erupciones en la piel', 'Fiebre', 'Tos', 'Vómitos'
    ],
    simplified_disclaimer_title: 'Leyenda de responsabilidad y compromiso',
    simplified_disclaimer_text: 'Conscientes de que la salud y el bienestar de los participantes es una prioridad compartida, declaro que la información proporcionada en este cuestionario es verdadera, completa y basada en el estado real de salud. Entiendo que omitir o proporcionar información incorrecta puede poner en riesgo la salud propia y la de los demás participantes y del personal del evento. Me comprometo a informar cualquier cambio en el estado de salud y a no acudir al evento cuando presente signos o síntomas de enfermedad, con el objetivo de prevenir la propagación de virus y bacterias y contribuir a un entorno seguro para todos.',
    simplified_disclaimer_checkbox: 'Declaro que la información es verdadera y acepto la responsabilidad descrita.',
    pvme_anexo_c_title: '3. Anexo C · Información de Riesgos por Manejo Manual de Cargas',
    pvme_anexo_c_html: DEFAULT_PVME_ANEXO_C_HTML,
    pvme_anexo_c_checkbox: 'Manifiesto que recibí por escrito y me fue explicada la información sobre el peso máximo que puedo cargar según mi sexo y edad (Tabla 1 de la NOM-036-1-STPS-2018), los riesgos a la salud, las medidas de prevención, prohibiciones y ayudas mecánicas disponibles, y que me comprometo a aplicarlas y reportar cualquier molestia al Servicio Médico.',
    thank_you_title: '¡Gracias!',
    thank_you_message: 'Recibimos tu información. El equipo médico la revisará antes de tu cita. Si necesitas ajustar algo, comunícate con el Servicio Médico al ext. 3921.',
    simplified_thank_you_message: 'Recibimos la información. El Servicio Médico la revisará antes del evento.'
  };

  constructor(
    private servicioMedico: ServicioMedicoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get canUpdate(): boolean {
    return true;
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.servicioMedico.getQuestionnaireSettings().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success && res.data) {
          this.form = {
            ...this.form,
            ...res.data,
            privacy_notice_html: res.data.privacy_notice_html || res.data.privacy_html || DEFAULT_PRIVACY_HTML,
            sensitive_consent_html: res.data.sensitive_consent_html || res.data.consent_html || DEFAULT_CONSENT_HTML,
            sensitive_consent_socio_html: res.data.sensitive_consent_socio_html || DEFAULT_CONSENT_SOCIO_HTML,
            pvme_anexo_c_html: res.data.pvme_anexo_c_html || DEFAULT_PVME_ANEXO_C_HTML
          };
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  execCmd(command: string): void {
    document.execCommand(command, false);
  }

  onRichTextBlur(field: string, event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target) {
      this.form[field] = target.innerHTML;
    }
  }

  isDestinatarioSelected(val: string): boolean {
    return Array.isArray(this.form.privacy_applies_to) && this.form.privacy_applies_to.includes(val);
  }

  toggleDestinatario(val: string): void {
    const arr = Array.isArray(this.form.privacy_applies_to) ? [...this.form.privacy_applies_to] : [];
    if (arr.includes(val)) {
      this.form.privacy_applies_to = arr.filter(x => x !== val);
    } else {
      arr.push(val);
      this.form.privacy_applies_to = arr;
    }
  }

  getCatalogItems(key: string): string[] {
    if (!Array.isArray(this.form[key])) {
      this.form[key] = [];
    }
    return this.form[key];
  }

  trackByIndex(index: number): number {
    return index;
  }

  addCatalogOption(): void {
    const clean = (this.newCatalogOptionText || '').trim();
    if (!clean) return;
    const arr = [...this.getCatalogItems(this.selectedCatalogKey)];
    if (!arr.includes(clean)) {
      arr.push(clean);
      this.form[this.selectedCatalogKey] = arr;
    }
    this.newCatalogOptionText = '';
    this.cdr.detectChanges();
  }

  updateCatalogOption(index: number, value: string): void {
    const arr = [...this.getCatalogItems(this.selectedCatalogKey)];
    arr[index] = value;
    this.form[this.selectedCatalogKey] = arr;
  }

  moveCatalogOption(index: number, delta: number): void {
    const arr = [...this.getCatalogItems(this.selectedCatalogKey)];
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= arr.length) return;
    const temp = arr[index];
    arr[index] = arr[targetIdx];
    arr[targetIdx] = temp;
    this.form[this.selectedCatalogKey] = arr;
    this.cdr.detectChanges();
  }

  removeCatalogOption(index: number): void {
    const arr = [...this.getCatalogItems(this.selectedCatalogKey)];
    arr.splice(index, 1);
    this.form[this.selectedCatalogKey] = arr;
    this.cdr.detectChanges();
  }

  saveSettings(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.servicioMedico.updateQuestionnaireSettings(this.form).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res?.success && res.data) {
          this.form = { ...this.form, ...res.data };
          Swal.fire({
            icon: 'success',
            title: 'Formularios actualizados',
            text: res.message || 'Los textos legales, preguntas y opciones del cuestionario se guardaron correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSaving = false;
        Swal.fire('Error', err?.error?.message || 'No se pudo guardar la configuración.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  restoreDefaults(): void {
    if (this.isSaving) return;
    Swal.fire({
      title: '¿Restaurar textos y opciones oficiales?',
      text: 'Se restablecerán los textos originales del Aviso de Privacidad, Consentimiento Sensible y las opciones por defecto del Cuestionario de Historia Clínica.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.isSaving = true;
        this.servicioMedico.updateQuestionnaireSettings({ reset_defaults: true }).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            if (res?.success && res.data) {
              this.form = { ...this.form, ...res.data };
              Swal.fire('Restaurado', 'Se han restaurado los valores oficiales por defecto.', 'success');
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.isSaving = false;
            Swal.fire('Error', 'No se pudieron restaurar los valores por defecto.', 'error');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
