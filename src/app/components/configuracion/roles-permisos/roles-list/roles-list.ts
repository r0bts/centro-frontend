import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Role, RoleService } from '../../../../services/role.service';

declare var $: any; // Para jQuery/DataTables

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles-list.html',
  styleUrls: ['./roles-list.scss']
})
export class RolesListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rolesTable', { static: false }) rolesTable!: ElementRef;
  @Output() editRole = new EventEmitter<string>(); // Ahora emite solo el ID
  @Output() createRole = new EventEmitter<void>();

  // Datos
  roles: Role[] = [];

  // DataTables
  private rolesDataTable: any;
  
  // Lifecycle management
  private destroy$ = new Subject<void>();
  private isDestroyed = false;

  // 🔥 Estadísticas
  totalRoles: number = 0;
  filteredCount: number = 0;
  activeCount: number = 0;
  inactiveCount: number = 0;
  systemCount: number = 0;

  constructor(
    private roleService: RoleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  ngAfterViewInit(): void {
    // DataTable se inicializará después de cargar datos
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    
    // Limpiar event listeners
    if (this.rolesTable) {
      $(this.rolesTable.nativeElement).off('click', '.edit-btn');
      $(this.rolesTable.nativeElement).off('click', '.delete-btn');
      $(this.rolesTable.nativeElement).off('click', '.toggle-status-btn');
    }
    
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.rolesDataTable) {
      this.rolesDataTable.destroy();
      this.rolesDataTable = null;
    }
  }

  /**
   * 🔥 Cargar roles desde el backend
   */
  loadRoles(): void {
    Swal.fire({
      title: 'Cargando roles',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // 🔥 Cargar TODOS los roles
    const rolesObservable = this.roleService.getRoles();
    
    rolesObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response) => {
        if (this.isDestroyed) {
          return;
        }
        
        if (response.success && response.data) {
          this.roles = response.data.roles;
          
          // 🔥 Actualizar estadísticas
          this.updateStatistics();
          this.cdr.detectChanges();
        }
        
        Swal.close();
        
        // Si DataTable no existe, crear; si existe, actualizar
        if (!this.rolesDataTable) {
          // Usar requestAnimationFrame en lugar de setTimeout para asegurar que el DOM esté listo
          requestAnimationFrame(() => {
            if (!this.isDestroyed) {
              this.initRolesDataTable();
            }
          });
        } else {
          this.refreshDataTables();
        }
      },
      error: (error) => {
        if (this.isDestroyed) return;
        
        console.error('❌ Error al cargar roles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar roles',
          text: error.message || 'No se pudieron cargar los roles',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  private initRolesDataTable(): void {
    if (this.isDestroyed) return;
    
    if (this.rolesTable && this.roles.length > 0) {
      this.rolesDataTable = $(this.rolesTable.nativeElement).DataTable({
        data: this.roles,
        columns: [
          {
            title: 'Rol',
            data: null,
            render: (data: Role) => {
              return `
                <div>
                  <strong>${data.display_name}</strong>
                  ${data.isSystem ? '<span class="badge bg-warning ms-2">Sistema</span>' : ''}
                  <br>
                  <small class="text-muted">${data.description}</small>
                </div>
              `;
            }
          },
          {
            title: 'Usuarios',
            data: null,
            className: 'text-center',
            render: (data: Role) => {
              return `<span class="badge bg-info">${data.userCount || 0}</span>`;
            }
          },
          {
            title: 'Estado',
            data: null,
            className: 'text-center',
            render: (data: Role) => {
              return data.isActive 
                ? '<span class="badge bg-success">Activo</span>' 
                : '<span class="badge bg-danger">Inactivo</span>';
            }
          },
          {
            title: 'Acciones',
            data: null,
            orderable: false,
            className: 'text-center',
            render: (data: Role) => {
              return `
                <button class="btn btn-sm btn-primary edit-btn me-1" data-id="${data.id}" title="Editar rol">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                ${!data.isSystem ? `
                  <button class="btn btn-sm ${data.isActive ? 'btn-warning' : 'btn-success'} toggle-status-btn me-1" 
                          data-id="${data.id}" 
                          title="${data.isActive ? 'Desactivar' : 'Activar'}">
                    <i class="bi bi-${data.isActive ? 'toggle-off' : 'toggle-on'}"></i>
                  </button>
                  <button class="btn btn-sm btn-danger delete-btn" data-id="${data.id}" title="Eliminar rol">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                ` : ''}
              `;
            }
          }
        ],
        language: {
          "decimal": "",
          "emptyTable": "No hay datos disponibles en la tabla",
          "info": "Mostrando _START_ a _END_ de _TOTAL_ entradas",
          "infoEmpty": "Mostrando 0 a 0 de 0 entradas",
          "infoFiltered": "(filtrado de _MAX_ entradas totales)",
          "infoPostFix": "",
          "thousands": ",",
          "lengthMenu": "Mostrar _MENU_ entradas",
          "loadingRecords": "Cargando...",
          "processing": "Procesando...",
          "search": "Buscar:",
          "zeroRecords": "No se encontraron registros coincidentes",
          "paginate": {
            "first": "Primero",
            "last": "Último",
            "next": "Siguiente",
            "previous": "Anterior"
          },
          "aria": {
            "sortAscending": ": activar para ordenar la columna ascendente",
            "sortDescending": ": activar para ordenar la columna descendente"
          }
        },
        responsive: true,
        pageLength: 10,
        order: [[0, 'asc']]
      });
      
      // 🔥 Inicializar filtros
      this.initFilters();
      
      // 🔥 Event delegation para botones (evitar double-click)
      $(this.rolesTable.nativeElement).off('click', '.edit-btn').on('click', '.edit-btn', (e: any) => {
        const roleId = $(e.currentTarget).data('id');
        const role = this.roles.find(r => String(r.id) === String(roleId));
        if (role) {
          this.onEditRole(role);
        }
      });
      
      $(this.rolesTable.nativeElement).off('click', '.toggle-status-btn').on('click', '.toggle-status-btn', (e: any) => {
        const roleId = $(e.currentTarget).data('id');
        const role = this.roles.find(r => String(r.id) === String(roleId));
        if (role) {
          this.onToggleRoleStatus(role);
        }
      });
      
      $(this.rolesTable.nativeElement).off('click', '.delete-btn').on('click', '.delete-btn', (e: any) => {
        const roleId = $(e.currentTarget).data('id');
        const role = this.roles.find(r => String(r.id) === String(roleId));
        if (role) {
          this.onDeleteRole(role);
        }
      });
    }
  }

  refreshDataTables(): void {
    if (this.rolesDataTable) {
      this.rolesDataTable.clear().rows.add(this.roles).draw();
    }
  }

  onCreateRole(): void {
    this.createRole.emit();
  }

  onEditRole(role: Role): void {
    // Emitir solo el ID del rol
    this.editRole.emit(role.id);
  }

  onDeleteRole(role: Role): void {
    if (role.isSystem) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'No se pueden eliminar roles del sistema',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: '¿Eliminar rol?',
      text: `¿Estás seguro de que deseas eliminar el rol "${role.display_name}"? Esta acción eliminará también todos sus permisos asociados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Llamar al backend para eliminar rol
        Swal.fire({
          icon: 'info',
          title: 'Funcionalidad pendiente',
          text: 'La eliminación de roles será implementada próximamente',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onToggleRoleStatus(role: Role): void {
    if (role.isSystem) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'No se puede cambiar el estado de roles del sistema',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // TODO: Llamar al backend para cambiar estado
    Swal.fire({
      icon: 'info',
      title: 'Funcionalidad pendiente',
      text: 'El cambio de estado de roles será implementado próximamente',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * 🔥 Actualizar estadísticas de roles
   */
  private updateStatistics(): void {
    this.totalRoles = this.roles.length;
    this.filteredCount = this.roles.length;
    this.activeCount = this.roles.filter(r => r.isActive).length;
    this.inactiveCount = this.roles.filter(r => !r.isActive).length;
    this.systemCount = this.roles.filter(r => r.isSystem).length;
  }

  /**
   * 🔥 Actualizar contador de roles filtrados
   */
  private updateFilteredCount(): void {
    if (this.rolesDataTable) {
      const info = this.rolesDataTable.page.info();
      this.filteredCount = info.recordsDisplay;
      
      // Forzar detección de cambios para evitar ExpressionChangedAfterItHasBeenCheckedError
      this.cdr.detectChanges();
      
      // Actualizar en el DOM directamente
      $('#filteredCount').text(this.filteredCount);
    }
  }

  /**
   * 🔥 Inicializar filtros de la tabla
   */
  private initFilters(): void {
    if (this.isDestroyed) return;
    
    const self = this;
    
    // 🔍 Búsqueda nativa de DataTables
    $('#searchInput').on('keyup', function(this: HTMLInputElement) {
      if (self.rolesDataTable) {
        self.rolesDataTable.search($(this).val()).draw();
        self.updateFilteredCount();
      }
    });
    
    // 🔥 Filtro personalizado para estado y tipo
    $.fn.dataTable.ext.search.push((settings: any, data: any, dataIndex: number) => {
      if (!self.roles || !self.roles[dataIndex]) return true;
      
      const role = self.roles[dataIndex];
      
      // Filtro de estado
      const selectedStatus = $('#statusFilter').val() as string;
      if (selectedStatus === 'active' && !role.isActive) return false;
      if (selectedStatus === 'inactive' && role.isActive) return false;
      
      // Filtro de tipo
      const selectedType = $('#typeFilter').val() as string;
      if (selectedType === 'system' && !role.isSystem) return false;
      if (selectedType === 'custom' && role.isSystem) return false;
      
      return true;
    });
    
    // 🔄 Eventos de cambio en los filtros
    $('#statusFilter, #typeFilter').on('change', function() {
      if (self.rolesDataTable) {
        self.rolesDataTable.draw();
        self.updateFilteredCount();
      }
    });
    
    // 🧹 Limpiar filtros
    $('#clearFiltersBtn').on('click', function() {
      $('#searchInput').val('');
      $('#statusFilter').val('');
      $('#typeFilter').val('');
      
      if (self.rolesDataTable) {
        self.rolesDataTable.search('').draw();
        self.updateFilteredCount();
      }
    });
  }
}