import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import { RolesPermisosComponent } from './roles-permisos/roles-permisos';
import { UsersListComponent, User } from './usuarios/users-list/users-list';
import { UserFormComponent } from './usuarios/user-form/user-form';
import { ProductsListComponent, Product } from './products-list/products-list';
import { NetsuiteSyncComponent } from './netsuite-sync/netsuite-sync';
import { UserProfileComponent } from './user-profile/user-profile';
import { UserService } from '../../services/user.service';
import { ProductService } from '../../services/product.service';
import { CategoriesListComponent } from './categorias/categories-list/categories-list';
import { CategoryService, Category } from '../../services/category.service';
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
  imports: [CommonModule, FormsModule, ContentMenu, RolesPermisosComponent, UsersListComponent, UserFormComponent, ProductsListComponent, NetsuiteSyncComponent, UserProfileComponent, CategoriesListComponent],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss']
})
export class ConfiguracionComponent implements OnInit {
  @ViewChild(ProductsListComponent) productsListComponent!: ProductsListComponent;
  @ViewChild(UsersListComponent) usersListComponent!: UsersListComponent;
  @ViewChild(CategoriesListComponent) categoriesListComponent!: CategoriesListComponent;
  
  activeSection = 'general';
  
  users: User[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  categoriesLoaded = false; // Flag para saber si ya se cargaron
  
  // Propiedades calculadas para evitar múltiples evaluaciones en el template
  activeProductsCount = 0;
  inactiveProductsCount = 0;
  activeUsersCount = 0;
  inactiveUsersCount = 0;
  
  // Control para mostrar el formulario de usuario (solo edición/visualización)
  showUserForm = false;
  isUserEditMode = false;
  selectedUserForEdit: User | null = null;
  selectedUserDetails: any = null; // Detalles completos del usuario (permisos y productos)
  
  configSections: ConfigSection[] = [
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
    private productService: ProductService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    
    // 🔥 NO cargar datos automáticamente
    // Los datos se cargarán cuando el usuario entre a cada sección
    
    // Detectar la sección desde la URL
    const urlPath = this.router.url;
    if (urlPath.includes('/configuracion/roles')) {
      this.setActiveSection('roles');
    } else if (urlPath.includes('/configuracion/usuarios')) {
      this.setActiveSection('users');
    } else if (urlPath.includes('/configuracion/productos')) {
      this.setActiveSection('products');
    } else if (urlPath.includes('/configuracion/categorias')) {
      this.setActiveSection('categories');
    } else if (urlPath.includes('/configuracion/netsuite')) {
      this.setActiveSection('netsuite');
    } else if (urlPath.includes('/configuracion/general')) {
      this.setActiveSection('general');
    }
  }

  loadUsers(): void {
    // 🔥 Mostrar modal de carga con Swal
    Swal.fire({
      title: 'Cargando usuarios',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Asignar usuarios
        this.users = users;
        
        // Calcular contadores
        this.activeUsersCount = users.filter(u => u.isActive).length;
        this.inactiveUsersCount = users.filter(u => !u.isActive).length;
        
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Refrescar DataTables si ya existe
        if (this.usersListComponent) {
          setTimeout(() => {
            this.usersListComponent.refreshDataTables();
            Swal.close(); // 🔥 Cerrar modal DESPUÉS de que DataTable termine
          }, 200);
        } else {
          Swal.close(); // 🔥 Cerrar modal si no hay componente
        }
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
    // 🔥 Mostrar modal de carga con Swal
    Swal.fire({
      title: 'Cargando productos',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Asignar productos
        this.products = products;
        
        // Calcular contadores
        this.activeProductsCount = products.filter(p => p.isActive).length;
        this.inactiveProductsCount = products.filter(p => !p.isActive).length;
        
        console.log('✅ Productos cargados:', products.length);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Refrescar DataTables si ya existe
        if (this.productsListComponent) {
          setTimeout(() => {
            this.productsListComponent.refreshDataTables();
            Swal.close(); // 🔥 Cerrar modal DESPUÉS de que DataTable termine
          }, 200);
        } else {
          Swal.close(); // 🔥 Cerrar modal si no hay componente
        }
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

  loadCategories(): void {
    console.log('🔄 PADRE - loadCategories llamado');
    
    Swal.fire({
      title: 'Cargando categorías',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.categoryService.getCategories(1, 1000).subscribe({
      next: (response) => {
        console.log('📥 PADRE - Respuesta recibida:', response.data.categories.length, 'categorías');
        
        if (response.success) {
          // Actualizar el array de categorías (esto dispara la re-renderización)
          this.categories = [...response.data.categories]; // Crear nuevo array para forzar detección
          console.log('✅ PADRE - Array actualizado. Nuevo length:', this.categories.length);
        }
        
        // Esperar a que Angular actualice el DOM
        setTimeout(() => {
          console.log('⏰ PADRE - Timeout 100ms - Llamando detectChanges...');
          this.cdr.detectChanges();
          
          // Solo refrescar DataTable si YA estaba cargado (es una actualización)
          if (this.categoriesLoaded && this.categoriesListComponent) {
            setTimeout(() => {
              console.log('⏰ PADRE - Es ACTUALIZACIÓN - Llamando refreshDataTables...');
              this.categoriesListComponent.refreshDataTables();
              Swal.close();
            }, 300);
          } else {
            console.log('✅ PADRE - Es PRIMERA CARGA - ngAfterViewInit manejará el DataTable');
            this.categoriesLoaded = true; // Marcar como cargado
            Swal.close();
          }
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar categorías',
          text: error.message,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  setActiveSection(sectionId: string): void {
    console.log('🔄 Cambiando a sección:', sectionId);
    
    // 🔥 Resetear vista de usuario si está activa
    if (this.showUserForm && sectionId !== 'users') {
      console.log('🧹 Reseteando vista de usuario al cambiar de sección');
      this.showUserForm = false;
      this.isUserEditMode = false;
      this.selectedUserForEdit = null;
      this.selectedUserDetails = null;
    }
    
    this.configSections.forEach(section => {
      section.active = section.id === sectionId;
    });
    this.activeSection = sectionId;
    
    // 🔥 Cargar datos SOLO cuando se entra a cada sección
    if (sectionId === 'users' && this.users.length === 0) {
      console.log('🔄 Cargando usuarios por primera vez...');
      this.loadUsers();
    } else if (sectionId === 'products' && this.products.length === 0) {
      console.log('🔄 Cargando productos por primera vez...');
      this.loadProducts();
    } else if (sectionId === 'categories' && this.categories.length === 0) {
      console.log('🔄 Cargando categorías por primera vez...');
      this.loadCategories();
    }
    // roles se cargan dentro de RolesPermisosComponent (y se resetean con ngOnDestroy)
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
    
    // Cargar datos completos del usuario
    Swal.fire({
      title: 'Cargando datos del usuario',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.userService.getUserById(user.id).subscribe({
      next: (userDetails) => {
        Swal.close();
        this.showUserForm = true;
        this.isUserEditMode = false; // Modo solo lectura
        this.selectedUserForEdit = user;
        this.selectedUserDetails = userDetails; // Guardar detalles completos
        console.log('📋 Detalles completos del usuario cargados:', userDetails);
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar usuario',
          text: error.message || 'No se pudieron cargar los datos del usuario',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onEditUser(user: User): void {
    console.log('✏️ Editar usuario:', user);
    console.log('🔍 Estado ANTES - showUserForm:', this.showUserForm, 'isUserEditMode:', this.isUserEditMode);
    
    // Cargar datos completos del usuario
    Swal.fire({
      title: 'Cargando datos del usuario',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.userService.getUserById(user.id).subscribe({
      next: (userDetails) => {
        Swal.close();
        this.showUserForm = true;
        this.isUserEditMode = true;
        this.selectedUserForEdit = user;
        this.selectedUserDetails = userDetails; // Guardar detalles completos
        console.log('✏️ Detalles completos del usuario cargados para edición:', userDetails);
        console.log('🔍 Estado DESPUÉS - showUserForm:', this.showUserForm, 'isUserEditMode:', this.isUserEditMode);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('✅ detectChanges ejecutado');
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar usuario',
          text: error.message || 'No se pudieron cargar los datos del usuario',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onCancelUserForm(): void {
    console.log('❌ Cancelar formulario de usuario');
    this.showUserForm = false;
    this.isUserEditMode = false;
    this.selectedUserForEdit = null;
    this.selectedUserDetails = null; // Limpiar detalles
  }

  onSaveUser(userData: any): void {
    console.log('💾 Actualizar usuario:', userData);
    
    if (!this.selectedUserForEdit) {
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
    this.userService.updateUser(this.selectedUserForEdit.id, userData).subscribe({
      next: (response) => {
        console.log('✅ Usuario actualizado exitosamente:', response);
        
        this.showUserForm = false;
        this.isUserEditMode = false;
        this.selectedUserForEdit = null;
        this.selectedUserDetails = null;
        
        // Recargar lista de usuarios
        this.loadUsers();
        
        Swal.fire({
          icon: 'success',
          title: 'Usuario actualizado',
          text: response.message || 'El usuario ha sido actualizado exitosamente',
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
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
    console.log('🔄 Iniciando sincronización de productos desde NetSuite...');
    
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
        console.log('✅ Sincronización exitosa:', response);
        
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
        
        // Recargar productos después de sincronizar
        this.loadProducts();
        
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

  onViewProduct(product: Product): void {
    console.log('👁️ Ver detalles del producto:', product);
    
    Swal.fire({
      title: 'Detalles del Producto',
      html: `
        <div class="text-start">
          <p><strong>Código:</strong> ${product.code}</p>
          <p><strong>Nombre:</strong> ${product.name}</p>
          <p><strong>Descripción:</strong> ${product.description}</p>
          <p><strong>Categoría:</strong> ${product.category_name}</p>
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
}