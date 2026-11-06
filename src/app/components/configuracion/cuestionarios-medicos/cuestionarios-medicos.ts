import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ServicioMedicoService } from '../../../services/servicio-medico';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-cuestionarios-medicos-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="card-title mb-1 fw-bold text-dark">
            <i class="bi bi-file-earmark-medical me-2 text-primary"></i>Consentimientos y Cuestionarios Médicos
          </h5>
          <p class="text-muted small mb-0">
            Configura los textos legales del Aviso de Privacidad (Paso 1), Consentimiento de Datos Sensibles (Paso 2), destinatarios aplicables y leyendas de responsabilidad.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2" *ngIf="canUpdate">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm px-3"
            [disabled]="isLoading || isSaving"
            (click)="restoreDefaults()">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Restaurar valores oficiales
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm px-4"
            [disabled]="isLoading || isSaving"
            (click)="saveSettings()">
            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-1"></span>
            <i *ngIf="!isSaving" class="bi bi-check2-circle me-1"></i>Guardar cambios
          </button>
        </div>
      </div>

      <div class="card-body p-4">
        <div *ngIf="!canUpdate" class="alert alert-info py-2 small mb-4">
          <i class="bi bi-info-circle me-1"></i>
          Modo de solo lectura: cuentas con permiso de visualización (<code>view</code>), pero requieres el permiso de actualización (<code>update</code>) en <strong>Consentimientos Médicos</strong> para modificar estos textos.
        </div>

        <!-- Tabs internas de configuración -->
        <ul class="nav nav-pills mb-4 gap-2">
          <li class="nav-item">
            <button
              type="button"
              class="nav-link btn-sm"
              [class.active]="activeTab === 'paso1'"
              (click)="activeTab = 'paso1'">
              <i class="bi bi-shield-lock me-1"></i>1. Aviso Integral de Privacidad (Paso 1)
            </button>
          </li>
          <li class="nav-item">
            <button
              type="button"
              class="nav-link btn-sm"
              [class.active]="activeTab === 'paso2'"
              (click)="activeTab = 'paso2'">
              <i class="bi bi-file-earmark-check me-1"></i>2. Consentimiento Datos Sensibles (Paso 2)
            </button>
          </li>
          <li class="nav-item">
            <button
              type="button"
              class="nav-link btn-sm"
              [class.active]="activeTab === 'simplificado'"
              (click)="activeTab = 'simplificado'">
              <i class="bi bi-clipboard2-pulse me-1"></i>3. Evento Simplificado y Confirmación
            </button>
          </li>
        </ul>

        <!-- TAB 1: PASO 1 AVISO DE PRIVACIDAD -->
        <div *ngIf="activeTab === 'paso1'" class="row g-3">
          <div class="col-12">
            <div class="p-3 rounded border bg-light">
              <label class="form-label fw-semibold small text-dark mb-1">
                ¿A qué tipos de destinatario se solicita el Paso 1 (Aviso Integral de Privacidad)?
              </label>
              <p class="text-muted small mb-2">
                Los destinatarios que no estén marcados omitirán el Paso 1 y pasarán directamente al Paso 2 (Consentimiento de Datos Personales Sensibles).
              </p>
              <div class="d-flex flex-wrap gap-3">
                <label
                  class="form-check form-check-inline bg-white border rounded px-3 py-2 m-0 d-flex align-items-center gap-2"
                  *ngFor="let tipo of destinatariosCatalogo">
                  <input
                    type="checkbox"
                    class="form-check-input m-0"
                    [checked]="isDestinatarioSelected(tipo.value)"
                    [disabled]="!canUpdate"
                    (change)="toggleDestinatario(tipo.value)" />
                  <span class="small fw-medium">{{ tipo.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="col-md-12">
            <label class="form-label small fw-semibold">Título del Paso 1</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.privacy_notice_title"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-md-12">
            <label class="form-label small fw-semibold">Subtítulo / Instrucción breve</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.privacy_notice_subtitle"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-md-12">
            <label class="form-label small fw-semibold">Texto de la casilla de aceptación (Checkbox)</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.privacy_notice_checkbox"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold">Contenido del Aviso Integral de Privacidad (HTML permitido)</label>
            <textarea
              class="form-control font-monospace small"
              rows="12"
              [(ngModel)]="form.privacy_notice_html"
              [readonly]="!canUpdate"></textarea>
          </div>
        </div>

        <!-- TAB 2: PASO 2 CONSENTIMIENTO DATOS SENSIBLES -->
        <div *ngIf="activeTab === 'paso2'" class="row g-3">
          <div class="col-12">
            <div class="alert alert-secondary py-2 small mb-1">
              <i class="bi bi-check2-all me-1"></i>
              Este Paso 2 es obligatorio para los <strong>5 tipos de destinatarios</strong> (Socios, Colaboradores, Prospectos a Socio, Prospectos a Colaborador y Externos).
            </div>
          </div>

          <div class="col-md-12">
            <label class="form-label small fw-semibold">Título del Paso 2</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.sensitive_consent_title"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-md-12">
            <label class="form-label small fw-semibold">Subtítulo / Instrucción breve</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.sensitive_consent_subtitle"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-md-12">
            <label class="form-label small fw-semibold">Texto de la casilla de consentimiento expreso (Checkbox)</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.sensitive_consent_checkbox"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold">Contenido del Consentimiento de Datos Sensibles (HTML permitido)</label>
            <textarea
              class="form-control font-monospace small"
              rows="11"
              [(ngModel)]="form.sensitive_consent_html"
              [readonly]="!canUpdate"></textarea>
          </div>
        </div>

        <!-- TAB 3: EVENTO SIMPLIFICADO Y PANTALLAS DE CONFIRMACIÓN -->
        <div *ngIf="activeTab === 'simplificado'" class="row g-3">
          <div class="col-12">
            <h6 class="fw-bold text-dark mb-1">Tarjeta 5 (Cuestionario Simplificado para Externos / Invitados)</h6>
            <p class="text-muted small mb-2">
              Configura la leyenda de responsabilidad y compromiso que firman padres, tutores o invitados a eventos.
            </p>
          </div>

          <div class="col-md-6">
            <label class="form-label small fw-semibold">Título de la tarjeta de responsabilidad</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.simplified_disclaimer_title"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-md-6">
            <label class="form-label small fw-semibold">Texto del checkbox obligatorio</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.simplified_disclaimer_checkbox"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold">Texto íntegro de la leyenda de responsabilidad y compromiso</label>
            <textarea
              class="form-control small"
              rows="4"
              [(ngModel)]="form.simplified_disclaimer_text"
              [readonly]="!canUpdate"></textarea>
          </div>

          <hr class="my-3" />

          <div class="col-12">
            <h6 class="fw-bold text-dark mb-1">Mensajes de pantalla final (al enviar cuestionario)</h6>
          </div>

          <div class="col-md-4">
            <label class="form-label small fw-semibold">Título de confirmación</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.thank_you_title"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-md-8">
            <label class="form-label small fw-semibold">Mensaje final — Historia Clínica Completa (Socios / Colaboradores / Prospectos)</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.thank_you_message"
              [readonly]="!canUpdate" />
          </div>

          <div class="col-12">
            <label class="form-label small fw-semibold">Mensaje final — Cuestionario de Salud Invitado a Evento (Externos)</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="form.simplified_thank_you_message"
              [readonly]="!canUpdate" />
          </div>
        </div>
      </div>
    </div>
  `
})
export class CuestionariosMedicosConfigComponent implements OnInit {
  activeTab: 'paso1' | 'paso2' | 'simplificado' = 'paso1';
  isLoading = false;
  isSaving = false;

  readonly destinatariosCatalogo = [
    { value: 'empleado', label: 'Colaborador activo' },
    { value: 'prospecto_empleado', label: 'Prospecto a colaborador' },
    { value: 'socio', label: 'Socio activo' },
    { value: 'prospecto_socio', label: 'Prospecto a socio' },
    { value: 'externo', label: 'Externo / Invitado a evento' }
  ];

  form: any = {
    privacy_notice_title: '',
    privacy_notice_subtitle: '',
    privacy_notice_checkbox: '',
    privacy_notice_html: '',
    privacy_applies_to: ['empleado', 'prospecto_empleado'],
    sensitive_consent_title: '',
    sensitive_consent_subtitle: '',
    sensitive_consent_checkbox: '',
    sensitive_consent_html: '',
    simplified_disclaimer_title: '',
    simplified_disclaimer_text: '',
    simplified_disclaimer_checkbox: '',
    thank_you_title: '',
    thank_you_message: '',
    simplified_thank_you_message: ''
  };

  constructor(
    private servicioMedico: ServicioMedicoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get canUpdate(): boolean {
    return this.authService.hasPermission('cuestionarios_medicos', 'update');
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
          this.form = { ...this.form, ...res.data };
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isDestinatarioSelected(val: string): boolean {
    return Array.isArray(this.form.privacy_applies_to) && this.form.privacy_applies_to.includes(val);
  }

  toggleDestinatario(val: string): void {
    if (!this.canUpdate) return;
    const arr = Array.isArray(this.form.privacy_applies_to) ? [...this.form.privacy_applies_to] : [];
    if (arr.includes(val)) {
      this.form.privacy_applies_to = arr.filter(x => x !== val);
    } else {
      arr.push(val);
      this.form.privacy_applies_to = arr;
    }
  }

  saveSettings(): void {
    if (!this.canUpdate || this.isSaving) return;
    this.isSaving = true;
    this.servicioMedico.updateQuestionnaireSettings(this.form).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res?.success && res.data) {
          this.form = { ...this.form, ...res.data };
          Swal.fire({
            icon: 'success',
            title: 'Configuración actualizada',
            text: res.message || 'Los textos legales y reglas de consentimiento se guardaron correctamente.',
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
    if (!this.canUpdate || this.isSaving) return;
    Swal.fire({
      title: '¿Restaurar textos oficiales?',
      text: 'Se restablecerán los textos originales del Aviso de Privacidad, Consentimiento Sensible y destinatarios por defecto.',
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
