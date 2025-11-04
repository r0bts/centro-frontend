import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

declare var $: any; // Para jQuery/DataTables

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
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roles-list.html',
  styleUrls: ['./roles-list.scss']
})
export class RolesListComponent implements OnInit, AfterViewInit {
  @ViewChild('rolesTable', { static: false }) rolesTable!: ElementRef;
  @Input() roles: Role[] = [];
  @Output() editRole = new EventEmitter<Role>();
  @Output() createRole = new EventEmitter<void>();
  @Output() deleteRole = new EventEmitter<string>();
  @Output() toggleRoleStatus = new EventEmitter<string>();

  // DataTables
  private rolesDataTable: any;

  constructor() {}

  ngOnInit(): void {
    console.log('✅ RolesListComponent initialized');
  }

  ngAfterViewInit(): void {
    // Inicializar DataTables después de que la vista esté lista
    setTimeout(() => {
      this.initRolesDataTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.rolesDataTable) {
      this.rolesDataTable.destroy();
    }
  }

  private initRolesDataTable(): void {
    if (this.rolesTable && this.roles.length > 0) {
      this.rolesDataTable = $(this.rolesTable.nativeElement).DataTable({
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
        order: [[0, 'asc']], // Ordenar por nombre (ahora es columna 0)
        columnDefs: [
          { orderable: false, targets: [3] }, // Deshabilitar orden solo en acciones (columna 3)
          { className: 'text-center', targets: [2, 3] } // Centrar Estado y Acciones
        ]
      });
    }
  }

  refreshDataTables(): void {
    if (this.rolesDataTable) {
      this.rolesDataTable.destroy();
    }
    
    setTimeout(() => {
      this.initRolesDataTable();
    }, 100);
  }

  onCreateRole(): void {
    this.createRole.emit();
  }

  onEditRole(role: Role): void {
    this.editRole.emit(role);
  }

  onDeleteRole(roleId: string): void {
    const role = this.roles.find(r => r.id === roleId);
    if (!role) return;

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
      text: `¿Estás seguro de que deseas eliminar el rol "${role.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteRole.emit(roleId);
        
        Swal.fire({
          icon: 'success',
          title: 'Rol eliminado',
          text: `El rol "${role.name}" ha sido eliminado exitosamente`,
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  onToggleRoleStatus(roleId: string): void {
    const role = this.roles.find(r => r.id === roleId);
    if (role && !role.isSystem) {
      this.toggleRoleStatus.emit(roleId);
      
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El rol "${role.name}" ahora está ${!role.isActive ? 'activo' : 'inactivo'}`,
        confirmButtonText: 'Continuar',
        timer: 1500,
        timerProgressBar: true
      });
    }
  }
}