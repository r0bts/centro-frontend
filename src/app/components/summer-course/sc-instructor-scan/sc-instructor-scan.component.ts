import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sc-instructor-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sc-instructor-scan.component.html',
  styleUrl: './sc-instructor-scan.component.scss',
})
export class ScInstructorScanComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  state        = signal<'loading' | 'redirecting' | 'not-assigned' | 'error'>('loading');
  groupAlias   = signal<string | null>(null);
  levelRoman   = signal<string | null>(null);
  errorMessage = signal<string>('Token no reconocido.');

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!token) {
      this.errorMessage.set('Token inválido.');
      this.state.set('error');
      return;
    }

    this.http.get<{ success: boolean; message: string; data: { group_alias: string | null; level_roman: string | null; level_number: number | null } }>(
      `${environment.apiUrl}/public/instructor-scan-redirect`,
      { params: { token } }
    ).subscribe({
      next: res => {
        if (!res.success) {
          this.errorMessage.set(res.message || 'Error al resolver el token.');
          this.state.set('error');
          return;
        }
        if (res.data.group_alias) {
          this.groupAlias.set(res.data.group_alias);
          this.levelRoman.set(res.data.level_roman);
          this.state.set('redirecting');
          setTimeout(() => {
            this.router.navigate(['/sc-scan', res.data.group_alias]);
          }, 800);
        } else {
          this.state.set('not-assigned');
        }
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Error de red. Intenta de nuevo.');
        this.state.set('error');
      }
    });
  }
}
