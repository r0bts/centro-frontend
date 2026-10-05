import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../../../content-menu/content-menu';
import { MembresiaService } from '../../../../services/membresia.service';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicio-medico-socios',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './servicio-medico-socios.html',
  styleUrl: './servicio-medico-socios.scss'
})
export class ServicioMedicoSocios implements AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  searchTerm: string = '';
  searchSubject: Subject<string> = new Subject<string>();
  searchSubscription!: Subscription;
  

  isCameraOpen: boolean = false;
  html5QrCode: Html5Qrcode | null = null;
  cameraError: string | null = null;
  
  isLoading: boolean = false;
  searchResults: any[] = [];
  hasSearched: boolean = false;

  constructor(
    private membresiaService: MembresiaService,
    private router: Router
  ) {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(term => {
        if (term) {
          this.isLoading = true;
          this.hasSearched = true;
        }
      }),
      switchMap(term => {
        if (!term) return of(null);
        return this.membresiaService.buscar(term).pipe(
          catchError(err => {
            console.error('Error buscando socios:', err);
            return of(null);
          })
        );
      })
    ).subscribe((res: any) => {
      this.isLoading = false;
      if (res && res.success && res.data) {
        this.searchResults = res.data.socios || [];
      } else {
        this.searchResults = [];
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    this.stopCamera();
    }
  }

  onSearchModelChange(termRaw: string) {
    const term = termRaw.trim();
    
    if (!term) {
      this.searchResults = [];
      this.hasSearched = false;
      return;
    }
    
    // Si el input parece ser del escáner (ej: MEMBER:xxxxx:50)
    if (term.startsWith('MEMBER:')) {
      this.handleScannerInput(term);
      return;
    }
    
    // Permitir buscar si tiene al menos 3 letras, o si es un número válido (no vacío)
    if (term.length >= 3 || (!isNaN(Number(term)) && term.length > 0)) {
      this.searchSubject.next(term);
    } else {
      this.searchResults = [];
      this.hasSearched = false;
    }
  }


  toggleCamera() {
    if (this.isCameraOpen) {
      this.stopCamera();
    } else {
      this.isCameraOpen = true;
      this.cameraError = null;
      setTimeout(() => {
        this.startScanner();
      }, 300);
    }
  }

  startScanner() {
    if (!this.html5QrCode) {
      this.html5QrCode = new Html5Qrcode('qr-reader-socios');
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    const tryStart = (facingMode: string) => {
      return this.html5QrCode!.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          this.stopCamera();
          this.handleScannerInput(decodedText);
        },
        (errorMessage) => { }
      );
    };

    tryStart('environment').catch((err) => {
      return tryStart('user');
    }).catch((err) => {
      this.cameraError = 'No se pudo acceder a la cámara. Por favor, autoriza los permisos de tu navegador.';
    });
  }

  stopCamera() {
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      this.html5QrCode.stop().then(() => {
        this.isCameraOpen = false;
      }).catch(err => {
        console.error("Error al detener cámara:", err);
        this.isCameraOpen = false;
      });
    } else {
      this.isCameraOpen = false;
    }
  }

  handleScannerInput(token: string) {
    const parts = token.split(':');
    if (parts.length >= 3) {
      const socioId = parts[2];
      this.abrirExpediente(socioId);
    } else {
      Swal.fire('Error', 'Código QR no válido', 'error');
      this.searchTerm = '';
    }
  }



  getSocioImage(fotoUrl: string | null | undefined): string | null {
    if (!fotoUrl) return null;
    if (fotoUrl.startsWith('http') || fotoUrl.startsWith('assets/')) return fotoUrl;
    if (fotoUrl.startsWith('data:image')) return fotoUrl;
    // Si es base64 sin el prefijo (NetSuite)
    const cleanBase64 = fotoUrl.includes(',') ? fotoUrl.split(',')[1] : fotoUrl;
    return `data:image/jpeg;base64,${cleanBase64}`;
  }

  getInitials(nombreCompleto: string): string {
    if (!nombreCompleto) return 'U';
    const parts = nombreCompleto.trim().split(' ').filter(p => p.length > 0);
    // Eliminar números si el nombre incluye el id al inicio
    const nameParts = parts.filter(p => isNaN(Number(p)));
    
    if (nameParts.length === 0) return 'U';
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  }

  abrirExpediente(socioId: string | number) {
    this.router.navigate(['/servicio-medico/expediente', socioId], { queryParams: { type: 'socio' } });
  }

  goBack() {
    if (this.isCameraOpen) {
      this.stopCamera();
    }
    this.router.navigate(['/servicio-medico/dashboard']);
  }
}
