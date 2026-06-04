/**
 * vehicle.model.ts
 *
 * TypeScript interfaces for the Membresías → Placas Socio module.
 * Mirrors the CakePHP API responses of /api/vehicles/* endpoints.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Vehículo individual (snake_case — tal como llega de la API)
// ─────────────────────────────────────────────────────────────────────────────
export interface VehicleRaw {
  /** vehicles.id — PK */
  id: number;
  /** vehicles.plates — número de placa en mayúsculas */
  plates: string;
  /** vehicles.make — marca (ej. "Toyota") */
  make: string | null;
  /** vehicles.model — modelo (ej. "Corolla") */
  model: string | null;
  /** vehicles.color — color del vehículo */
  color: string | null;
  /** vehicles.is_active — true = activo, false = deshabilitado */
  is_active: boolean;
  /** vehicles.is_in_parking — true = está actualmente en estacionamiento */
  is_in_parking: boolean;
  /** vehicles.access_number — 1 o 2 (solo relevante para socios patrimoniales especiales) */
  access_number: number;
  /** vehicles.created — fecha de registro */
  created: string | null;
  /** vehicles.modified — fecha de última modificación */
  modified: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Datos del socio dentro de la respuesta agrupada
// ─────────────────────────────────────────────────────────────────────────────
export interface SocioConVehiculos {
  /** socios.id — id interno / NS id */
  id: number;
  /** socios.entityid — número legible del socio */
  entityid: string;
  /** first_name + last_name */
  fullname: string;
  /** socios.membership_id — número de membresía */
  membership_id: string | number;
  /** condicion_patrimonial.id */
  patrimonial_condition_id: number | null;
  /** true si patrimonial_condition_id está en [1,2,3,6,10] → 2 accesos */
  is_special: boolean;
  /** Vehículos del socio */
  vehicles: VehicleRaw[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Agrupación por membresía — respuesta de GET /api/vehicles?q=
// ─────────────────────────────────────────────────────────────────────────────
export interface VehiclesByMembresiaRaw {
  /** membresias.membership_id */
  membership_id: string | number;
  /** Lista de integrantes con vehículos */
  socios: {
    socio: Omit<SocioConVehiculos, 'vehicles'>;
    vehicles: VehicleRaw[];
  }[];
}

export interface VehiclesIndexResponse {
  success: boolean;
  message?: string;
  data: VehiclesByMembresiaRaw[];
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Respuesta de GET /api/vehicles/by-socio/{id}
// ─────────────────────────────────────────────────────────────────────────────
export interface VehiclesBySocioResponse {
  success: boolean;
  message?: string;
  data: {
    socio: Omit<SocioConVehiculos, 'vehicles'>;
    vehicles: VehicleRaw[];
    total: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Body del POST /api/vehicles/add
// ─────────────────────────────────────────────────────────────────────────────
export interface VehicleAddPayload {
  /** socios.id del propietario */
  socio_id: number;
  /** Número de placa (se guardará en mayúsculas) */
  plates: string;
  make?: string;
  model?: string;
  color?: string;
  /** 1 o 2 — solo necesario para socios especiales */
  access_number?: number;
  is_in_parking?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Body del POST /api/vehicles/edit
// ─────────────────────────────────────────────────────────────────────────────
export interface VehicleEditPayload {
  /** vehicles.id del registro a editar */
  id: number;
  plates?: string;
  make?: string;
  model?: string;
  color?: string;
  access_number?: number;
  is_in_parking?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Respuesta genérica de add / edit / disable
// ─────────────────────────────────────────────────────────────────────────────
export interface VehicleMutationResponse {
  success: boolean;
  message: string;
  data?: { id: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Modelo camelCase para uso en el componente (después del mapeo en el servicio)
// ─────────────────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: number;
  plates: string;
  make: string | null;
  model: string | null;
  color: string | null;
  isActive: boolean;
  isInParking: boolean;
  accessNumber: number;
  created: string | null;
  modified: string | null;
}

export interface SocioInfo {
  id: number;
  entityid: string;
  fullname: string;
  membershipId: string | number;
  patrimonialConditionId: number | null;
  isSpecial: boolean;
}

export interface MembresiaGroup {
  membershipId: string | number;
  socios: {
    socio: SocioInfo;
    vehicles: Vehicle[];
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulario del modal (add + edit comparten la misma interfaz)
// ─────────────────────────────────────────────────────────────────────────────
export interface VehicleFormData {
  id?: number;           // presente en edit, ausente en add
  socioId?: number;      // presente en add
  socioName?: string;    // display en add
  plates: string;
  make: string;
  model: string;
  color: string;
  accessNumber: number;
  isInParking: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Estados de la UI del componente
// ─────────────────────────────────────────────────────────────────────────────
export type PlacasEstado = 'initial' | 'loading' | 'empty' | 'results';

// ─────────────────────────────────────────────────────────────────────────────
// Respuesta de búsqueda de socios (reutiliza endpoint existente)
// GET /api/deportivo/equipos-torneo/search-socios?q=
// ─────────────────────────────────────────────────────────────────────────────
export interface SocioSearchResult {
  id: number;
  entityid: string;
  membership_id: string | number;
  nombre: string;
}
