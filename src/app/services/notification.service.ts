import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: number;
  type: 'autorizado' | 'listo_recoger' | 'entregado';
  title: string;
  body: string | null;
  is_read: boolean;
  requisition_id: number;
  created_at: string; // ISO string
}

// ── Servicio ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class NotificationService {

  /** Lista completa (últimas 30) */
  readonly notifications = signal<AppNotification[]>([]);

  /** Cantidad de no leídas — badge de la campana */
  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.is_read).length
  );

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_MS = 30_000; // 30 segundos
  private readonly API = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ── Polling ────────────────────────────────────────────────────────────────

  startPolling(): void {
    if (this.pollingInterval) return; // ya está corriendo

    // Carga inmediata al arrancar
    this.fetchUnreadCount();

    this.pollingInterval = setInterval(() => {
      this.fetchUnreadCount();
    }, this.POLL_MS);
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // ── Carga completa (al abrir el panel) ────────────────────────────────────

  loadAll(): void {
    const headers = this.authHeaders();
    if (!headers) return;

    this.http.get<{ success: boolean; data: AppNotification[]; unread_count: number }>(
      `${this.API}/notifications`,
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.data);
        }
      },
      error: () => { /* silencioso — no romper la UI */ }
    });
  }

  // ── Polling ligero — solo actualiza el badge ──────────────────────────────

  private fetchUnreadCount(): void {
    const headers = this.authHeaders();
    if (!headers) return;

    this.http.get<{ count: number }>(
      `${this.API}/notifications/unread-count`,
      { headers }
    ).subscribe({
      next: (res) => {
        const count = res.count ?? 0;
        // Si el count cambió respecto a lo que tenemos, recargar la lista completa
        if (count !== this.unreadCount()) {
          this.loadAll();
        }
      },
      error: () => { /* silencioso */ }
    });
  }

  // ── Marcar todas como leídas ──────────────────────────────────────────────

  markAllRead(): void {
    const headers = this.authHeaders();
    if (!headers) return;

    this.http.patch<{ success: boolean; updated: number }>(
      `${this.API}/notifications/read-all`,
      {},
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          // Actualizar localmente sin re-fetch
          this.notifications.update(list =>
            list.map(n => ({ ...n, is_read: true }))
          );
        }
      },
      error: () => { /* silencioso */ }
    });
  }

  // ── Helpers UI ────────────────────────────────────────────────────────────

  chipColor(type: AppNotification['type']): string {
    switch (type) {
      case 'autorizado':    return '#3b82f6'; // azul
      case 'listo_recoger': return '#22c55e'; // verde
      case 'entregado':     return '#6b7280'; // gris
    }
  }

  chipIcon(type: AppNotification['type']): string {
    switch (type) {
      case 'autorizado':    return 'bi-check-circle-fill';
      case 'listo_recoger': return 'bi-bag-check-fill';
      case 'entregado':     return 'bi-box-seam-fill';
    }
  }

  chipLabel(type: AppNotification['type']): string {
    switch (type) {
      case 'autorizado':    return 'Autorizado';
      case 'listo_recoger': return 'Listo';
      case 'entregado':     return 'Entregado';
    }
  }

  timeAgo(isoString: string): string {
    const now  = Date.now();
    const then = new Date(isoString).getTime();
    const diff = Math.floor((now - then) / 1000); // segundos

    if (diff < 60)                return 'hace un momento';
    if (diff < 3600)              return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400)             return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 2)         return 'ayer';
    if (diff < 86400 * 7)         return `hace ${Math.floor(diff / 86400)} días`;
    return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private authHeaders(): HttpHeaders | null {
    const token = this.authService.getAccessToken();
    if (!token) return null;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
