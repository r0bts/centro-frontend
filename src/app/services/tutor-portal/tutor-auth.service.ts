import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TutorAuthService {
  private baseUrl = environment.apiUrl;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {}

  requestOtp(phone: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/tutor-portal/request-otp`, { phone });
  }

  verifyOtp(phone: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/tutor-portal/verify-otp`, { phone, code }).pipe(
      tap((res: any) => {
        if (res.success && res.data && res.data.access_token) {
          localStorage.setItem('tutor_token', res.data.access_token);
          localStorage.setItem('tutor_phone', res.data.phone);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('tutor_token');
  }

  getPhone(): string | null {
    return localStorage.getItem('tutor_phone');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.jwtHelper.isTokenExpired(token);
  }

  logout(): void {
    localStorage.removeItem('tutor_token');
    localStorage.removeItem('tutor_phone');
  }
}
