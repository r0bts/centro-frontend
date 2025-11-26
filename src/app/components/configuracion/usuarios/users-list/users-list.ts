import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  @Input() users: User[] = [];
  @Output() editUser = new EventEmitter<User>();
  @Output() viewUser = new EventEmitter<User>();
  @Output() syncUsers = new EventEmitter<void>();
  @Output() deleteUser = new EventEmitter<string>();
  @Output() toggleUserStatus = new EventEmitter<string>();

  // DataTables
  private usersDataTable: any;

  constructor() {}

  ngOnInit(): void {
    console.log('✅ UsersListComponent initialized');
  }

  ngAfterViewInit(): void {
    // Inicializar DataTables después de que la vista esté lista
    setTimeout(() => {
      this.initUsersDataTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.usersDataTable) {
      this.usersDataTable.destroy();
    }
  }

  private initUsersDataTable(): void {
    if (this.usersTable && this.users.length > 0) {
      this.usersDataTable = $(this.usersTable.nativeElement).DataTable({
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
        order: [[0, 'asc']], // Ordenar por nombre de usuario
        columnDefs: [
          { orderable: false, targets: [3] }, // Deshabilitar orden en acciones (columna 3)
          { className: 'text-center', targets: [2, 3] } // Centrar Estado y Acciones
        ]
      });
    }
  }

  refreshDataTables(): void {
    if (this.usersDataTable) {
      this.usersDataTable.destroy();
    }
    
    setTimeout(() => {
      this.initUsersDataTable();
    }, 100);
  }

  onSyncUsers(): void {
    this.syncUsers.emit();
  }

  onViewUser(user: User): void {
    this.viewUser.emit(user);
  }

  onEditUser(user: User): void {
    this.editUser.emit(user);
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
        this.deleteUser.emit(userId);
        
        Swal.fire({
          icon: 'success',
          title: 'Usuario eliminado',
          text: `El usuario "${user.username}" ha sido eliminado exitosamente`,
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  onToggleUserStatus(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.toggleUserStatus.emit(userId);
      
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El usuario "${user.username}" ahora está ${!user.isActive ? 'activo' : 'inactivo'}`,
        confirmButtonText: 'Continuar',
        timer: 1500,
        timerProgressBar: true
      });
    }
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
