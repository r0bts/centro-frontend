import { Component, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
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
export class RolesPermisosComponent implements OnInit, OnDestroy {
  @ViewChild(RolesListComponent) rolesListComponent!: RolesListComponent;

  currentView: 'list' | 'form' = 'list';
  isEditMode = false;
  selectedRoleId: string | null = null;

  constructor(
    private roleService: RoleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('RolesPermisosComponent initialized');
  }
  
  ngOnDestroy(): void {
    // 🔥 Al destruirse el componente, resetear la vista
    console.log('🧹 RolesPermisosComponent destruido - reseteando vista');
    this.resetView();
  }
  
  /**
   * 🔥 Resetear vista al estado inicial
   */
  private resetView(): void {
    this.currentView = 'list';
    this.isEditMode = false;
    this.selectedRoleId = null;
  }

  onCreateRole(): void {
    this.currentView = 'form';
    this.isEditMode = false;
    this.selectedRoleId = null;
  }

  onEditRole(roleId: string): void {
    this.currentView = 'form';
    this.isEditMode = true;
    this.selectedRoleId = roleId;
  }

  onCancelForm(): void {
    this.currentView = 'list';
    this.isEditMode = false;
    this.selectedRoleId = null;
  }

  onSaveRole(roleData: any): void {
    console.log('📥 [ROLES-PERMISOS] onSaveRole() recibido con:', {
      isEditMode: this.isEditMode,
      roleId: this.selectedRoleId,
      permisos: roleData.permissions?.length,
      productos: roleData.products?.length
    });
    
    const request = this.isEditMode 
      ? this.roleService.updateRole(this.selectedRoleId!, roleData)
      : this.roleService.createRole(roleData);

    console.log('🌐 [ROLES-PERMISOS] Llamando al servicio...');
    
    request.subscribe({
      next: (response) => {
        console.log('📨 [ROLES-PERMISOS] Respuesta recibida:', response);
        
        if (response.success) {
          console.log('✅ [ROLES-PERMISOS] Success es true, mostrando Swal...');
          Swal.fire({
            icon: 'success',
            title: this.isEditMode ? 'Rol actualizado' : 'Rol creado',
            text: response.message || 'Operación exitosa',
            confirmButtonText: 'Continuar',
            timer: 2000,
            timerProgressBar: true
          }).then(() => {
            console.log('🔄 [ROLES-PERMISOS] Swal cerrado, cambiando a vista list...');
            this.currentView = 'list';
            this.isEditMode = false;
            this.selectedRoleId = null;
            console.log('✅ [ROLES-PERMISOS] Vista cambiada a:', this.currentView);
            // roles-list se recargará automáticamente cuando se muestre
          });
        } else {
          console.warn('⚠️ [ROLES-PERMISOS] Success es FALSE, no se cambia la vista');
        }
      },
      error: (error) => {
        console.error('❌ [ROLES-PERMISOS] Error en la petición:', error);
        
        let errorTitle = 'Error al guardar';
        let errorMessage = 'No se pudo guardar el rol';
        
        // Manejar errores según el código HTTP
        if (error.status === 403) {
          errorTitle = 'Permiso Denegado';
          errorMessage = error.error?.message || 'No tienes permisos para realizar esta acción';
        } else if (error.status === 400) {
          errorTitle = 'Datos Inválidos';
          errorMessage = error.error?.message || 'Los datos proporcionados no son válidos';
        } else if (error.status === 500) {
          errorTitle = 'Error del Servidor';
          errorMessage = error.error?.error || error.error?.message || 'Error interno del servidor';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
