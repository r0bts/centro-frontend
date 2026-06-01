import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-summer-course-scanner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './summer-course-scanner.html',
  styleUrls: ['./summer-course-scanner.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SummerCourseScannerComponent implements OnInit, OnDestroy {
  html5QrCode: Html5Qrcode | null = null;
  isScanning = false;
  isLoading = false;
  isProcessing = false;
  cameraError: string | null = null;
  manualToken: string = '';
  
  // Scanned Pass state
  scannedPass: any = null;

  constructor(
    private summerCourseApi: SummerCourseScannerService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.startScanner();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  startScanner() {
    if (this.html5QrCode) {
      return;
    }
    
    this.isScanning = true;
    this.isLoading = false;
    this.isProcessing = false;
    this.scannedPass = null;
    this.manualToken = '';
    this.cameraError = null;
    
    // Slight delay to allow DOM to render the reader div
    setTimeout(() => {
      this.html5QrCode = new Html5Qrcode('qr-reader');
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const tryStart = (facingMode: string) => {
        return this.html5QrCode!.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            this.onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // parse errors are frequent, ignore them
          }
        );
      };

      tryStart('environment').catch((err) => {
        console.warn('Environment camera failed, trying user camera...', err);
        return tryStart('user');
      }).catch((err) => {
        this.isScanning = false;
        this.cameraError = 'No se pudo acceder a la cámara. Asegúrate de dar permisos en tu navegador.';
        console.error('Camera Error:', err);
        this.cdr.detectChanges();
      });
    }, 200);
  }

  submitManualToken() {
    if (!this.manualToken || this.manualToken.trim() === '') return;
    this.onScanSuccess(this.manualToken.trim());
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

  onScanSuccess(decodedText: string) {
    if (this.isLoading) return;
    
    this.stopScanner();
    this.validateToken(decodedText);
  }

  validateToken(token: string) {
    this.isLoading = true;
    this.cdr.detectChanges(); // Force UI update
    
    // Extraer token si es URL
    if (token.includes('/pase-salida/')) {
      const parts = token.split('/pase-salida/');
      token = parts[parts.length - 1];
    } else if (token.includes('/credencial/')) {
      const parts = token.split('/credencial/');
      token = parts[parts.length - 1];
    } else if (token.includes('=')) {
        // En caso de que haya un querystring
        const parts = token.split('=');
        token = parts[parts.length - 1];
    }
    
    this.summerCourseApi.validatePickupPass(token).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        if (res.success) {
          this.playSuccessSound();
          this.scannedPass = res.data;
          this.scannedPass.token = token; // store for processing
        } else {
          this.showError(res.message || 'Pase inválido');
        }
        this.cdr.detectChanges(); // Force UI update AFTER state is fully updated
      },
      error: (err) => {
        this.isLoading = false;
        
        const msg = err.error?.message || 'Error al validar el pase.';
        this.showError(msg);
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }

  processPass() {
    if (!this.scannedPass || !this.scannedPass.token || this.isProcessing) return;
    
    this.isProcessing = true;
    this.cdr.detectChanges(); // Force UI update
    
    this.summerCourseApi.processPickupPass(this.scannedPass.token).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        
        if (res.success) {
          this.playSuccessSound();
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '¡Salida Registrada!',
            showConfirmButton: false,
            timer: 1500
          });
          
          // Do not navigate away. Just restart scanner to be ready for the next one.
          this.scannedPass = null;
          this.startScanner();
        } else {
          this.showError(res.message);
        }
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        this.isProcessing = false;
        this.showError(err.error?.message || 'Error al procesar.');
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }

  showError(message: string) {
    Swal.fire({
      title: 'Pase Inválido',
      text: message,
      icon: 'error',
      confirmButtonText: 'Escanear de Nuevo'
    }).then(() => {
      this.startScanner();
    });
  }

  playSuccessSound() {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.15);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.15);
    } catch (e) {
      console.log('Audio not supported', e);
    }
  }
}
