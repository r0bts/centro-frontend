import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import { RolesPermisosComponent } from './roles-permisos/roles-permisos';
import { UsersListComponent, User } from './usuarios/users-list/users-list';
import { UserFormComponent } from './usuarios/user-form/user-form';
import { ProductsListComponent, Product } from './products-list/products-list';
import { UserService } from '../../services/user.service';
import { ProductService } from '../../services/product.service';
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
  imports: [CommonModule, FormsModule, ContentMenu, RolesPermisosComponent, UsersListComponent, UserFormComponent, ProductsListComponent],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss']
})
export class ConfiguracionComponent implements OnInit {
  activeSection = 'general';
  users: User[] = [];
  products: Product[] = [];
  
  // Control para mostrar el formulario de usuario (solo edición/visualización)
  showUserForm = false;
  isUserEditMode = false;
  selectedUserForEdit: User | null = null;
  
  configSections: ConfigSection[] = [
    {
      id: 'general',
      title: 'Configuración General',
      icon: 'bi-gear',
      description: 'Configuraciones básicas del sistema',
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
      id: 'netsuite',
      title: 'Sincronización NetSuite',
      icon: 'bi-cloud-arrow-up',
      description: 'Configuración de integración con NetSuite',
      active: false
    }
  ];

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
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    console.log('✅ ConfiguracionComponent initialized');
    
    // Cargar usuarios y productos
    this.loadUsers();
    this.loadProducts();
    
    // Detectar la sección desde la URL
    const urlPath = this.router.url;
    if (urlPath.includes('/configuracion/roles')) {
      this.setActiveSection('roles');
    } else if (urlPath.includes('/configuracion/usuarios')) {
      this.setActiveSection('users');
    } else if (urlPath.includes('/configuracion/productos')) {
      this.setActiveSection('products');
    } else if (urlPath.includes('/configuracion/netsuite')) {
      this.setActiveSection('netsuite');
    } else if (urlPath.includes('/configuracion/general')) {
      this.setActiveSection('general');
    }
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        console.log('✅ Usuarios cargados:', users.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar usuarios',
          text: error.message,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        console.log('✅ Productos cargados:', products.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar productos',
          text: error.message,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  setActiveSection(sectionId: string): void {
    this.configSections.forEach(section => {
      section.active = section.id === sectionId;
    });
    this.activeSection = sectionId;
  }

  getActiveUsersCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  getInactiveUsersCount(): number {
    return this.users.filter(u => !u.isActive).length;
  }

  getActiveProductsCount(): number {
    return this.products.filter(p => p.isActive).length;
  }

  getInactiveProductsCount(): number {
    return this.products.filter(p => !p.isActive).length;
  }

  saveConfiguration(): void {
    console.log('💾 Guardando configuración:', this.systemConfig);
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
        console.log('🔄 Configuración restaurada a valores por defecto');
        
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
    console.log('📤 Configuración exportada');
  }

  // Métodos específicos de configuración general
  testConnection(): void {
    console.log('🔗 Probando conexión...');
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
    console.log('💾 Creando respaldo manual...');
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
    console.log('🔔 Enviando notificación de prueba...');
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
    console.log('📋 Abriendo logs del sistema...');
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
        console.log('🧹 Limpiando caché...');
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
        console.log('🔄 Reiniciando sistema...');
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
    console.log('🔄 Sincronizando usuarios...');
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
      this.loadUsers();
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

  onViewUser(user: User): void {
    console.log('👁️ Ver detalles del usuario:', user);
    Swal.fire({
      title: 'Detalles del Usuario',
      html: `
        <div class="text-start">
          <p><strong>Usuario:</strong> ${user.username}</p>
          <p><strong>Nombre:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>No. Empleado:</strong> ${user.employeeNumber}</p>
          <p><strong>Rol:</strong> ${user.role}</p>
          <p><strong>Estado:</strong> ${user.isActive ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</p>
          <p><strong>Fecha de creación:</strong> ${new Date(user.createdAt).toLocaleDateString('es-ES')}</p>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  }

  onEditUser(user: User): void {
    console.log('✏️ Editar usuario:', user);
    this.showUserForm = true;
    this.isUserEditMode = true;
    this.selectedUserForEdit = user;
  }

  onCancelUserForm(): void {
    console.log('❌ Cancelar formulario de usuario');
    this.showUserForm = false;
    this.isUserEditMode = false;
    this.selectedUserForEdit = null;
  }

  onSaveUser(userData: any): void {
    console.log('💾 Actualizar usuario:', userData);
    
    // Solo actualizar usuario existente (no se permite crear nuevos)
    Swal.fire({
      title: 'Actualizando usuario',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular guardado
    setTimeout(() => {
      // Aquí harías la llamada al backend
      // this.userService.updateUser(this.selectedUserForEdit!.id, userData).subscribe({...})
      
      this.showUserForm = false;
      this.isUserEditMode = false;
      this.selectedUserForEdit = null;
      this.loadUsers();
      
      Swal.fire({
        icon: 'success',
        title: 'Usuario actualizado',
        text: 'El usuario ha sido actualizado exitosamente',
        confirmButtonText: 'Continuar',
        timer: 2000,
        timerProgressBar: true
      });
    }, 1000);
  }

  onDeleteUser(userId: string): void {
    console.log('🗑️ Usuario eliminado:', userId);
    // Eliminar el usuario de la lista local
    this.users = this.users.filter(u => u.id !== userId);
    
    // Aquí se haría la llamada al backend
    // this.userService.deleteUser(userId).subscribe({
    //   next: () => {
    //     this.loadUsers();
    //   },
    //   error: (error) => {
    //     console.error('Error al eliminar usuario:', error);
    //   }
    // });
  }

  onToggleUserStatus(userId: string): void {
    console.log('🔄 Cambiar estado del usuario:', userId);
    // Actualizar el estado localmente
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isActive = !user.isActive;
    }
    
    // Aquí se haría la llamada al backend
    // this.userService.toggleUserStatus(userId).subscribe({
    //   next: () => {
    //     this.loadUsers();
    //   },
    //   error: (error) => {
    //     console.error('Error al cambiar estado:', error);
    //   }
    // });
  }

  // Métodos de gestión de productos
  onSyncProducts(): void {
    console.log('🔄 Sincronizando productos...');
    Swal.fire({
      title: 'Sincronizando productos',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular sincronización
    setTimeout(() => {
      this.loadProducts();
      Swal.fire({
        icon: 'success',
        title: 'Sincronización completa',
        text: 'Los productos han sido sincronizados exitosamente desde NetSuite',
        confirmButtonText: 'Continuar',
        timer: 2000,
        timerProgressBar: true
      });
    }, 2000);
  }

  onViewProduct(product: Product): void {
    console.log('👁️ Ver detalles del producto:', product);
    
    Swal.fire({
      title: 'Detalles del Producto',
      html: `
        <div class="text-start">
          <p><strong>Código:</strong> ${product.code}</p>
          <p><strong>Nombre:</strong> ${product.name}</p>
          <p><strong>Descripción:</strong> ${product.description}</p>
          <p><strong>Categoría:</strong> ${product.category}</p>
          <p><strong>Unidad:</strong> ${product.unit}</p>
          <p><strong>Estado:</strong> ${product.isActive ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</p>
          <p><strong>Fecha de creación:</strong> ${new Date(product.createdAt).toLocaleDateString('es-ES')}</p>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  }

  onEditProduct(product: Product): void {
    console.log('✏️ Editar producto:', product);
    Swal.fire({
      icon: 'info',
      title: 'Editar Producto',
      text: `Funcionalidad de editar producto "${product.name}" en desarrollo`,
      confirmButtonText: 'Entendido'
    });
  }

  onDeleteProduct(productId: string): void {
    console.log('🗑️ Producto eliminado:', productId);
    // Eliminar el producto de la lista local
    this.products = this.products.filter(p => p.id !== productId);
    
    // Aquí se haría la llamada al backend
    // this.productService.deleteProduct(productId).subscribe({
    //   next: () => {
    //     this.loadProducts();
    //   },
    //   error: (error) => {
    //     console.error('Error al eliminar producto:', error);
    //   }
    // });
  }

  onToggleProductStatus(productId: string): void {
    console.log('🔄 Cambiar estado del producto:', productId);
    // Actualizar el estado localmente
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.isActive = !product.isActive;
    }
    
    // Aquí se haría la llamada al backend
    // this.productService.toggleProductStatus(productId).subscribe({
    //   next: () => {
    //     this.loadProducts();
    //   },
    //   error: (error) => {
    //     console.error('Error al cambiar estado:', error);
    //   }
    // });
  }
}