import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TutorApiService } from '../../../services/tutor-portal/tutor-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medical-simplified',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-simplified.html',
  styleUrls: ['./medical-simplified.scss']
})
export class MedicalSimplifiedComponent implements OnInit {
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
    alergias_tipo_otra: '',
    medicamentos_actuales: '',
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
    console.log('loadRecord() started');
    this.isLoading = true;
    this.cdr.detectChanges(); // Use detectChanges instead of markForCheck
    
    this.tutorApi.getMedicalSimplified(this.participantId as string).subscribe({
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

  saveSimplified() {
    if (!this.consentAccepted) return;
    
    this.isSaving = true;
    this.cdr.markForCheck();
    const payload = {
      guest_id: this.participantId, // We assume participant is a guest (SummerCourseGuest)
      respuestas_json: this.respuestas,
      consent_status: 'accepted'
    };

    this.tutorApi.saveMedicalSimplified(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.cdr.markForCheck();
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Cuestionario Guardado!',
            text: 'La información se ha guardado correctamente para el curso de verano.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#4f46e5'
          }).then(() => {
            this.goBack();
          });
        } else {
          Swal.fire('Error', res.message || 'No se pudo guardar la información.', 'error');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.cdr.markForCheck();
        Swal.fire('Error', 'Error de conexión al guardar.', 'error');
      }
    });
  }
}
