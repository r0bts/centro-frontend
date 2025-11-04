import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
  createdAt: Date;
}

interface RoleForm {
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
}

interface SelectedPermission {
  submodule_id: number;
  permission_id: number;
  is_granted: boolean;
}

interface Module {
  id: number;
  name: string;
  display_name: string;
  icon?: string;
  route?: string;
  is_active: boolean;
}

interface Submodule {
  id: number;
  module_id: number;
  name: string;
  display_name: string;
  icon?: string;
  route?: string;
  is_active: boolean;
}

interface DbPermission {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.scss']
})
export class RoleFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() selectedRole: Role | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  // Formulario de rol
  roleForm: RoleForm = {
    name: '',
    display_name: '',
    description: '',
    is_default: false,
    is_active: true
  };

  // Permisos seleccionados para el formulario
  selectedPermissions: SelectedPermission[] = [];

  // Estructura real de la base de datos
  modules: Module[] = [
    { id: 1, name: 'dashboard', display_name: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard', is_active: true },
    { id: 3, name: 'almacen', display_name: 'Almacén', icon: 'bi-box-seam', route: '/almacen', is_active: true },
    { id: 4, name: 'configuracion', display_name: 'Configuración', icon: 'bi-gear-fill', route: '/configuracion', is_active: true }
  ];

  submodules: Submodule[] = [
    // Dashboard
    { id: 1, module_id: 1, name: 'dashboard_overview', display_name: 'Vista General', route: '/dashboard', is_active: true },
    
    // Almacén
    { id: 5, module_id: 3, name: 'requisition', display_name: 'Requisiciones', route: '/requisition', is_active: true },
    { id: 6, module_id: 3, name: 'requisition_list', display_name: 'Lista de Requisiciones', route: '/requisition-list', is_active: true },
    { id: 7, module_id: 3, name: 'requisition_confirmation', display_name: 'Confirmación de Requisiciones', route: '/requisition-confirmation', is_active: true },
    
    // Configuración
    { id: 8, module_id: 4, name: 'configuracion_general', display_name: 'Configuración General', route: '/configuracion', is_active: true },
    { id: 9, module_id: 4, name: 'usuarios', display_name: 'Usuarios', route: '/usuarios', is_active: true },
    { id: 10, module_id: 4, name: 'roles_permisos', display_name: 'Roles y Permisos', route: '/roles-permisos', is_active: true },
    { id: 12, module_id: 4, name: 'reportes', display_name: 'Reportes', route: '/reportes', is_active: true },
    { id: 13, module_id: 4, name: 'admin_panel', display_name: 'Panel de Administración', route: '/admin-panel', is_active: true }
  ];

  dbPermissions: DbPermission[] = [
    { id: 1, name: 'create', display_name: 'Crear', description: 'Permite crear nuevos registros' },
    { id: 2, name: 'read', display_name: 'Leer', description: 'Permite visualizar registros' },
    { id: 3, name: 'update', display_name: 'Actualizar', description: 'Permite modificar registros existentes' },
    { id: 4, name: 'delete', display_name: 'Eliminar', description: 'Permite eliminar registros' },
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadRoleData();
  }

  ngOnChanges(): void {
    this.loadRoleData();
  }

  private loadRoleData(): void {
    if (this.selectedRole && this.isEditMode) {
      // Cargar datos del rol existente
      this.roleForm = {
        name: this.selectedRole.name,
        display_name: this.selectedRole.name,
        description: this.selectedRole.description,
        is_default: false,
        is_active: this.selectedRole.isActive
      };
      // Aquí cargarías los permisos del rol desde la BD
    } else {
      // Limpiar formulario para nuevo rol
      this.roleForm = {
        name: '',
        display_name: '',
        description: '',
        is_default: false,
        is_active: true
      };
      this.selectedPermissions = [];
    }
  }

  getSubmodulesByModule(moduleId: number) {
    return this.submodules.filter(sub => sub.module_id === moduleId);
  }

  // Métodos para manejar permisos en el formulario
  hasPermission(submoduleId: number, permissionId: number): boolean {
    return this.selectedPermissions.some(sp => 
      sp.submodule_id === submoduleId && 
      sp.permission_id === permissionId && 
      sp.is_granted
    );
  }

  togglePermission(submoduleId: number, permissionId: number): void {
    const existingIndex = this.selectedPermissions.findIndex(sp => 
      sp.submodule_id === submoduleId && sp.permission_id === permissionId
    );

    if (existingIndex !== -1) {
      this.selectedPermissions[existingIndex].is_granted = !this.selectedPermissions[existingIndex].is_granted;
      if (!this.selectedPermissions[existingIndex].is_granted) {
        this.selectedPermissions.splice(existingIndex, 1);
      }
    } else {
      this.selectedPermissions.push({
        submodule_id: submoduleId,
        permission_id: permissionId,
        is_granted: true
      });
    }
  }

  toggleAllSubmodulePermissions(submoduleId: number): void {
    const submodulePermissions = this.selectedPermissions.filter(sp => sp.submodule_id === submoduleId);
    const allSelected = submodulePermissions.length === this.dbPermissions.length && 
                       submodulePermissions.every(sp => sp.is_granted);

    if (allSelected) {
      this.selectedPermissions = this.selectedPermissions.filter(sp => sp.submodule_id !== submoduleId);
    } else {
      this.dbPermissions.forEach(permission => {
        const existingIndex = this.selectedPermissions.findIndex(sp => 
          sp.submodule_id === submoduleId && sp.permission_id === permission.id
        );
        
        if (existingIndex !== -1) {
          this.selectedPermissions[existingIndex].is_granted = true;
        } else {
          this.selectedPermissions.push({
            submodule_id: submoduleId,
            permission_id: permission.id,
            is_granted: true
          });
        }
      });
    }
  }

  getSelectedPermissionsCount(submoduleId: number): number {
    return this.selectedPermissions.filter(sp => 
      sp.submodule_id === submoduleId && sp.is_granted
    ).length;
  }

  isSubmoduleIndeterminate(submoduleId: number): boolean {
    const selectedCount = this.getSelectedPermissionsCount(submoduleId);
    return selectedCount > 0 && selectedCount < this.dbPermissions.length;
  }

  isSubmoduleAllSelected(submoduleId: number): boolean {
    return this.getSelectedPermissionsCount(submoduleId) === this.dbPermissions.length;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    if (!this.roleForm.name || !this.roleForm.display_name || !this.roleForm.description) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: 'Por favor completa todos los campos obligatorios',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const roleData = {
      ...this.roleForm,
      permissions: this.selectedPermissions.filter(sp => sp.is_granted)
    };

    this.save.emit(roleData);
  }
}