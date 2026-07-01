import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioMedicoService } from '../../../../services/servicio-medico';
import { ContentMenu } from '../../../content-menu/content-menu';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicio-medico-expediente',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './servicio-medico-expediente.html',
  styleUrl: './servicio-medico-expediente.scss'
})
export class ServicioMedicoExpediente implements OnInit {
  token: string = '';
  medicalProfile: any = null;
  consultas: any[] = [];
  
  isLoadingProfile: boolean = true;
  isLoadingConsultas: boolean = true;
  isSavingProfile: boolean = false;
  isSavingConsulta: boolean = false;
  isNotifyingAdmin: boolean = false;
  
  errorProfile: string = '';
  
  // Tab control: 'expediente' o 'nueva_consulta'
  activeTab: string = 'expediente';

  nuevaConsultaData: any = this.getDefaultConsultaData();
  
  // Materiales temporales
  nuevoMaterial: any = { material: '', cantidad: 0, observaciones: '' };

  consultaSeleccionada: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicioMedico: ServicioMedicoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const tokenParam = params.get('token');
      if (tokenParam) {
        this.token = tokenParam;
        this.loadProfile();
        this.loadConsultas();
      } else {
        this.errorProfile = 'Token no proporcionado';
        this.isLoadingProfile = false;
        this.isLoadingConsultas = false;
      }
    });
  }

  loadProfile() {
    this.isLoadingProfile = true;
    this.errorProfile = '';
    this.servicioMedico.getMedicalProfileByQr(this.token)
      .pipe(finalize(() => {
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.medicalProfile = res.data;
          } else {
            this.errorProfile = res.message || 'No se encontró el expediente.';
          }
        },
        error: (err: any) => {
          this.errorProfile = err?.error?.message || 'Error al cargar el expediente.';
        }
      });
  }

  loadConsultas() {
    this.isLoadingConsultas = true;
    this.servicioMedico.getConsultas(this.token)
      .pipe(finalize(() => {
        this.isLoadingConsultas = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.consultas = res.data;
          }
        },
        error: (err) => console.error('Error al cargar consultas', err)
      });
  }

  goBack() {
    this.router.navigate(['/servicio-medico/escaner']);
  }

  guardarDatosGenerales() {
    this.isSavingProfile = true;
    const payload = {
      token: this.token,
      blood_type: this.medicalProfile.blood_type,
      allergies: this.medicalProfile.allergies,
      chronic_conditions: this.medicalProfile.chronic_conditions,
      active_medications: this.medicalProfile.active_medications,
      family_history: this.medicalProfile.family_history,
      surgical_history: this.medicalProfile.surgical_history,
      general_notes: this.medicalProfile.general_notes
    };

    this.servicioMedico.updateMedicalProfile(payload)
      .pipe(finalize(() => {
        this.isSavingProfile = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire('Éxito', 'Datos generales guardados correctamente.', 'success');
          } else {
            Swal.fire('Error', 'Error: ' + res.message, 'error');
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Error al guardar datos generales.', 'error');
        }
      });
  }

  notifyAdmin() {
    if (!this.medicalProfile) return;
    
    this.isNotifyingAdmin = true;
    const fullName = `${this.medicalProfile.first_name || this.medicalProfile.firstName || ''} ${this.medicalProfile.last_name || this.medicalProfile.lastName || ''}`.trim();
    
    this.servicioMedico.notificarAdminCursos({ name: fullName })
      .pipe(finalize(() => {
        this.isNotifyingAdmin = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Notificación Enviada',
              text: 'Se ha notificado al administrador exitosamente.',
              timer: 2500,
              showConfirmButton: false
            });
          } else {
            Swal.fire('Error', res.message || 'No se pudo enviar la notificación.', 'error');
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Error de conexión al enviar WhatsApp.', 'error');
        }
      });
  }

  iniciarNuevaConsulta() {
    this.nuevaConsultaData = this.getDefaultConsultaData();
    this.activeTab = 'nueva_consulta';
  }

  cancelarConsulta() {
    this.activeTab = 'expediente';
  }

  getDefaultConsultaData() {
    return {
      ubicacion_netsuite: '',
      ta_sistolica: null,
      ta_diastolica: null,
      fc: null,
      fr: null,
      temperatura: null,
      peso: null,
      talla: null,
      imc: null,
      saturacion_o2: null,
      glucosa: null,
      notas_enfermeria: '',
      motivo_consulta: '',
      padecimiento_actual: '',
      exploracion_fisica: '',
      diagnostico: '',
      plan_tratamiento: '',
      materiales_json: []
    };
  }

  calcularIMC() {
    if (this.nuevaConsultaData.peso && this.nuevaConsultaData.talla) {
      const peso = parseFloat(this.nuevaConsultaData.peso);
      const tallaMetros = parseFloat(this.nuevaConsultaData.talla) / 100;
      if (tallaMetros > 0) {
        const imc = peso / (tallaMetros * tallaMetros);
        this.nuevaConsultaData.imc = imc.toFixed(2);
      }
    } else {
      this.nuevaConsultaData.imc = null;
    }
  }

  agregarMaterial() {
    if (!this.nuevoMaterial.material || this.nuevoMaterial.cantidad <= 0) return;
    this.nuevaConsultaData.materiales_json.push({ ...this.nuevoMaterial });
    this.nuevoMaterial = { material: '', cantidad: 0, observaciones: '' };
  }

  removerMaterial(index: number) {
    this.nuevaConsultaData.materiales_json.splice(index, 1);
  }

  guardarConsulta(cerrar: boolean) {
    if (!this.nuevaConsultaData.motivo_consulta) {
      Swal.fire('Atención', 'El motivo de la consulta es obligatorio', 'warning');
      return;
    }

    this.isSavingConsulta = true;
    const payload = {
      ...this.nuevaConsultaData,
      patient_token: this.token,
      patient_type: this.medicalProfile?.patient_type
    };

    this.servicioMedico.createConsulta(payload)
      .pipe(finalize(() => {
        this.isSavingConsulta = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire('Éxito', 'Consulta registrada correctamente', 'success');
            if (cerrar) {
              this.cancelarConsulta();
            } else {
              this.nuevaConsultaData = this.getDefaultConsultaData();
            }
            this.loadConsultas(); // Recargar historial
          } else {
            Swal.fire('Error', 'Error: ' + res.message, 'error');
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Error al guardar la consulta', 'error');
        }
      });
  }

  hasRisk(value: string | null | undefined): boolean {
    if (!value) return false;
    const valLow = value.toLowerCase().trim();
    if (valLow === 'ninguna' || valLow === 'ninguno' || valLow === 'no' || valLow === 'na' || valLow === 'n/a') {
      return false;
    }
    return true;
  }
}
