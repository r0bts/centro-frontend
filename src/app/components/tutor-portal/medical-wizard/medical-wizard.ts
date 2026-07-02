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
  isLoading = false;
  isSaving = false;
  participantId: string | null = null;
  consentAccepted = false;
  
  showBloodSheet = false;
  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido'];

  alergiasChips: string[] = [];
  alergiaInput: string = '';

  padecimientosChips: string[] = [];
  padecimientoInput: string = '';

  respuestas: any = {
    tipo_sangre: '',
    alergias: '',
    padecimientos_cronicos: '',
    medicamentos_actuales: '',
    antecedentes_familiares: '',
    antecedentes_quirurgicos: '',
    notas_generales: ''
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
          let loadedRespuestas = res.data.respuestas_json;
          if (typeof loadedRespuestas === 'string') {
            try {
              loadedRespuestas = JSON.parse(loadedRespuestas);
            } catch (e) {
              console.error('Error parsing respuestas_json', e);
              loadedRespuestas = {};
            }
          }
          this.respuestas = { ...this.respuestas, ...loadedRespuestas };
          this.consentAccepted = res.data.consent_status === 'accepted';
          this.syncAlergiasChips();
          this.syncPadecimientosChips();
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

  openBloodSheet() {
    this.showBloodSheet = true;
  }

  closeBloodSheet() {
    this.showBloodSheet = false;
  }

  selectBloodType(bt: string) {
    this.respuestas.tipo_sangre = bt;
    this.closeBloodSheet();
  }

  syncAlergiasChips() {
    if (this.respuestas.alergias) {
      this.alergiasChips = this.respuestas.alergias.split(',')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);
    } else {
      this.alergiasChips = [];
    }
  }

  onAlergiaInput(event: any) {
    const val = event.target.value;
    if (val.includes(',')) {
      this.addAlergia(val.replace(',', '').trim());
    }
  }

  onAlergiaKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.preventDefault();
      this.addAlergia(this.alergiaInput.trim());
    }
  }

  onAlergiaBlur() {
    if (this.alergiaInput.trim()) {
      this.addAlergia(this.alergiaInput.trim());
    }
  }

  addAlergia(val: string) {
    if (val && !this.alergiasChips.includes(val)) {
      this.alergiasChips.push(val);
      this.respuestas.alergias = this.alergiasChips.join(', ');
    }
    this.alergiaInput = '';
  }

  removeAlergia(index: number) {
    this.alergiasChips.splice(index, 1);
    this.respuestas.alergias = this.alergiasChips.join(', ');
  }

  syncPadecimientosChips() {
    if (this.respuestas.padecimientos_cronicos) {
      this.padecimientosChips = this.respuestas.padecimientos_cronicos.split(',')
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);
    } else {
      this.padecimientosChips = [];
    }
  }

  onPadecimientoInput(event: any) {
    const val = event.target.value;
    if (val.includes(',')) {
      this.addPadecimiento(val.replace(',', '').trim());
    }
  }

  onPadecimientoKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.preventDefault();
      this.addPadecimiento(this.padecimientoInput.trim());
    }
  }

  onPadecimientoBlur() {
    if (this.padecimientoInput.trim()) {
      this.addPadecimiento(this.padecimientoInput.trim());
    }
  }

  addPadecimiento(val: string) {
    if (val && !this.padecimientosChips.includes(val)) {
      this.padecimientosChips.push(val);
      this.respuestas.padecimientos_cronicos = this.padecimientosChips.join(', ');
    }
    this.padecimientoInput = '';
  }

  removePadecimiento(index: number) {
    this.padecimientosChips.splice(index, 1);
    this.respuestas.padecimientos_cronicos = this.padecimientosChips.join(', ');
  }

  saveFull() {
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
