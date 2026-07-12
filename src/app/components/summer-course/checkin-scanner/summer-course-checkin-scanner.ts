import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-summer-course-checkin-scanner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './summer-course-checkin-scanner.html',
  styleUrls: ['./summer-course-checkin-scanner.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SummerCourseCheckinScannerComponent implements OnInit, OnDestroy {
  html5QrCode: Html5Qrcode | null = null;
  isScanning = false;
  isLoading = false;
  isProcessing = false;
  cameraError: string | null = null;
  manualToken: string = '';
  
  // Scanned Checkin state
  scannedData: any = null;

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
    this.scannedData = null;
    this.manualToken = '';
    this.cameraError = null;
    this.cdr.detectChanges(); // render the #qr-reader-checkin div before instantiating Html5Qrcode
    
    // Slight delay to allow DOM to render the reader div
    setTimeout(() => {
      this.html5QrCode = new Html5Qrcode('qr-reader-checkin');
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const tryStart = (facingMode: string) => {
        return this.html5QrCode!.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            this.ngZone.run(() => this.onScanSuccess(decodedText));
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
    if (this.isLoading || this.isProcessing) return;
    
    this.stopScanner();
    this.processToken(decodedText);
  }

  processToken(token: string) {
    this.isProcessing = true;
    this.cdr.detectChanges(); // Force UI update
    
    // Extraer token si es URL
    if (token.includes('/credencial/')) {
      const parts = token.split('/credencial/');
      token = parts[parts.length - 1];
    } else if (token.includes('=')) {
        // En caso de que haya un querystring
        const parts = token.split('=');
        token = parts[parts.length - 1];
    }
    
    this.summerCourseApi.processCheckin(token).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        
        if (res.success) {
          // Guardamos data para mostrarla en pantalla
          this.scannedData = res.data;
          this.scannedData.success = true;
          this.cdr.detectChanges();
          
          this.playSuccessSound();
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '¡Registrado: ' + this.scannedData.participant.first_name
              + (this.scannedData.level_roman ? ' · Nivel ' + this.scannedData.level_roman : '')
              + (this.scannedData.group_alias ? ' · Grupo ' + this.scannedData.group_alias : '') + '!',
            showConfirmButton: false,
            timer: 5000
          });
          
          // Flash success screen briefly, then restart
          setTimeout(() => {
             this.startScanner();
          }, 5000); // Muestra la foto por 5 segundos
          
        } else {
          this.showError(res.message || 'Token inválido');
        }
      },
      error: (err) => {
        this.isProcessing = false;
        const msg = err.error?.message || 'Error al procesar check-in.';
        this.showError(msg);
      }
    });
  }

  showError(message: string) {
    Swal.fire({
      title: 'Validación',
      text: message,
      icon: 'warning',
      confirmButtonText: 'Escanear de Nuevo'
    }).then(() => {
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
