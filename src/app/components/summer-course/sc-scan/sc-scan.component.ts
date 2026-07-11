import {
  Component, OnInit, OnDestroy, signal, inject,
  ChangeDetectorRef, NgZone, ViewEncapsulation
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

interface ScanResult {
  participant: { id: number; first_name: string; last_name: string; photo_url: string | null; age: number | null };
  assigned_level: number | null;
  level_roman: string | null;
  level_age: string | null;
  group_alias: string | null;
  belongs_to_group: boolean;
  has_checkin_today: boolean;
  has_entrance_today: boolean;
  entrance_checked_at: string | null;
  checkin_registered: boolean;
  checkin_error: string | null;
  warning: string | null;
  payment_status: string;
}

interface ScanEntry {
  id: string;
  participant_name: string;
  participant_photo_url: string | null;
  level_roman: string | null;
  group_alias: string | null;
  final_group_alias: string | null;
  checked_in_at: string;
  out_of_group: boolean;
  has_entrance_today: boolean;
  entrance_checked_at: string | null;
  instructor_name: string | null;
}

interface CheckoutResult {
  status_color: 'green' | 'yellow' | 'red';
  message: string;
  is_dynamic: boolean;
  is_static_credential_alone?: boolean;
  pass_id: number | null;
  authorized_name?: string;
  authorized_photo_url?: string | null;
  authorized_pickups?: Array<{name: string, relationship: string, phone: string, photo_url: string | null}>;
  participant: { id: number; first_name: string; last_name: string; photo_url: string | null };
  can_leave_alone: boolean;
  warning?: string | null;
  token?: string;
}

@Component({
  selector: 'app-sc-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './sc-scan.component.html',
  styleUrl: './sc-scan.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ScScanComponent implements OnInit, OnDestroy {
  private route   = inject(ActivatedRoute);
  private http    = inject(HttpClient);
  private cdr     = inject(ChangeDetectorRef);
  private ngZone  = inject(NgZone);

  private readonly apiUrl     = `${environment.apiUrl}/public/sc-scan`;
  private readonly historyUrl = `${environment.apiUrl}/public/sc-scan-history`;
  private readonly checkoutValidateUrl = `${environment.apiUrl}/public/sc-validate-first-checkout`;
  private readonly checkoutProcessUrl  = `${environment.apiUrl}/public/sc-process-first-checkout`;

  groupAlias   = signal<string>('');
  manualToken  = signal<string>('');

  mode         = signal<'entrada' | 'salida'>('entrada');

  scanning     = signal(false);
  processing   = signal(false);
  cameraError  = signal<string | null>(null);

  // Entrada
  result       = signal<ScanResult | null>(null);
  // Salida
  checkoutResult = signal<CheckoutResult | null>(null);
  selectedPickupName = signal<string | null>(null);

  errorMsg     = signal<string | null>(null);
  lastToken    = signal<string>('');
  scannedList  = signal<ScanEntry[]>([]);

  /** 'idle' | 'ok' | 'warning' | 'error' | 'already' */
  state        = signal<'idle' | 'ok' | 'warning' | 'error' | 'already'>('idle');

  private html5QrCode: Html5Qrcode | null = null;

  ngOnInit(): void {
    const alias = this.route.snapshot.paramMap.get('groupAlias') ?? '';
    this.groupAlias.set(decodeURIComponent(alias));
    this.loadInitialHistory();
    setTimeout(() => this.startCamera(), 300);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  setMode(newMode: 'entrada' | 'salida'): void {
    if (this.mode() === newMode) return;
    this.mode.set(newMode);
    this.reset();
  }

  // ── Cámara ────────────────────────────────────────────────────────────────

  startCamera(): void {
    if (this.html5QrCode) return;
    this.scanning.set(true);
    this.cameraError.set(null);

    this.html5QrCode = new Html5Qrcode('sc-scan-reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const tryStart = (facingMode: string) =>
      this.html5QrCode!.start(
        { facingMode },
        config,
        (decoded) => { this.ngZone.run(() => this.onScan(decoded)); },
        () => {}
      );

    tryStart('environment')
      .catch(() => tryStart('user'))
      .catch((err) => {
        this.ngZone.run(() => {
          this.scanning.set(false);
          this.cameraError.set('No se pudo acceder a la cámara. Usa la entrada manual.');
          this.cdr.detectChanges();
        });
        console.error(err);
      });
  }

  stopCamera(): void {
    if (this.html5QrCode?.isScanning) {
      this.html5QrCode.stop().catch(() => {}).finally(() => {
        this.html5QrCode = null;
        this.scanning.set(false);
      });
    }
  }

  // ── Escaneo ───────────────────────────────────────────────────────────────

  onScan(token: string): void {    
    if (this.processing() || token === this.lastToken()) return;
    
    // Extraer token si es URL (como en el final scanner)
    let parsedToken = token;
    if (parsedToken.includes('/pase-salida/')) {
      const parts = parsedToken.split('/pase-salida/');
      parsedToken = parts[parts.length - 1];
    } else if (parsedToken.includes('/credencial/')) {
      const parts = parsedToken.split('/credencial/');
      parsedToken = parts[parts.length - 1];
    } else if (parsedToken.includes('=')) {
      const parts = parsedToken.split('=');
      parsedToken = parts[parts.length - 1];
    }

    this.lastToken.set(parsedToken);
    
    if (this.mode() === 'entrada') {
      this.callApiEntrada(parsedToken, false);
    } else {
      this.callApiSalida(parsedToken);
    }
  }

  submitManual(): void {
    const t = this.manualToken().trim();
    if (!t) return;
    this.onScan(t);
    this.manualToken.set('');
  }

  acceptForce(): void {
    const t = this.lastToken();
    if (!t) return;
    this.callApiEntrada(t, true);
  }

  reset(): void {
    this.result.set(null);
    this.checkoutResult.set(null);
    this.selectedPickupName.set(null);
    this.state.set('idle');
    this.errorMsg.set(null);
    this.lastToken.set('');
    // Reactivar lectura de cámara en 1 s
    setTimeout(() => {
      if (!this.html5QrCode?.isScanning && !this.cameraError()) {
        this.stopCamera();
        this.html5QrCode = null;
        setTimeout(() => this.startCamera(), 300);
      }
    }, 1000);
  }

  // ── API ENTRADA ────────────────────────────────────────────────────────────

  private loadInitialHistory(): void {
    const alias = this.groupAlias();
    if (!alias) return;
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString().split('T')[0];

    this.http.get<{ success: boolean; data: { history: any[] } }>(
      this.historyUrl, { params: { group_alias: alias, date: today } }
    ).subscribe({
      next: (res) => {
        if (res.success && res.data.history?.length) {
          this.ngZone.run(() => {
            this.scannedList.set(res.data.history.map((h: any) => ({
              id:                    h.id?.toString() ?? (Date.now() + Math.random()).toString(),
              participant_name:      h.participant_name,
              participant_photo_url: h.participant_photo_url ?? null,
              level_roman:           h.level_roman ?? null,
              group_alias:           h.group_alias ?? null,
              final_group_alias:     h.final_group_alias ?? null,
              checked_in_at:         h.checked_in_at,
              out_of_group:          h.out_of_group ?? false,
              has_entrance_today:    h.has_entrance_today ?? false,
              entrance_checked_at:   h.entrance_checked_at ?? null,
              instructor_name:       h.instructor_name ?? null,
            })));
            this.cdr.detectChanges();
          });
        }
      },
      error: () => {} // silencioso
    });
  }

  private callApiEntrada(token: string, force: boolean): void {
    this.processing.set(true);
    this.result.set(null);
    this.errorMsg.set(null);

    this.http.post<{ success: boolean; message: string; data: ScanResult }>(
      this.apiUrl,
      { token, group_alias: this.groupAlias(), force }
    ).subscribe({
      next: (res) => {
        this.processing.set(false);
        if (!res.success) {
          this.state.set('error');
          this.errorMsg.set(res.message);
          this.cdr.detectChanges();
          return;
        }
        const d = res.data;
        this.result.set(d);

        // Agregar a la lista de la sesión si se registró un check-in nuevo
        if (d.checkin_registered) {
          this.scannedList.update(list => [{
            id:                    Date.now().toString(),
            participant_name:      `${d.participant.first_name} ${d.participant.last_name}`,
            participant_photo_url: d.participant.photo_url,
            level_roman:           d.level_roman,
            group_alias:           d.group_alias,
            final_group_alias:     this.groupAlias(),
            checked_in_at:         new Date().toISOString(),
            out_of_group:          !d.belongs_to_group,
            has_entrance_today:    d.has_entrance_today,
            entrance_checked_at:   d.entrance_checked_at,
            instructor_name:       null,
          }, ...list]);
        }

        if (d.checkin_registered) {
          this.state.set('ok');
          // Auto-reset tras 4 s cuando se registró check-in (en grupo o forzado)
          setTimeout(() => this.reset(), 4000);
        } else if (d.has_checkin_today) {
          this.state.set('already');
        } else if (!d.belongs_to_group) {
          this.state.set('warning');
        } else {
          this.state.set('ok');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.processing.set(false);
        this.state.set('error');
        this.errorMsg.set(err?.error?.message ?? 'Error de red. Intenta de nuevo.');
        this.cdr.detectChanges();
      }
    });
  }

  // ── API SALIDA ────────────────────────────────────────────────────────────

  private callApiSalida(token: string): void {
    this.processing.set(true);
    this.checkoutResult.set(null);
    this.selectedPickupName.set(null);
    this.errorMsg.set(null);

    this.http.post<{ success: boolean; message: string; data: CheckoutResult }>(
      this.checkoutValidateUrl,
      { token, group_alias: this.groupAlias() }
    ).subscribe({
      next: (res) => {
        this.processing.set(false);
        const data = res.data;

        if (res.success || data?.status_color === 'yellow') {
          data.token = token;
          this.checkoutResult.set(data);
          
          if (data.status_color === 'green') {
            this.state.set('ok');
            this.playSuccessSound();
            if (data.is_dynamic && data.authorized_pickups && data.authorized_pickups.length === 1) {
              this.selectedPickupName.set(data.authorized_pickups[0].name);
            }
          } else {
            this.state.set('warning'); // yellow
          }
        } else {
          this.state.set('error');
          this.errorMsg.set(res.message || data?.message || 'Pase inválido');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.processing.set(false);
        this.state.set('error');
        this.errorMsg.set(err?.error?.message ?? err?.error?.data?.message ?? 'Error de red. Intenta de nuevo.');
        this.cdr.detectChanges();
      }
    });
  }

  processCheckout() {
    const coResult = this.checkoutResult();
    if (!coResult || !coResult.token || this.processing()) return;
    if (coResult.status_color !== 'green') return;

    if (coResult.is_dynamic && coResult.authorized_pickups && coResult.authorized_pickups.length > 1) {
      if (!this.selectedPickupName()) {
        Swal.fire('Selección requerida', 'Debes confirmar visualmente qué persona autorizada está recogiendo al menor.', 'warning');
        return;
      }
    }

    this.processing.set(true);
    this.cdr.detectChanges();

    this.http.post<{ success: boolean; message: string }>(
      this.checkoutProcessUrl,
      { token: coResult.token, group_alias: this.groupAlias() }
    ).subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success) {
          this.playSuccessSound();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '¡Primera Salida Registrada!',
            showConfirmButton: false,
            timer: 1500
          });
          this.reset();
        } else {
          this.errorMsg.set(res.message);
          this.state.set('error');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.processing.set(false);
        this.errorMsg.set(err.error?.message || 'Error al procesar.');
        this.state.set('error');
        this.cdr.detectChanges();
      }
    });
  }

  selectPickup(name: string) {
    this.selectedPickupName.set(name);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  paymentLabel(s: string | undefined): string {
    const map: Record<string, string> = {
      paid: 'Pagado', pending: 'Pendiente', partial: 'Parcial', cancelled: 'Cancelado'
    };
    return map[s ?? ''] ?? s ?? '';
  }

  get pageTitle(): string {
    return this.groupAlias() ? `Grupo ${this.groupAlias()}` : 'Escaneo de grupo';
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
