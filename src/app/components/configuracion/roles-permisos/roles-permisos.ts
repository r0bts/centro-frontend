import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesListComponent } from './roles-list/roles-list';
import { RoleFormComponent } from './role-form/role-form';
import { RoleService, Role } from '../../../services/role.service';
import Swal from 'sweetalert2';

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
  selectedRoleId: string | null = null;
  roles: Role[] = [];
  isLoading = false;

  constructor(
    private roleService: RoleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('RolesPermisosComponent initialized');
    this.loadRoles();
  }

  /**
   * Cargar roles desde la API
   */
  loadRoles(): void {
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data.roles;
          console.log(`✅ ${response.data.total} roles cargados:`, this.roles);
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          
          // Refrescar DataTables si ya existe
          if (this.rolesListComponent) {
            setTimeout(() => {
              this.rolesListComponent.refreshDataTables();
            }, 100);
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar roles:', error);
        this.isLoading = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar roles',
          text: error.message || 'No se pudieron cargar los roles del sistema',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onCreateRole(): void {
    this.currentView = 'form';
    this.isEditMode = false;
    this.selectedRoleId = null;
  }

  onEditRole(role: Role): void {
    this.currentView = 'form';
    this.isEditMode = true;
    this.selectedRoleId = role.id;
  }

  onDeleteRole(roleId: string): void {
    this.roleService.deleteRole(roleId).subscribe({
      next: (response) => {
        if (response.success) {
          // Recargar lista de roles
          this.loadRoles();
        }
      },
      error: (error) => {
        console.error('❌ Error al eliminar rol:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: error.message || 'No se pudo eliminar el rol',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onToggleRoleStatus(roleId: string): void {
    this.roleService.toggleRoleStatus(roleId).subscribe({
      next: (response) => {
        if (response.success) {
          // Recargar lista de roles
          this.loadRoles();
        }
      },
      error: (error) => {
        console.error('❌ Error al cambiar estado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cambiar estado',
          text: error.message || 'No se pudo cambiar el estado del rol',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onCancelForm(): void {
    this.currentView = 'list';
    this.isEditMode = false;
    this.selectedRoleId = null;
  }

  onSaveRole(roleData: any): void {
    const request = this.isEditMode 
      ? this.roleService.updateRole(this.selectedRoleId!, roleData)
      : this.roleService.createRole(roleData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
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
            this.selectedRoleId = null;
            // Recargar lista de roles
            this.loadRoles();
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al guardar rol:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: error.message || 'No se pudo guardar el rol',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
