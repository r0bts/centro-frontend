export interface SocioGuest {
    id?: number;
    socio_id: number;
    first_name: string;
    last_name: string;
    second_last_name?: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    rfc?: string;
    relationship: string;
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
}
