import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { NetsuiteSyncService, SyncResponse } from '../../../services/netsuite-sync.service';

interface SyncStatus {
  type: 'users' | 'products' | 'departments' | 'areas' | 'locations' | 'projects' | 'accounti' | 'accounte' | 'adjustment_reasons' | 'categories' | 'subcategories';
  isLoading: boolean;
  lastSync?: Date;
  recordCount?: number;
  created?: number;
  updated?: number;
  errors?: number;
}

@Component({
  selector: 'app-netsuite-sync',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './netsuite-sync.html',
  styleUrls: ['./netsuite-sync.scss']
})
export class NetsuiteSyncComponent implements OnInit {
  syncStatus: { [key: string]: SyncStatus } = {
    users: {
      type: 'users',
      isLoading: false,
      recordCount: 0
    },
    products: {
      type: 'products',
      isLoading: false,
      recordCount: 0
    },
    departments: {
      type: 'departments',
      isLoading: false,
      recordCount: 0
    },
    areas: {
      type: 'areas',
      isLoading: false,
      recordCount: 0
    },
    locations: {
      type: 'locations',
      isLoading: false,
      recordCount: 0
    },
    projects: {
      type: 'projects',
      isLoading: false,
      recordCount: 0
    },
    accounti: {
      type: 'accounti',
      isLoading: false,
      recordCount: 0
    },
    accounte: {
      type: 'accounte',
      isLoading: false,
      recordCount: 0
    },
    adjustment_reasons: {
      type: 'adjustment_reasons',
      isLoading: false,
      recordCount: 0
    },
    categories: {
      type: 'categories',
      isLoading: false,
      recordCount: 0
    },
    subcategories: {
      type: 'subcategories',
      isLoading: false,
      recordCount: 0
    }
  };

  constructor(private netsuiteSyncService: NetsuiteSyncService) {}

  ngOnInit(): void {
    console.log('✅ NetsuiteSyncComponent initialized');
    console.log('🔗 Conectado a endpoints reales de NetSuite');
  }

  syncUsers(): void {
    this.performSync('users', 'Usuarios', () => this.netsuiteSyncService.syncUsers());
  }

  syncProducts(): void {
    this.performSync('products', 'Productos', () => this.netsuiteSyncService.syncProducts());
  }

  syncDepartments(): void {
    this.performSync('departments', 'Departamentos', () => this.netsuiteSyncService.syncDepartments());
  }

  syncAreas(): void {
    this.performSync('areas', 'Áreas', () => this.netsuiteSyncService.syncAreas());
  }

  syncLocations(): void {
    this.performSync('locations', 'Centros de Costos', () => this.netsuiteSyncService.syncLocations());
  }

  syncProjects(): void {
    this.performSync('projects', 'Eventos Centro Libanés', () => this.netsuiteSyncService.syncProjects());
  }

  syncAccountInternal(): void {
    this.performSync('accounti', 'Cuentas de Inventario', () => this.netsuiteSyncService.syncAccountInternal());
  }

  syncAccountExternal(): void {
    this.performSync('accounte', 'Cuentas de Pagos', () => this.netsuiteSyncService.syncAccountExternal());
  }

  syncAdjustmentReasons(): void {
    this.performSync('adjustment_reasons', 'Razones de Ajuste', () => this.netsuiteSyncService.syncAdjustmentReasons());
  }

  syncCategories(): void {
    this.performSync('categories', 'Categorías', () => this.netsuiteSyncService.syncCategories());
  }

  syncSubcategories(): void {
    this.performSync('subcategories', 'Subcategorías', () => this.netsuiteSyncService.syncSubcategories());
  }

  syncAll(): void {
    console.log('🔄 Iniciando sincronización completa de todos los recursos...');
    
    // Confirmar con el usuario
    Swal.fire({
      title: '¿Sincronizar todos los recursos?',
      html: `
        <div class="text-start">
          <p class="mb-3">Se sincronizarán <strong>todos los recursos</strong> desde NetSuite:</p>
          <ul class="small">
            <li>Usuarios</li>
            <li>Categorías y Subcategorías</li>
            <li>Departamentos y Áreas</li>
            <li>Centros de Costos</li>
            <li>Eventos Centro Libanés</li>
            <li>Cuentas de Inventario y Pagos</li>
            <li>Razones de Ajuste</li>
            <li>Productos</li>
          </ul>
          <p class="mb-0 text-muted small">⏱️ Este proceso puede tomar entre 2-5 minutos</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Marcar todos como cargando
        Object.keys(this.syncStatus).forEach(key => {
          this.syncStatus[key].isLoading = true;
        });

        // Mostrar progreso
        Swal.fire({
          title: 'Sincronización en progreso',
          html: `
            <div class="text-center">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mb-2">Sincronizando todos los recursos desde NetSuite...</p>
              <p class="text-muted small">Por favor espera, esto puede tomar varios minutos</p>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Llamar al servicio
        this.netsuiteSyncService.syncAll().subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta de sincronización completa:', response);

            // Actualizar estados de cada recurso
            Object.keys(this.syncStatus).forEach(key => {
              this.syncStatus[key].isLoading = false;
              this.syncStatus[key].lastSync = new Date();
            });

            // Actualizar contadores si vienen en la respuesta
            if (response.data?.results) {
              const results = response.data.results;
              
              if (results.users?.data) {
                this.syncStatus['users'].recordCount = results.users.data.synced || 0;
                this.syncStatus['users'].created = results.users.data.created || 0;
                this.syncStatus['users'].updated = results.users.data.updated || 0;
              }
              if (results.products?.data) {
                this.syncStatus['products'].recordCount = results.products.data.synced || 0;
              }
              if (results.categories?.data) {
                this.syncStatus['categories'].recordCount = results.categories.data.synced || 0;
              }
              if (results.subcategories?.data) {
                this.syncStatus['subcategories'].recordCount = results.subcategories.data.synced || 0;
              }
              if (results.departments?.data) {
                this.syncStatus['departments'].recordCount = results.departments.data.synced || 0;
              }
              if (results.areas?.data) {
                this.syncStatus['areas'].recordCount = results.areas.data.synced || 0;
              }
              if (results.locations?.data) {
                this.syncStatus['locations'].recordCount = results.locations.data.synced || 0;
              }
              if (results.projects?.data) {
                this.syncStatus['projects'].recordCount = results.projects.data.synced || 0;
              }
              if (results.account_i?.data) {
                this.syncStatus['accounti'].recordCount = results.account_i.data.synced || 0;
              }
              if (results.account_e?.data) {
                this.syncStatus['accounte'].recordCount = results.account_e.data.synced || 0;
              }
              if (results.adjustment_reasons?.data) {
                this.syncStatus['adjustment_reasons'].recordCount = results.adjustment_reasons.data.synced || 0;
              }
            }

            // Mostrar resultado
            const summary = response.data?.summary || {};
            const wasFailed = summary.failed > 0;

            Swal.fire({
              icon: wasFailed ? 'warning' : 'success',
              title: wasFailed ? 'Sincronización completada con errores' : '¡Sincronización completa exitosa!',
              html: `
                <div class="text-start">
                  <p class="mb-3">${response.message || 'Todos los recursos han sido sincronizados'}</p>
                  <table class="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td class="text-muted">Total de recursos:</td>
                        <td class="text-end"><strong>${summary.total_resources || 11}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Sincronizados:</td>
                        <td class="text-end"><strong class="text-success">${summary.synced || 0}</strong></td>
                      </tr>
                      ${summary.failed > 0 ? `
                      <tr>
                        <td class="text-muted">Con errores:</td>
                        <td class="text-end"><strong class="text-danger">${summary.failed}</strong></td>
                      </tr>` : ''}
                      <tr>
                        <td class="text-muted">Duración:</td>
                        <td class="text-end"><strong>${summary.total_duration || 'N/A'}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Fecha y hora:</td>
                        <td class="text-end"><strong>${new Date().toLocaleString('es-ES')}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `,
              confirmButtonText: 'Aceptar',
              width: '500px'
            });
          },
          error: (error: any) => {
            console.error('❌ Error en sincronización completa:', error);
            
            // Marcar todos como no cargando
            Object.keys(this.syncStatus).forEach(key => {
              this.syncStatus[key].isLoading = false;
            });

            let errorMessage = 'Ocurrió un error durante la sincronización completa';
            let errorDetails = '';
            
            if (error.status === 403) {
              errorMessage = error.error?.message || 'No tienes todos los permisos necesarios';
              
              if (error.error?.error?.missing_permissions) {
                const perms = error.error.error.missing_permissions;
                errorDetails = `<strong>Permisos faltantes:</strong><br>• ${perms.join('<br>• ')}`;
              }
            } else if (error.status === 401) {
              errorMessage = 'Tu sesión ha expirado';
              errorDetails = 'Por favor inicia sesión nuevamente';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            Swal.fire({
              icon: 'error',
              title: 'Error en la sincronización',
              html: `
                <div class="text-start">
                  <p class="mb-3">${errorMessage}</p>
                  ${errorDetails ? `<div class="alert alert-light mb-3"><small>${errorDetails}</small></div>` : ''}
                  <table class="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td class="text-muted">Código de error:</td>
                        <td class="text-end"><strong>${error.status || 'Desconocido'}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `,
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  private performSync(type: string, title: string, syncFn: () => any): void {
    console.log(`🔄 Iniciando sincronización de ${title}...`);
    
    // Marcar como cargando
    this.syncStatus[type].isLoading = true;

    // Mostrar mensaje de inicio
    Swal.fire({
      title: `Sincronizando ${title}`,
      html: `Conectando con NetSuite y obteniendo datos...<br><small class="text-muted">Por favor espera</small>`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio real
    syncFn().subscribe({
      next: (response: SyncResponse) => {
        console.log(`✅ Respuesta de sincronización de ${title}:`, response);

        // Actualizar información de sincronización
        this.syncStatus[type].lastSync = new Date();
        this.syncStatus[type].recordCount = response.data.synced;
        this.syncStatus[type].created = response.data.created || 0;
        this.syncStatus[type].updated = response.data.updated || 0;
        this.syncStatus[type].errors = response.data.errors || 0;
        this.syncStatus[type].isLoading = false;

        // Mostrar resultado exitoso
        Swal.fire({
          icon: 'success',
          title: 'Sincronización completada',
          html: `
            <div class="text-start">
              <p class="mb-3">${title} sincronizados correctamente desde NetSuite</p>
              <table class="table table-sm table-borderless">
                <tbody>
                  ${response.data.total_from_netsuite !== undefined ? `
                  <tr>
                    <td class="text-muted">Total en NetSuite:</td>
                    <td class="text-end"><strong>${response.data.total_from_netsuite}</strong></td>
                  </tr>` : ''}
                  ${response.data.total !== undefined ? `
                  <tr>
                    <td class="text-muted">Total en NetSuite:</td>
                    <td class="text-end"><strong>${response.data.total}</strong></td>
                  </tr>` : ''}
                  <tr>
                    <td class="text-muted">Registros sincronizados:</td>
                    <td class="text-end"><strong>${response.data.synced}</strong></td>
                  </tr>
                  ${response.data.created !== undefined ? `
                  <tr>
                    <td class="text-muted">Creados:</td>
                    <td class="text-end"><strong>${response.data.created}</strong></td>
                  </tr>` : ''}
                  ${response.data.updated !== undefined ? `
                  <tr>
                    <td class="text-muted">Actualizados:</td>
                    <td class="text-end"><strong>${response.data.updated}</strong></td>
                  </tr>` : ''}
                  <tr>
                    <td class="text-muted">Errores:</td>
                    <td class="text-end"><strong>${response.data.errors || 0}</strong></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Fecha y hora:</td>
                    <td class="text-end"><strong>${new Date().toLocaleString('es-ES')}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `,
          confirmButtonText: 'Aceptar',
          width: '500px'
        });
      },
      error: (error: any) => {
        console.error(`❌ Error al sincronizar ${title}:`, error);
        
        this.syncStatus[type].isLoading = false;

        // Mensaje de error personalizado
        let errorMessage = 'Ocurrió un error al sincronizar con NetSuite';
        let errorDetails = '';
        
        if (error.status === 0) {
          // Error de CORS o red
          errorMessage = 'Error de conexión con el servidor';
          errorDetails = 'Verifica que el backend esté activo y el CORS configurado correctamente';
        } else if (error.status === 401) {
          errorMessage = 'Tu sesión ha expirado';
          errorDetails = 'Por favor inicia sesión nuevamente';
        } else if (error.status === 403) {
          // Usar el mensaje del backend si existe
          errorMessage = error.error?.message || 'No tienes permisos para realizar esta sincronización';
          
          // Mostrar permisos requeridos si están disponibles
          if (error.error?.error?.required_permissions) {
            const perms = error.error.error.required_permissions;
            errorDetails = `<strong>Permisos requeridos:</strong><br>`;
            perms.forEach((perm: any) => {
              errorDetails += `• ${perm.module} → ${perm.submodule} → ${perm.permission}<br>`;
            });
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error en la sincronización',
          html: `
            <div class="text-start">
              <p class="mb-3">${errorMessage}</p>
              ${errorDetails ? `<div class="alert alert-light mb-3"><small>${errorDetails}</small></div>` : ''}
              <table class="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td class="text-muted">Entidad:</td>
                    <td class="text-end"><strong>${title}</strong></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Código de error:</td>
                    <td class="text-end"><strong>${error.status || 'Desconocido'}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }



  formatDate(date: Date | undefined): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeSinceLastSync(date: Date | undefined): string {
    if (!date) return 'Nunca sincronizado';
    
    const now = new Date();
    const lastSync = new Date(date);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
}
