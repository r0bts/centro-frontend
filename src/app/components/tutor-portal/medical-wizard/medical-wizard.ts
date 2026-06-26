import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TutorApiService } from '../../../services/tutor-portal/tutor-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medical-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-wizard.html',
  styleUrls: ['./medical-wizard.scss']
})
export class MedicalWizardComponent implements OnInit {
  currentStep = 1;
  isLoading = false;
  isSaving = false;
  participantId: string | null = null;
  consentAccepted = false;

  respuestas: any = {
    nombre_completo: '',
    edad: '',
    sexo: '',
    fecha_nacimiento: '',
    grupo_sanguineo: '',
    contacto_emergencia_telefono: '',
    enfermo_actualmente: 'No',
    enfermedades_personales_otra: '',
    alergias_tipo_otra: '',
    toma_medicamento: 'No',
    medicamentos_actuales: '',
    fuma: 'No',
    actividad_fisica: 'No',
    alimentacion: 'Buena',
    notas_adicionales: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tutorApi: TutorApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.participantId = this.route.snapshot.paramMap.get('id');
    if (!this.participantId) {
      this.goBack();
      return;
    }
    this.loadRecord();
  }

  loadRecord() {
    console.log('loadRecord() started in wizard');
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.tutorApi.getMedicalFull(this.participantId as string).subscribe({
      next: (res: any) => {
        console.log('loadRecord() SUCCESS:', res);
        this.isLoading = false;
        if (res.success && res.data && res.data.respuestas_json) {
          this.respuestas = { ...this.respuestas, ...res.data.respuestas_json };
          this.consentAccepted = res.data.consent_status === 'accepted';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('loadRecord() ERROR:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/tutor-portal/dashboard']);
  }

  goToStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  nextStep() {
    // Basic validation depending on the step can be added here
    this.currentStep++;
    window.scrollTo(0, 0);
  }

  saveFull() {
    if (!this.consentAccepted) return;
    
    this.isSaving = true;
    this.cdr.markForCheck();
    const payload = {
      socio_id: this.participantId, // Assuming ID is socio_id
      respuestas_json: this.respuestas,
      consent_status: 'accepted'
    };

    this.tutorApi.saveMedicalFull(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.cdr.markForCheck();
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Expediente Guardado!',
            text: 'Su expediente médico se ha guardado correctamente.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#4f46e5'
          }).then(() => {
            this.goBack();
          });
        } else {
          Swal.fire('Error', res.message || 'No se pudo guardar el expediente.', 'error');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.cdr.markForCheck();
        Swal.fire('Error', 'Error de conexión al guardar el expediente.', 'error');
      }
    });
  }
}
