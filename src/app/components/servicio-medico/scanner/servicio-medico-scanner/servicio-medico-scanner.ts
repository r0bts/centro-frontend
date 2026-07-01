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
  needsPermissionButton: boolean = false;

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

    this.cdr.detectChanges(); // Forzar renderizado del DOM

    setTimeout(() => {
      if (this.qrInput && this.qrInput.nativeElement) {
        this.qrInput.nativeElement.focus();
      }

      if (!this.html5QrCode) {
        try {
          this.html5QrCode = new Html5Qrcode('qr-reader-medical');
        } catch (e) {
          console.error("Error inicializando Html5Qrcode:", e);
          this.cameraError = 'Error interno al cargar el escáner.';
          this.isScanning = false;
          this.cdr.detectChanges();
          return;
        }
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
          if (err && err.name === 'NotAllowedError' || err && err.message && err.message.includes('permission')) {
             this.needsPermissionButton = true;
             this.cameraError = 'La cámara está bloqueada por el navegador. Presiona el botón de abajo para autorizar el acceso.';
          } else {
             this.cameraError = 'No se pudo acceder a la cámara. Sin embargo, puedes usar una pistola lectora o escribir el código manualmente abajo.';
          }
          console.error('Camera Error:', err);
          this.cdr.detectChanges();
        });
      }
    }, 200);
  }

  stopScanner() {
    this.isScanning = false;
    setTimeout(() => this.cdr.detectChanges(), 0);
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
    
    // Manejo más robusto de URLs para extraer el ID final
    let token = this.qrToken.trim();
    if (token.includes('=')) {
      const parts = token.split('=');
      token = parts[parts.length - 1];
    } else if (token.includes('/')) {
      const parts = token.split('/');
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
          if (res.success) {
            this.router.navigate(['/servicio-medico/expediente', this.qrToken]);
          } else {
            this.errorMessage = res.message || 'No se encontró el expediente.';
            this.qrToken = '';
            // NO llamamos a startScanner() de inmediato para que el usuario pueda ver el error
            // o lo reactivamos pero sin borrar el errorMessage
            this.restartScannerWithoutClearingError();
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error fetching medical profile:', err);
          this.errorMessage = err?.error?.message || 'No se encontró el expediente asociado a este código QR o ha caducado.';
          this.qrToken = '';
          this.restartScannerWithoutClearingError();
          this.cdr.detectChanges();
        }
      });
  }

  restartScannerWithoutClearingError() {
    this.isScanning = true;
    this.cdr.detectChanges(); // Forzar renderizado del DOM

    setTimeout(() => {
      if (this.qrInput && this.qrInput.nativeElement) {
        this.qrInput.nativeElement.focus();
      }
      if (!this.html5QrCode) {
        try {
          this.html5QrCode = new Html5Qrcode('qr-reader-medical');
        } catch (e) {
          console.error("Error inicializando Html5Qrcode en restart:", e);
          this.cameraError = 'Error interno al cargar el escáner.';
          this.isScanning = false;
          this.cdr.detectChanges();
          return;
        }
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        const tryStart = (facingMode: string) => {
          return this.html5QrCode!.start(
            { facingMode: facingMode }, config,
            (decodedText) => { this.qrToken = decodedText; this.onScan(); },
            (errorMessage) => {}
          );
        };
        
        tryStart('environment').catch(() => tryStart('user')).catch(err => {
             if (err && err.name === 'NotAllowedError' || err && err.message && err.message.includes('permission')) {
                this.needsPermissionButton = true;
                this.cameraError = 'La cámara está bloqueada por el navegador.';
             } else {
                this.cameraError = 'No se pudo acceder a la cámara.';
             }
             this.cdr.detectChanges();
        });
      }
    }, 200);
  }
  
  requestCameraPermission() {
    this.needsPermissionButton = false;
    this.cameraError = null;
    this.startScanner();
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
