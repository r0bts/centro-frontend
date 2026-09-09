/**
 * Tipos y modelos del módulo "Lista de invitados con pantalla dividida" (mapa 16).
 * Ver `docs/Events/16-GUEST-LIST-SPLIT-SCREEN.md`.
 */

import { AccessType } from './institutional-event.model';

/** Modo de resolución del scope: automático (padrón) o manual (uno a uno). */
export type GuestScopeMode = 'auto' | 'manual';

/** Estado de un invitado. */
export type GuestStatus = 'draft' | 'invited' | 'confirmed' | 'declined' | 'attended';

/** Tipo de registrant (padrón de no-socios). */
export type PublicRegistrantType = 'public' | 'registration';

/**
 * Regla `{event, subevent, access_type} → mode` que rige cómo se resuelve la
 * lista de invitados en un scope. Ver mapa 16 §5.3.
 */
export interface GuestScope {
  id: number | null;
  event_id: number;
  subevent_id: number | null;
  access_type: AccessType;
  mode: GuestScopeMode;
}

/** Padrón deduplicado de personas no-socias (mapa 16 §5.1). */
export interface EventPublicRegistrant {
  id: number;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  registrant_type: PublicRegistrantType;
  email_verified: boolean;
  source_channel?: string | null;
  notes?: string | null;
  first_seen_at?: string;
  last_seen_at?: string;
}

/** Persona embebida en el listado efectivo. */
export interface GuestPerson {
  id: number;
  entity_id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string;
  kind: 'socio' | 'public_registrant';
}

/** Fila del listado efectivo de invitados (merge auto+manual). */
export interface EffectiveGuest {
  /** Presente solo cuando `source='manual'` — id del registro en BD. */
  guest_id?: number;
  person: GuestPerson;
  access_type: AccessType;
  source: 'auto' | 'manual';
  status: GuestStatus;
}

/** Conteo por access_type que alimenta los contadores del panel derecho. */
export interface GuestCount {
  access_type: AccessType;
  mode: GuestScopeMode;
  auto_count: number;
  manual_count: number;
  total: number;
}

/** Payload de una fila para agregar manualmente. */
export interface AddManualGuestRow {
  socio_id?: number;
  public_registrant_id?: number;
  notes?: string | null;
}

/** Resultado de un socio en la búsqueda del panel izquierdo. */
export interface GuestSocioSearchResult {
  id: number;
  entityid: string;
  first_name: string | null;
  last_name: string | null;
  fullname: string | null;
  email: string | null;
  phone: string | null;
  patrimonial_condition_id: number | null;
}

// ── Respuestas del API ────────────────────────────────────────────────────

export interface GuestScopesResponse {
  success: boolean;
  data: { scopes: GuestScope[] };
}

export interface GuestCountsResponse {
  success: boolean;
  data: {
    counts: GuestCount[];
    grand_total: number;
  };
}

export interface GuestListResponse {
  success: boolean;
  data: {
    guests: EffectiveGuest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface AddManualGuestsResponse {
  success: boolean;
  message: string;
  data: {
    added: EffectiveGuest[];
    skipped: Array<{ reason: string; input?: unknown; errors?: unknown; message?: string }>;
  };
}

export interface GuestSociosSearchResponse {
  success: boolean;
  data: { socios: GuestSocioSearchResult[] };
}

export interface GuestPublicRegistrantsSearchResponse {
  success: boolean;
  data: { registrants: EventPublicRegistrant[] };
}
