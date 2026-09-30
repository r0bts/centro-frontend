export interface DocmgmtProcedure {
  id?: number;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_by?: number;
  updated_by?: number;
  deleted_at?: string | null;
  created?: string;
  modified?: string;
  docmgmt_procedure_documents?: DocmgmtDocument[];
  docmgmt_procedure_permissions?: DocmgmtPermission[];
}

export interface DocmgmtDocument {
  id?: number;
  procedure_id: number;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size?: number;
  version_number?: number;
  uploaded_by?: number;
  created?: string;
}

export interface DocmgmtPermission {
  id?: number;
  procedure_id?: number;
  permission_type: 'department' | 'user';
  department_id?: number;
  user_id?: number;
  granted_by?: number;
  created_at?: string;
}
