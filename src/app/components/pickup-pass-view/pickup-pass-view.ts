import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { QRCodeComponent } from 'angularx-qrcode';

interface PassInfo {
  participant_name: string;
  authorized_name: string;
  expires_at: string;
  token: string;
}

@Component({
  selector: 'app-pickup-pass-view',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './pickup-pass-view.html',
  styleUrls: ['./pickup-pass-view.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PickupPassViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  token: string | null = null;
  passInfo: PassInfo | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.error = 'Token no proporcionado en la URL.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.fetchPassInfo(this.token);
  }

  fetchPassInfo(token: string) {
    this.http.get<{success: boolean, data?: PassInfo, message?: string}>(`${environment.apiUrl}/deportivo/summer-course/pickup-pass-info/${token}`)
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.passInfo = res.data;
          } else {
            this.error = res.message || 'No se pudo cargar la información del pase.';
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al conectar con el servidor. El pase puede no existir o haber expirado.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
