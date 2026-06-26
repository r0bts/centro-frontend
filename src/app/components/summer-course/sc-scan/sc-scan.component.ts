import {
  Component, OnInit, OnDestroy, signal, inject,
  ChangeDetectorRef, NgZone, ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { environment } from '../../../../environments/environment';

interface ScanResult {
  participant: { id: number; first_name: string; last_name: string; photo_url: string | null; age: number | null };
  assigned_level: number | null;
  level_roman: string | null;
  level_age: string | null;
  group_alias: string | null;
  belongs_to_group: boolean;
  has_checkin_today: boolean;
  checkin_registered: boolean;
  checkin_error: string | null;
  warning: string | null;
  payment_status: string;
}

@Component({
  selector: 'app-sc-scan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sc-scan.component.html',
  styleUrl: './sc-scan.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ScScanComponent implements OnInit, OnDestroy {
  private route   = inject(ActivatedRoute);
  private http    = inject(HttpClient);
  private cdr     = inject(ChangeDetectorRef);
  private ngZone  = inject(NgZone);

  private readonly apiUrl = `${environment.apiUrl}/public/sc-scan`.replace('/api/public/', '/api/public/');

  groupAlias   = signal<string>('');
  manualToken  = signal<string>('');

  scanning     = signal(false);
  processing   = signal(false);
  cameraError  = signal<string | null>(null);

  result       = signal<ScanResult | null>(null);
  errorMsg     = signal<string | null>(null);
  lastToken    = signal<string>('');

  /** 'idle' | 'ok' | 'warning' | 'error' | 'already' */
  state        = signal<'idle' | 'ok' | 'warning' | 'error' | 'already'>('idle');

  private html5QrCode: Html5Qrcode | null = null;

  ngOnInit(): void {
    const alias = this.route.snapshot.paramMap.get('groupAlias') ?? '';
    this.groupAlias.set(decodeURIComponent(alias));
    setTimeout(() => this.startCamera(), 300);
  }

  ngOnDestroy(): void {
    this.stopCamera();
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
    this.lastToken.set(token);
    this.callApi(token, false);
  }

  submitManual(): void {
    const t = this.manualToken().trim();
    if (!t) return;
    this.callApi(t, false);
    this.manualToken.set('');
  }

  acceptForce(): void {
    const t = this.lastToken();
    if (!t) return;
    this.callApi(t, true);
  }

  reset(): void {
    this.result.set(null);
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

  // ── API ───────────────────────────────────────────────────────────────────

  private callApi(token: string, force: boolean): void {
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

        if (d.has_checkin_today && !d.checkin_registered) {
          this.state.set('already');
        } else if (!d.belongs_to_group) {
          this.state.set('warning');
        } else if (d.checkin_registered) {
          this.state.set('ok');
          // Auto-reset tras 4 s si check-in fue exitoso en su grupo
          setTimeout(() => this.reset(), 4000);
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
}
