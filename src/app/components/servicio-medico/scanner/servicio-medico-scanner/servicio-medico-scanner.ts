import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { ContentMenu } from '../../../content-menu/content-menu';
import { ServicioMedicoService } from '../../../../services/servicio-medico';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-servicio-medico-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './servicio-medico-scanner.html',
  styleUrl: './servicio-medico-scanner.scss'
})
export class ServicioMedicoScanner implements AfterViewInit, OnDestroy {
  @ViewChild('qrInput') qrInput!: ElementRef;

  html5QrCode: Html5Qrcode | null = null;
  isScanning: boolean = false;
  cameraError: string | null = null;

  qrToken: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  medicalProfile: any = null;

  constructor(
    private router: Router,
    private servicioMedico: ServicioMedicoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.startScanner();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  startScanner() {
    this.isScanning = true;
    this.medicalProfile = null;
    this.qrToken = '';
    this.cameraError = null;
    this.errorMessage = '';

    setTimeout(() => {
      if (this.qrInput && this.qrInput.nativeElement) {
        this.qrInput.nativeElement.focus();
      }

      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode('qr-reader-medical');
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        const tryStart = (facingMode: string) => {
          return this.html5QrCode!.start(
            { facingMode: facingMode },
            config,
            (decodedText) => {
              this.qrToken = decodedText;
              this.onScan();
            },
            (errorMessage) => {
              // ignore parse errors
            }
          );
        };

        tryStart('environment').catch((err) => {
          console.warn('Environment camera failed, trying user camera...', err);
          return tryStart('user');
        }).catch((err) => {
          this.cameraError = 'No se pudo acceder a la cámara. Sin embargo, puedes usar una pistola lectora o escribir el código manualmente abajo.';
          console.error('Camera Error:', err);
          this.cdr.detectChanges();
        });
      }
    }, 200);
  }

  stopScanner() {
    this.isScanning = false;
    this.cdr.detectChanges();
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      this.html5QrCode.stop().then(() => {
        this.html5QrCode?.clear();
        this.html5QrCode = null;
      }).catch(err => console.error(err));
    }
  }

  goBack() {
    this.stopScanner();
    this.router.navigate(['/servicio-medico/dashboard']);
  }

  onScan() {
    if (!this.qrToken || !this.qrToken.trim()) return;
    
    // Si viene de URL (ej. escanear un QR real), extraemos el token
    let token = this.qrToken.trim();
    if (token.includes('/credencial/')) {
      const parts = token.split('/credencial/');
      token = parts[parts.length - 1];
    } else if (token.includes('=')) {
      const parts = token.split('=');
      token = parts[parts.length - 1];
    }
    this.qrToken = token;

    this.isLoading = true;
    this.errorMessage = '';
    this.medicalProfile = null;
    this.stopScanner(); // Detenemos la cámara al procesar

    this.servicioMedico.getMedicalProfileByQr(this.qrToken)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.medicalProfile = res.data;
          } else {
            this.medicalProfile = res;
          }
          this.qrToken = '';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error fetching medical profile:', err);
          this.errorMessage = err?.error?.message || 'No se encontró el expediente asociado a este código QR o ha caducado.';
          this.qrToken = '';
          this.startScanner(); // Reactivamos el escáner si hubo error
          this.cdr.detectChanges();
        }
      });
  }

  clearResult() {
    this.medicalProfile = null;
    this.qrToken = '';
    this.startScanner();
  }

  registerVisit() {
    console.log('Registrando visita para:', this.medicalProfile);
    alert('Funcionalidad para registrar consulta en construcción.');
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
