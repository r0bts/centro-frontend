import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BuscarMembresiaResponse,
  BuscarMembresiaRawResponse,
  SocioRaw,
  SocioMembresia,
} from '../models/membresia.model';
import { SyncResponse } from './netsuite-sync.service';

@Injectable({
  providedIn: 'root',
})
export class MembresiaService {
  private readonly BASE = `${environment.apiUrl}/membresias`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/membresias/buscar?q={numero_o_nombre}
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Busca una membresía por número (membership_id), nombre del titular
   * o número de socio (entityid).
   * Mapea la respuesta snake_case de la API a camelCase.
   */
  buscar(q: string): Observable<BuscarMembresiaResponse> {
    const params = new HttpParams().set('q', q.trim());
    return this.http
      .get<BuscarMembresiaRawResponse>(`${this.BASE}/buscar`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            return { success: res.success, message: res.message, data: null };
          }
          const m = res.data.membresia;
          const j = res.data.mensaje;
          return {
            success: res.success,
            message: res.message,
            data: {
              membresia: {
                id:            m.id,
                numeroHumano:  String(m.numero_humano),
                nombreTitular: m.nombre_titular,
                patrimonio:    m.patrimonio,
                estado:        m.estado,
                frecuenciaPago: m.frecuencia_pago,
              },
              mensaje: {
                cumplimiento: j.cumplimiento,
                acuerdo:      j.acuerdo,
                desacuerdo:   j.desacuerdo,
                reglaNombre:  j.regla_nombre,
              },
              socios: res.data.socios.map((s: SocioRaw): SocioMembresia => ({
                id:                      s.id,
                numeroHumano:            s.numero_humano,
                nombreCompleto:          s.nombre_completo,
                edad:                    s.edad,
                parentesco:              s.parentesco,
                condicionAdministrativa: s.condicion_administrativa,
                fotoUrl:                 s.foto_url,
                acceso: {
                  cumple:       s.acceso.cumple,
                  lector:       s.acceso.lector,
                  reglaNombre:  s.acceso.regla_nombre,
                  reglaMensaje: s.acceso.regla_mensaje,
                },
              })),
              invitados: res.data.invitados ? res.data.invitados.map(i => ({
                id: i.id,
                socioId: i.socio_id,
                firstName: i.first_name,
                lastName: i.last_name,
                secondLastName: i.second_last_name,
                email: i.email,
                phone: i.phone,
                birthDate: i.birth_date,
                relationship: i.relationship,
              })) : [],
            },
          };
        })
      );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/membresias/sync
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Fuerza re-sincronización de membresías desde NetSuite.
   * Requiere permiso: configuracion > netsuite_sync > sync_membresias
   */
  sincronizar(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(
      `${this.BASE}/sync`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/socios/refresh/{id}
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Sincroniza UN socio individual desde NetSuite REST Record y lo re-evalúa
   * con el motor de reglas. Sin permiso especial — abierto a cualquier usuario.
   * @param socioId  id interno del socio (PK = NS id)
   */
  sincronizarSocio(socioId: number): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/socios/refresh/${socioId}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
