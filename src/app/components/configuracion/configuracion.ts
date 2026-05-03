import { Component, OnInit, ViewChild, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import { RolesListComponent } from './roles-permisos/roles-list/roles-list';
import { RoleFormComponent } from './roles-permisos/role-form/role-form';
import { UsersListComponent, User } from './usuarios/users-list/users-list';
import { UserFormComponent } from './usuarios/user-form/user-form';
import { ProductsListComponent } from './products-list/products-list';
import { NetsuiteSyncComponent } from './netsuite-sync/netsuite-sync';
import { UserProfileComponent } from './user-profile/user-profile';
import { UserService } from '../../services/user.service';
import { ProductService, Product } from '../../services/product.service';
import { RoleService } from '../../services/role.service';
import { CategoriesListComponent } from './categorias/categories-list/categories-list';
import { CategoryService, Category } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { AreasClubesComponent } from './areas-clubes/areas-clubes';
import { SummerCourseInstructorsComponent } from '../summer-course/instructors/summer-course-instructors';
import { DepartmentLimitsComponent } from './department-limits/department-limits';
import Swal from 'sweetalert2';

interface ConfigSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  active: boolean;
}

interface SystemConfig {
  siteName: string;
  adminEmail: string;
  maxFileSize: number;
  sessionTimeout: number;
  enableNotifications: boolean;
  enableTwoFactor: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupInterval: number;
  themeMode: 'light' | 'dark' | 'auto';
  language: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ContentMenu, RolesListComponent, RoleFormComponent, UsersListComponent, UserFormComponent, ProductsListComponent, NetsuiteSyncComponent, UserProfileComponent, CategoriesListComponent, AreasClubesComponent, SummerCourseInstructorsComponent, DepartmentLimitsComponent],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss']
})
export class ConfiguracionComponent implements OnInit {
  @ViewChild(ProductsListComponent) productsListComponent!: ProductsListComponent;
  @ViewChild(UsersListComponent) usersListComponent!: UsersListComponent;
  @ViewChild(CategoriesListComponent) categoriesListComponent!: CategoriesListComponent;
  @ViewChild(RolesListComponent) rolesListComponent!: RolesListComponent;
  
  activeSection = signal('general');
  
  // Control para mostrar el formulario de usuario
  showUserForm = signal(false);
  isUserEditMode = signal(false);
  selectedUserId = signal<string | null>(null);
  
  // Control para mostrar el formulario de rol
  showRoleForm = signal(false);
  isRoleEditMode = signal(false);
  selectedRoleId = signal<string | null>(null);
  
  configSections = signal<ConfigSection[]>([
    {
      id: 'general',
      title: 'Mi Perfil',
      icon: 'bi-person-circle',
      description: 'Información personal y seguridad',
      active: true
    },
    {
      id: 'users',
      title: 'Gestión de Usuarios',
      icon: 'bi-people',
      description: 'Configuraciones de usuarios y permisos',
      active: false
    },
    {
      id: 'roles',
      title: 'Roles y Permisos',
      icon: 'bi-shield-check',
      description: 'Administración de roles y permisos del sistema',
      active: false
    },
    {
      id: 'products',
      title: 'Productos',
      icon: 'bi-box',
      description: 'Configuración de productos y centros de consumo',
      active: false
    },
    {
      id: 'categories',
      title: 'Categorías',
      icon: 'bi-tags',
      description: 'Gestión de categorías de productos',
      active: false
    },
    {
      id: 'netsuite',
      title: 'Sincronización NetSuite',
      icon: 'bi-cloud-arrow-up',
      description: 'Configuración de integración con NetSuite',
      active: false
    },
    {
      id: 'areas_clubes',
      title: 'Áreas de Clubes',
      icon: 'bi-geo-alt',
      description: 'Asignación de áreas a clubes y planos de lugares',
      active: false
    },
    {
      id: 'instructores',
      title: 'Instructores',
      icon: 'bi-person-badge-fill',
      description: 'Gestión de instructores del Curso de Verano',
      active: false
    },
    {
      id: 'department_limits',
      title: 'Límites de Requisición',
      icon: 'bi-sliders',
      description: 'Límites de productos por departamento o usuario',
      active: false
    }
  ]);

  systemConfig: SystemConfig = {
    siteName: 'Centro de Control',
    adminEmail: 'admin@centro.com',
    maxFileSize: 10,
    sessionTimeout: 30,
    enableNotifications: true,
    enableTwoFactor: false,
    maintenanceMode: false,
    autoBackup: true,
    backupInterval: 24,
    themeMode: 'light',
    language: 'es'
  };

  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  themeModes = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'auto', label: 'Automático' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private roleService: RoleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    
    // 🔥 NO cargar datos automáticamente
    // Los datos se cargarán cuando el usuario entre a cada sección
    
    // Detectar la sección desde la URL
    const urlPath = this.router.url;
    let targetSection: string | null = null;
    
    if (urlPath.includes('/configuracion/roles')) {
      targetSection = 'roles';
    } else if (urlPath.includes('/configuracion/usuarios')) {
      targetSection = 'users';
    } else if (urlPath.includes('/configuracion/productos')) {
      targetSection = 'products';
    } else if (urlPath.includes('/configuracion/categorias')) {
      targetSection = 'categories';
    } else if (urlPath.includes('/configuracion/netsuite')) {
      targetSection = 'netsuite';
    } else if (urlPath.includes('/configuracion/areas_clubes')) {
      targetSection = 'areas_clubes';
    } else if (urlPath.includes('/configuracion/instructores')) {
      targetSection = 'instructores';
    } else if (urlPath.includes('/configuracion/limites-departamento')) {
      targetSection = 'department_limits';
    } else if (urlPath.includes('/configuracion/general')) {
      targetSection = 'general';
    }
    
    // 🔥 Verificar que el usuario tenga acceso a la sección solicitada
    if (targetSection && this.hasAccessToSection(targetSection)) {
      this.setActiveSection(targetSection);
    } else {
      // Si no tiene acceso o no hay sección en URL, seleccionar la primera disponible
      const visibleSections = this.getVisibleSections();
      if (visibleSections.length > 0) {
        this.setActiveSection(visibleSections[0].id);
      }
    }
  }


  setActiveSection(sectionId: string): void {
    // 🔥 Verificar permisos antes de cambiar de sección
    if (!this.hasAccessToSection(sectionId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Acceso denegado',
        text: 'No tienes permisos para acceder a esta sección',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // 🔥 Resetear vista de usuario si está activa
    if (this.showUserForm() && sectionId !== 'users') {
      this.showUserForm.set(false);
      this.isUserEditMode.set(false);
      this.selectedUserId.set(null);
    }
    
    // 🔥 Resetear vista de rol si está activa
    if (this.showRoleForm() && sectionId !== 'roles') {
      this.showRoleForm.set(false);
      this.isRoleEditMode.set(false);
      this.selectedRoleId.set(null);
    }
    
    this.configSections.update(sections =>
      sections.map(s => ({ ...s, active: s.id === sectionId }))
    );
    this.activeSection.set(sectionId);
    
    // 🔥 No cargar datos - los componentes hijos cargan sus propios datos
    // categories, products, users y roles: los componentes hijos cargan sus propios datos
  }

  saveConfiguration(): void {
    // Aquí implementarías la lógica para guardar en el backend
    Swal.fire({
      icon: 'success',
      title: '¡Configuración guardada!',
      text: 'La configuración ha sido guardada exitosamente',
      confirmButtonText: 'Continuar',
      timer: 2000,
      timerProgressBar: true
    });
  }

  /**
   * 🔥 Obtener solo las secciones visibles según los permisos del usuario
   */
  getVisibleSections(): ConfigSection[] {
    return this.configSections().filter(section => this.hasAccessToSection(section.id));
  }

  /**
   * 🔥 Verificar si el usuario tiene acceso a una sección específica
   */
  private hasAccessToSection(sectionId: string): boolean {
    const submodule = this.getSectionSubmodule(sectionId);
    
    // Si no hay submódulo mapeado, denegar acceso por seguridad
    if (!submodule) {
      console.warn(`⚠️ Sección '${sectionId}' no tiene submódulo mapeado`);
      return false;
    }
    
    // Verificar permiso de 'view' como mínimo
    const hasAccess = this.authService.hasPermission(submodule, 'view');
    
    return hasAccess;
  }

  /**
   * 🔥 Mapear ID de sección a nombre de submódulo del backend
   */
  private getSectionSubmodule(sectionId: string): string | null {
    const mapping: { [key: string]: string } = {
      'general': 'configuracion_general',
      'users': 'usuarios',
      'roles': 'roles_permisos',
      'products': 'productos',
      'categories': 'categorias',
      'netsuite': 'netsuite_sync',
      'areas_clubes': 'areas_clubes',
      'instructores': 'instructores',
      'department_limits': 'department_limits'
    };
    
    return mapping[sectionId] || null;
  }

  resetToDefaults(): void {
    Swal.fire({
      title: '¿Restaurar configuración?',
      text: '¿Estás seguro de que deseas restaurar la configuración por defecto?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.systemConfig = {
          siteName: 'Centro de Control',
          adminEmail: 'admin@centro.com',
          maxFileSize: 10,
          sessionTimeout: 30,
          enableNotifications: true,
          enableTwoFactor: false,
          maintenanceMode: false,
          autoBackup: true,
          backupInterval: 24,
          themeMode: 'light',
          language: 'es'
        };
        
        Swal.fire({
          icon: 'success',
          title: '¡Configuración restaurada!',
          text: 'La configuración ha sido restaurada a los valores por defecto',
          confirmButtonText: 'Continuar'
        });
      }
    });
  }

  exportConfiguration(): void {
    const configJson = JSON.stringify(this.systemConfig, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'configuracion-sistema.json';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Métodos específicos de configuración general
  testConnection(): void {
    // Simulación de prueba de conexión
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Conexión exitosa ✅',
        text: 'La conexión se ha establecido correctamente',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true
      });
    }, 1000);
  }

  createBackup(): void {
    // Simulación de creación de backup
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Respaldo creado exitosamente ✅',
        text: 'El respaldo del sistema se ha creado correctamente',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true
      });
    }, 2000);
  }

  testNotifications(): void {
    // Simulación de envío de notificación
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Notificación de prueba enviada ✅',
        text: 'La notificación de prueba se ha enviado correctamente',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true
      });
    }, 500);
  }

  viewLogs(): void {
    // Aquí implementarías la visualización de logs
  }

  clearCache(): void {
    Swal.fire({
      title: '¿Limpiar caché del sistema?',
      text: '¿Estás seguro de que deseas limpiar la caché del sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Caché limpiada exitosamente ✅',
            text: 'La caché del sistema ha sido limpiada correctamente',
            confirmButtonText: 'Continuar',
            timer: 3000,
            timerProgressBar: true
          });
        }, 1000);
      }
    });
  }

  restartSystem(): void {
    Swal.fire({
      title: '¿Reiniciar el sistema?',
      text: '¿Estás seguro de que deseas reiniciar el sistema? Esto afectará a todos los usuarios conectados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'info',
          title: 'Comando de reinicio enviado',
          text: 'El sistema se reiniciará en 2 minutos.',
          confirmButtonText: 'Entendido',
          timer: 5000,
          timerProgressBar: true
        });
      }
    });
  }

  // Métodos de gestión de usuarios
  onSyncUsers(): void {
    Swal.fire({
      title: 'Sincronizando usuarios',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular sincronización
    setTimeout(() => {
      // El componente users-list se recargará automáticamente
      Swal.fire({
        icon: 'success',
        title: 'Sincronización completa',
        text: 'Los usuarios han sido sincronizados exitosamente',
        confirmButtonText: 'Continuar',
        timer: 2000,
        timerProgressBar: true
      });
    }, 2000);
  }

  onViewUser(userId: string): void {
    this.selectedUserId.set(userId);
    this.isUserEditMode.set(false);
    this.showUserForm.set(true);
  }

  onEditUser(userId: string): void {
    this.selectedUserId.set(userId);
    this.isUserEditMode.set(true);
    this.showUserForm.set(true);
  }

  onCancelUserForm(): void {
    this.showUserForm.set(false);
    this.isUserEditMode.set(false);
    this.selectedUserId.set(null);
  }

  onSaveUser(userData: any): void {
    if (!this.selectedUserId()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No hay usuario seleccionado para actualizar',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // Mostrar modal de carga
    Swal.fire({
      title: 'Actualizando usuario',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al backend para actualizar usuario
    this.userService.updateUser(this.selectedUserId()!, userData).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario actualizado',
          text: response.message || 'El usuario ha sido actualizado exitosamente',
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        }).then(() => {
          this.showUserForm.set(false);
          this.isUserEditMode.set(false);
          this.selectedUserId.set(null);
          
          // 🔥 Recargar listado de usuarios
          if (this.usersListComponent) {
            this.usersListComponent.loadUsers();
          }
        });
      },
      error: (error) => {
        console.error('❌ Error al actualizar usuario:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: error.message || 'No se pudo actualizar el usuario. Por favor intenta de nuevo.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  // Métodos de gestión de roles
  onCreateRole(): void {
    this.selectedRoleId.set(null);
    this.isRoleEditMode.set(false);
    this.showRoleForm.set(true);
  }

  onEditRole(roleId: string): void {
    this.selectedRoleId.set(roleId);
    this.isRoleEditMode.set(true);
    this.showRoleForm.set(true);
  }

  onCancelRoleForm(): void {
    this.showRoleForm.set(false);
    this.isRoleEditMode.set(false);
    this.selectedRoleId.set(null);
  }

  onSaveRole(roleData: any): void {
    Swal.fire({
      title: this.isRoleEditMode() ? 'Actualizando rol' : 'Creando rol',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const saveObservable = this.isRoleEditMode() && this.selectedRoleId()
      ? this.roleService.updateRole(this.selectedRoleId()!, roleData)
      : this.roleService.createRole(roleData);

    saveObservable.subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: this.isRoleEditMode() ? 'Rol actualizado' : 'Rol creado',
          text: response.message || 'El rol ha sido guardado exitosamente',
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        }).then(() => {
          this.showRoleForm.set(false);
          this.isRoleEditMode.set(false);
          this.selectedRoleId.set(null);
          
          // Recargar la lista de roles
          if (this.rolesListComponent) {
            this.rolesListComponent.loadRoles();
          }
        });
      },
      error: (error) => {
        console.error('❌ Error al guardar rol - Status:', error.status);
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje del servidor:', error.error?.message);
        console.error('❌ Body de error:', JSON.stringify(error.error, null, 2));
        
        let errorMessage = 'No se pudo guardar el rol. Por favor intenta de nuevo.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: errorMessage,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }



  // Métodos de gestión de productos
  onSyncProducts(): void {
    Swal.fire({
      title: 'Sincronizando productos',
      html: 'Conectando con NetSuite y obteniendo productos...<br><small>Esto puede tomar varios minutos</small>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.productService.syncProducts().subscribe({
      next: (response) => {
        const stats = response.data;
        const htmlMessage = `
          <div class="text-start">
            <p><strong>Total desde NetSuite:</strong> ${stats.total_from_netsuite || 0}</p>
            <p><strong>Productos nuevos:</strong> ${stats.created || 0}</p>
            <p><strong>Productos actualizados:</strong> ${stats.updated || 0}</p>
            <p><strong>Sincronizados exitosamente:</strong> ${stats.synced || 0}</p>
            ${stats.errors > 0 ? `<p class="text-danger"><strong>Errores:</strong> ${stats.errors}</p>` : ''}
          </div>
        `;
        
        // El componente products-list se recarga automáticamente después del sync
        
        Swal.fire({
          icon: 'success',
          title: 'Sincronización completa',
          html: htmlMessage,
          confirmButtonText: 'Entendido',
          width: '500px'
        });
      },
      error: (error) => {
        console.error('❌ Error en sincronización:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al sincronizar',
          text: error.message || 'No se pudieron sincronizar los productos desde NetSuite',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

}