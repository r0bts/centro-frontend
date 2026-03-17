import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const credentials: LoginRequest = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          this.isLoading.set(false);
          
          // 🔥 Redirigir a la primera ruta disponible según permisos del usuario
          const firstRoute = this.getFirstAvailableRoute(response.data);
          console.log('🔄 Intentando navegar a:', firstRoute);
          
          this.router.navigate([firstRoute]).then((navigated) => {
            console.log('✅ Navegación completada:', navigated);
            if (!navigated) {
              console.error('❌ La navegación falló, redirigiendo a /dashboard');
              this.router.navigate(['/dashboard']);
            }
          }).catch((error) => {
            console.error('❌ Error en navegación:', error);
            this.router.navigate(['/dashboard']);
          });
        },
        error: (error) => {
          console.error('Error en login:', error);
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Obtiene la primera ruta disponible según los permisos del usuario
   * Busca en el orden: modules -> submodules -> route
   */
  private getFirstAvailableRoute(loginData: any): string {
    // Si tiene permisos, buscar la primera ruta disponible
    if (loginData.permissions && loginData.permissions.length > 0) {
      for (const module of loginData.permissions) {
        if (module.submodules) {
          // Obtener submódulos y ordenarlos por sort_order
          const submodules = Object.values(module.submodules) as any[];
          submodules.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          
          for (const submodule of submodules) {
            if (submodule.route && submodule.permissions) {
              // Si el submódulo tiene al menos un permiso, devolver su ruta
              const hasPermission = Object.values(submodule.permissions).some((perm: any) => perm.granted);
              if (hasPermission) {
                console.log('🎯 Redirigiendo a primera ruta disponible:', submodule.route);
                return submodule.route;
              }
            }
          }
        }
      }
    }
    
    // Fallback: si no hay permisos específicos, redirigir a dashboard
    console.log('⚠️ Sin permisos específicos, redirigiendo a dashboard');
    return '/dashboard';
  }
}
