// ── Interfaces del Modelo de Clínicas ──────────────────────────────────────────

export interface ClinicActividad {
  id: number;
  nombre: string;
  icono?: string;
  color?: string;
}

export interface ClinicInstructor {
  id: number;
  nombre?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  specialty?: string;
}

export interface ClinicLocation {
  id: number;
  name: string;
}

export interface ClinicArea {
  id: number;
  name: string;
}

export interface ClinicSubstitutionItem {
  id: number;
  clinic_id: number;
  original_instructor_id?: number;
  substitute_instructor_id?: number;
  original_area_id?: number;
  substitute_area_id?: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  original_instructor?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  substitute_instructor?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  original_area?: {
    id: number;
    name: string;
  };
  substitute_area?: {
    id: number;
    name: string;
  };
  creator?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface ClinicItem {
  id: number;
  activity_id: number;
  instructor_id: number;
  location_id: number;
  area_id: number;
  sale_type_id: number;
  ns_item_id?: number | null;
  name: string;
  description?: string;
  venue_details?: string;
  days_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  start_date: string;
  end_date: string;
  max_capacity: number;
  current_enrolled_count: number;
  price: string | number;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  actividade?: ClinicActividad;
  instructor?: ClinicInstructor;
  location?: ClinicLocation;
  area?: ClinicArea;
  clinic_substitutions?: ClinicSubstitutionItem[];
}

export interface ClinicEnrollmentItem {
  id: number;
  clinic_id: number;
  socio_id?: number | null;
  titular_id?: number | null;
  student_id?: number | null;
  full_name: string;
  member_number?: string | null;
  sale_type_id: number;
  payment_reference: string;
  total_amount: number | string;
  amount_paid?: number | string;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  coupon_code?: string | null;
  payment_method: string;
  ns_sales_order_id?: number | null;
  ns_so_status?: string | null;
  ns_so_sync_error?: string | null;
  qr_token: string;
  enrollment_date: string;
  is_active: boolean;
  created_at?: string;
}

export interface ClinicCouponItem {
  id: number;
  coupon_code: string;
  source_enrollment_id?: number | null;
  source_clinic_id: number;
  target_clinic_id: number;
  socio_id?: number | null;
  student_name: string;
  reason: string;
  allows_overcapacity: boolean | number;
  validity_type: 'specific_dates' | 'full_week' | 'single_session' | 'open';
  status: 'issued' | 'redeemed' | 'expired' | 'cancelled';
  issued_at: string;
  valid_until?: string | null;
  qr_url?: string;
  target_clinic?: ClinicItem;
}
