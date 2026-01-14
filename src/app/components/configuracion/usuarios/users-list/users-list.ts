import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

declare var $: any; // Para jQuery/DataTables

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.html',
  styleUrls: ['./users-list.scss']
})
export class UsersListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('usersTable', { static: false }) usersTable!: ElementRef;
  @Output() editUser = new EventEmitter<string>();
  @Output() viewUser = new EventEmitter<string>();
  @Output() syncUsers = new EventEmitter<void>();

  users: User[] = [];
  private usersDataTable: any;
  private destroy$ = new Subject<void>();
  private isDestroyed = false;
  private initTimeout: any = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Vacío - la inicialización se hace en loadUsers()
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
      this.initTimeout = null;
    }
    
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar event listeners antes de destruir DataTable
    if (this.usersTable) {
      $(this.usersTable.nativeElement).off('click', '.view-btn');
      $(this.usersTable.nativeElement).off('click', '.edit-btn');
      $(this.usersTable.nativeElement).off('click', '.delete-btn');
    }
    
    if (this.usersDataTable) {
      this.usersDataTable.destroy();
    }
  }

  loadUsers(): void {
    Swal.fire({
      title: 'Cargando usuarios',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.userService.getAllUsers(1000, 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (users) => {
        if (this.isDestroyed) {
          return;
        }
        
        this.users = users;
        Swal.close();
        
        if (!this.usersDataTable) {
          this.initTimeout = setTimeout(() => {
            this.initTimeout = null;
            this.initUsersDataTable();
          }, 100);
        } else {
          this.refreshDataTables();
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      }
    });
  }

  private initUsersDataTable(): void {
    if (this.isDestroyed) {
      return;
    }
    
    if (this.usersDataTable) {
      this.usersDataTable.destroy();
      this.usersDataTable = null;
    }
    
    if (this.usersTable && this.users.length > 0) {
      this.usersDataTable = $(this.usersTable.nativeElement).DataTable({
        data: this.users,
        columns: [
          {
            data: null,
            render: (data: User) => {
              return `
                <div class="d-flex align-items-center">
                  <div>
                    <strong>${data.username}</strong>
                    <br>
                    <small class="text-muted">${data.firstName} ${data.lastName}</small>
                    <br>
                    <small class="text-muted">No. Empleado: ${data.employeeNumber}</small>
                  </div>
                </div>
              `;
            }
          },
          {
            data: null,
            render: (data: User) => {
              return `<span class="badge bg-info">${data.role}</span>`;
            }
          },
          {
            data: null,
            className: 'text-center',
            render: (data: User) => {
              return data.isActive 
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';
            }
          },
          {
            data: null,
            className: 'text-center',
            orderable: false,
            render: (data: User) => {
              return `
                <button class="btn btn-sm btn-light me-1 view-btn" data-id="${data.id}" title="Ver detalles" style="border: 1px solid #dee2e6;">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-light me-1 edit-btn" data-id="${data.id}" title="Editar" style="border: 1px solid #dee2e6;">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-light delete-btn" data-id="${data.id}" title="Eliminar" style="border: 1px solid #dee2e6;">
                  <i class="bi bi-trash"></i>
                </button>
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
      
      // Limpiar event listeners anteriores antes de agregar nuevos
      $(this.usersTable.nativeElement).off('click', '.view-btn');
      $(this.usersTable.nativeElement).off('click', '.edit-btn');
      $(this.usersTable.nativeElement).off('click', '.delete-btn');
      
      // Event listeners para los botones
      $(this.usersTable.nativeElement).on('click', '.view-btn', (event: any) => {
        event.preventDefault();
        const userId = String($(event.currentTarget).data('id'));
        const user = this.users.find(u => u.id === userId);
        if (user) this.onViewUser(user);
      });
      
      $(this.usersTable.nativeElement).on('click', '.edit-btn', (event: any) => {
        event.preventDefault();
        const userId = String($(event.currentTarget).data('id'));
        const user = this.users.find(u => u.id === userId);
        if (user) this.onEditUser(user);
      });
      
      $(this.usersTable.nativeElement).on('click', '.delete-btn', (event: any) => {
        event.preventDefault();
        const userId = String($(event.currentTarget).data('id'));
        this.onDeleteUser(userId);
      });
    }
  }

  refreshDataTables(): void {
    if (this.usersDataTable) {
      this.usersDataTable.clear().rows.add(this.users).draw();
    }
  }

  onSyncUsers(): void {
    this.syncUsers.emit();
  }

  onViewUser(user: User): void {
    this.viewUser.emit(user.id);
  }

  onEditUser(user: User): void {
    this.editUser.emit(user.id);
  }

  onDeleteUser(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    Swal.fire({
      title: '¿Eliminar usuario?',
      html: `¿Estás seguro de que deseas eliminar al usuario <strong>${user.username}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // TODO: Implementar llamada al backend cuando exista el endpoint
        // this.userService.deleteUser(userId).subscribe({
        //   next: () => {
        //     this.loadUsers();
        //     Swal.fire({
        //       icon: 'success',
        //       title: 'Usuario eliminado',
        //       text: `El usuario "${user.username}" ha sido eliminado exitosamente`,
        //       timer: 2000,
        //       timerProgressBar: true
        //     });
        //   },
        //   error: (error) => {
        //     Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
        //   }
        // });
        
        // Por ahora solo mostrar mensaje
        Swal.fire({
          icon: 'info',
          title: 'Funcionalidad en desarrollo',
          text: 'La eliminación de usuarios se implementará próximamente',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onToggleUserStatus(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    
    // TODO: Implementar llamada al backend cuando exista el endpoint
    // const newStatus = !user.isActive;
    // this.userService.toggleUserStatus(userId).subscribe({
    //   next: () => {
    //     this.loadUsers();
    //     Swal.fire({
    //       icon: 'success',
    //       title: 'Estado actualizado',
    //       text: `El usuario "${user.username}" ahora está ${newStatus ? 'activo' : 'inactivo'}`,
    //       timer: 1500,
    //       timerProgressBar: true
    //     });
    //   },
    //   error: (error) => {
    //     Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    //   }
    // });
    
    // Por ahora solo mostrar mensaje
    Swal.fire({
      icon: 'info',
      title: 'Funcionalidad en desarrollo',
      text: 'El cambio de estado de usuarios se implementará próximamente',
      confirmButtonText: 'Entendido'
    });
  }
}
