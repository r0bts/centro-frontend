/**
 * Modelos para Club Deportivo
 * Tabla: clubes
 */

export interface Club {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  logo_url?: string | null;
  color_primario?: string | null;
  color_secundario?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClubResponse {
  success: boolean;
  message: string;
  data: Club;
}

export interface ClubListResponse {
  success: boolean;
  message: string;
  data: {
    clubes: Club[];
    total: number;
  };
}
