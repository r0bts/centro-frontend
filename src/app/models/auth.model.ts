/**
 * Modelos de datos para autenticación y permisos
 * Basado en el response del backend CakePHP 5
 */

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
}

export interface LoginData {
  user: UserInfo;
  roles: RoleInfo[];
  modules: ModuleInfo[];
  permissions: PermissionModule[];
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  number_employee: string;
  location_id: number;
  location_name: string | null;
  department_id: number;
  department_name: string | null;
}

export interface RoleInfo {
  id: number;
  name: string;
  display_name: string;
  description: string;
  assigned_at: string;
  expires_at: string | null;
}

export interface ModuleInfo {
  id: number;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface PermissionModule {
  id: number;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  sort_order: number;
  submodules: { [key: string]: SubmodulePermissions };
}

export interface SubmodulePermissions {
  id: number;
  name: string;
  display_name: string;
  description: string;
  route: string;
  icon: string;
  sort_order: number;
  permissions: { [key: string]: PermissionDetail };
}

export interface PermissionDetail {
  id: number;
  name: string;
  display_name: string;
  description: string;
  granted: boolean;
  source: 'role' | 'user_specific';
  role_name?: string;
  reason?: string;
  expires_at?: string;
}

// Interfaz para el menú
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
  children?: MenuItem[];
  isParent?: boolean;
  isExpanded?: boolean;
}
