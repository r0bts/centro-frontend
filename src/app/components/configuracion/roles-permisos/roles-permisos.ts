import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesListComponent } from './roles-list/roles-list';
import { RoleFormComponent } from './role-form/role-form';
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

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [CommonModule, RolesListComponent, RoleFormComponent],
  templateUrl: './roles-permisos.html',
  styleUrls: ['./roles-permisos.scss']
})
export class RolesPermisosComponent implements OnInit {
  @ViewChild(RolesListComponent) rolesListComponent!: RolesListComponent;

  currentView: 'list' | 'form' = 'list';
  isEditMode = false;
  selectedRole: Role | null = null;

  roles: Role[] = [
    {
      id: '1',
      name: 'Administrador',
      description: 'Acceso total al sistema',
      isActive: true,
      isSystem: true,
      permissions: ['all'],
      userCount: 2,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Supervisor',
      description: 'Supervisor de operaciones',
      isActive: true,
      isSystem: false,
      permissions: ['read', 'update'],
      userCount: 5,
      createdAt: new Date('2024-01-20')
    }
  ];

  constructor() {}

  ngOnInit(): void {
    console.log('RolesPermisosComponent initialized');
  }

  onCreateRole(): void {
    this.currentView = 'form';
    this.isEditMode = false;
    this.selectedRole = null;
  }

  onEditRole(role: Role): void {
    this.currentView = 'form';
    this.isEditMode = true;
    this.selectedRole = role;
  }

  onDeleteRole(roleId: string): void {
    this.roles = this.roles.filter(r => r.id !== roleId);
    if (this.rolesListComponent) {
      this.rolesListComponent.refreshDataTables();
    }
  }

  onToggleRoleStatus(roleId: string): void {
    const role = this.roles.find(r => r.id === roleId);
    if (role && !role.isSystem) {
      role.isActive = !role.isActive;
    }
  }

  onCancelForm(): void {
    this.currentView = 'list';
    this.isEditMode = false;
    this.selectedRole = null;
  }

  onSaveRole(roleData: any): void {
    Swal.fire({
      icon: 'success',
      title: this.isEditMode ? 'Rol actualizado' : 'Rol creado',
      text: 'Operación exitosa',
      confirmButtonText: 'Continuar',
      timer: 2000,
      timerProgressBar: true
    }).then(() => {
      this.currentView = 'list';
      this.isEditMode = false;
      this.selectedRole = null;
      if (this.rolesListComponent) {
        this.rolesListComponent.refreshDataTables();
      }
    });
  }
}
