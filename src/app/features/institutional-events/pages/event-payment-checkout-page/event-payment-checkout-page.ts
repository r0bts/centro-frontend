import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface CheckoutSessionData {
  token: string;
  event_name: string;
  customer_name: string;
  total_amount: number;
  so_ids: number[];
  status: string;
  expires_at: string;
}

@Component({
  selector: 'app-event-payment-checkout-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-payment-checkout-page.html',
  styleUrl: './event-payment-checkout-page.scss'
})
export class EventPaymentCheckoutPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly token = signal<string>('');
  readonly session = signal<CheckoutSessionData | null>(null);
  readonly loading = signal<boolean>(true);
  readonly processingPayment = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly paymentSuccess = signal<boolean>(false);
  readonly authCode = signal<string | null>(null);

  // Formulario de tarjeta
  cardNumber = '';
  cardHolder = '';
  expMonth = '';
  expYear = '';
  cvv = '';
  methodPayment = 'credit'; // 'credit' | 'debit'

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.paramMap.get('token');
    if (!tokenParam) {
      this.errorMsg.set('Token de pago no proporcionado o inválido.');
      this.loading.set(false);
      return;
    }

    this.token.set(tokenParam);
    this.loadSession(tokenParam);
  }

  loadSession(token: string): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.http.get<any>(`${environment.apiUrl}/checkout/session/${token}`).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          this.session.set(res.data);
          this.cardHolder = res.data.customer_name || '';
          if (res.data.status === 'paid') {
            this.paymentSuccess.set(true);
            this.successMsg.set('Esta orden de inscripción ya se encuentra pagada.');
          }
        } else {
          this.errorMsg.set(res.message || 'No se pudo obtener la información de pago.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'El enlace de pago es inválido o ha expirado.';
        this.errorMsg.set(msg);
      }
    });
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = clean;
    input.value = clean;
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 4);
    this.cvv = clean;
    input.value = clean;
  }

  onExpMonthInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let clean = input.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(clean, 10) > 12) clean = '12';
    this.expMonth = clean;
    input.value = clean;
  }

  onExpYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 4);
    this.expYear = clean;
    input.value = clean;
  }

  submitPayment(): void {
    if (!this.cardNumber || this.cardNumber.length < 15) {
      alert('Ingresa un número de tarjeta válido (15 o 16 dígitos).');
      return;
    }
    if (!this.cardHolder.trim()) {
      alert('Ingresa el nombre del titular como aparece en la tarjeta.');
      return;
    }
    if (!this.expMonth || !this.expYear || this.expYear.length !== 4) {
      alert('Ingresa una fecha de expiración válida (MM y AAAA).');
      return;
    }
    if (!this.cvv || this.cvv.length < 3) {
      alert('Ingresa un código de seguridad (CVV) válido.');
      return;
    }

    this.processingPayment.set(true);
    this.errorMsg.set(null);

    const payload = {
      token: this.token(),
      cardNumber: this.cardNumber,
      cardHolder: this.cardHolder.trim().toUpperCase(),
      expirationMonth: this.expMonth.padStart(2, '0'),
      expirationYear: this.expYear,
      securityCode: this.cvv,
      methodPayment: this.methodPayment
    };

    this.http.post<any>(`${environment.apiUrl}/checkout/process`, payload).subscribe({
      next: (res) => {
        this.processingPayment.set(false);
        if (res && res.success) {
          this.paymentSuccess.set(true);
          this.authCode.set(res.data?.authorizationCode || null);
          this.successMsg.set(res.message || '¡Pago procesado con éxito!');
        } else {
          this.errorMsg.set(res.message || 'No se pudo completar el pago con la pasarela.');
        }
      },
      error: (err) => {
        this.processingPayment.set(false);
        const msg = err.error?.message || 'Ocurrió un error al procesar el pago. Por favor intenta nuevamente.';
        this.errorMsg.set(msg);
      }
    });
  }
}
