import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorAuthService } from '../../../services/tutor-portal/tutor-auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  phone: string = '';
  code: string = '';
  step: 1 | 2 = 1;
  isLoading = false;

  constructor(
    private authService: TutorAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tutor-portal/dashboard']);
    }
  }

  requestOtp() {
    if (!this.phone || this.phone.length < 10) {
      Swal.fire('Error', 'Ingresa un teléfono válido a 10 dígitos', 'error');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.authService.requestOtp(this.phone).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 2;
        this.cdr.detectChanges();
        Swal.fire('Enviado', 'Se ha enviado un código a tu WhatsApp', 'success');
      },
      error: (err: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', err.error?.message || 'Error al solicitar el código', 'error');
      }
    });
  }

  verifyOtp() {
    if (!this.code || this.code.length < 6) return;
    this.isLoading = true;
    this.cdr.detectChanges();
    this.authService.verifyOtp(this.phone, this.code).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/tutor-portal/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', err.error?.message || 'Código incorrecto', 'error');
      }
    });
  }
}
