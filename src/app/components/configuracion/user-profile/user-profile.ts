import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

declare var $: any;

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  assignedProducts?: AssignedProduct[]; // Productos asignados (opcional)
}

interface AssignedProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  maxQuantity?: number; // Cantidad máxima que puede solicitar
  description?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss']
})
export class UserProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  private productsTable: any;
  // User Profile Data (simulated from API)
  userProfile: UserProfile = {
    id: '1',
    username: 'roberto.garcia',
    email: 'roberto.garcia@centro.com',
    firstName: 'Roberto',
    lastName: 'García',
    employeeNumber: 'EMP-001234',
    role: 'Administrador',
    createdAt: '2024-01-15T08:30:00',
    lastLogin: '2025-11-26T09:15:00',
    isActive: true,
    // Productos asignados al usuario (opcional - viene de la API)
    assignedProducts: [
      {
        id: 'PROD-001',
        code: 'OF-001',
        name: 'Papel Bond Carta',
        category: 'Papelería',
        unit: 'Resma',
        maxQuantity: 10,
        description: 'Papel bond tamaño carta, 75g/m²'
      },
      {
        id: 'PROD-002',
        code: 'OF-045',
        name: 'Bolígrafos Azules',
        category: 'Papelería',
        unit: 'Caja',
        maxQuantity: 5,
        description: 'Caja con 12 bolígrafos de tinta azul'
      },
      {
        id: 'PROD-003',
        code: 'OF-089',
        name: 'Folders Manila',
        category: 'Papelería',
        unit: 'Paquete',
        maxQuantity: 15,
        description: 'Paquete de 50 folders tamaño carta'
      },
      {
        id: 'PROD-004',
        code: 'LIM-012',
        name: 'Desinfectante Multiusos',
        category: 'Limpieza',
        unit: 'Botella',
        maxQuantity: 3,
        description: 'Desinfectante spray 500ml'
      },
      {
        id: 'PROD-005',
        code: 'TEC-023',
        name: 'Mouse Inalámbrico',
        category: 'Tecnología',
        unit: 'Unidad',
        maxQuantity: 1,
        description: 'Mouse óptico inalámbrico 2.4GHz'
      },
      {
        id: 'PROD-006',
        code: 'OF-156',
        name: 'Grapadora Industrial',
        category: 'Papelería',
        unit: 'Unidad',
        maxQuantity: 1,
        description: 'Grapadora metálica de alta capacidad'
      }
    ]
  };

  // Password Form
  passwordForm: PasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor() {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  ngAfterViewInit(): void {
    // Inicializar DataTable después de que la vista esté lista
    if (this.userProfile.assignedProducts && this.userProfile.assignedProducts.length > 0) {
      setTimeout(() => {
        this.initializeProductsDataTable();
      }, 500);
    }
  }

  ngOnDestroy(): void {
    // Destruir DataTable al salir del componente
    if (this.productsTable) {
      this.productsTable.destroy();
    }
  }

  /**
   * Cargar perfil de usuario (simulado desde API)
   */
  loadUserProfile(): void {
    // TODO: Reemplazar con llamada real a la API
    // this.authService.getCurrentUser().subscribe({
    //   next: (profile) => {
    //     this.userProfile = profile;
    //   },
    //   error: (error) => {
    //     console.error('Error al cargar perfil:', error);
    //     Swal.fire({
    //       icon: 'error',
    //       title: 'Error al cargar perfil',
    //       text: error.message,
    //       confirmButtonText: 'Entendido'
    //     });
    //   }
    // });
  }

  /**
   * Inicializar DataTable de productos asignados
   */
  private initializeProductsDataTable(): void {
    if (this.productsTable) {
      this.productsTable.destroy();
    }

    const tableElement = $('#productsTable');
    if (tableElement.length === 0) {
      return;
    }

    try {
      this.productsTable = tableElement.DataTable({
      data: this.userProfile.assignedProducts,
      columns: [
        { 
          data: 'code',
          title: 'Código',
          className: 'text-center'
        },
        { 
          data: 'name',
          title: 'Producto'
        },
        { 
          data: 'category',
          title: 'Categoría',
          className: 'text-center',

        },
        { 
          data: 'unit',
          title: 'Unidad',
          className: 'text-center'
        },
        { 
          data: 'maxQuantity',
          title: 'Cantidad Máxima',
          className: 'text-center',
        },
        { 
          data: 'description',
          title: 'Descripción',
          className: 'text-center'
        }
      ],
      pageLength: 10,
      lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'Todos']],
      language: {
        decimal: '',
        emptyTable: 'No hay datos disponibles en la tabla',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ productos',
        infoEmpty: 'Mostrando 0 a 0 de 0 productos',
        infoFiltered: '(filtrado de _MAX_ productos totales)',
        infoPostFix: '',
        thousands: ',',
        lengthMenu: 'Mostrar _MENU_ productos',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron productos coincidentes',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        },
        aria: {
          sortAscending: ': activar para ordenar la columna de manera ascendente',
          sortDescending: ': activar para ordenar la columna de manera descendente'
        }
      },
      responsive: true,
      order: [[1, 'asc']],
      dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rt<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      drawCallback: () => {
        // Aplicar estilos de Bootstrap después de renderizar
        $('.dataTables_length select').addClass('form-select form-select-sm');
        $('.dataTables_filter input').addClass('form-control form-control-sm');
      }
    });
    } catch (error) {
      console.error('Error al inicializar DataTable:', error);
    }
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  // ==========================================
  // Password Validation Methods
  // ==========================================

  /**
   * Validar si el formulario de contraseña es válido
   */
  isPasswordFormValid(): boolean {
    return (
      this.passwordForm.currentPassword.length > 0 &&
      this.passwordForm.newPassword.length >= 8 &&
      this.passwordForm.confirmPassword.length >= 8 &&
      this.passwordsMatch() &&
      this.hasUpperCase(this.passwordForm.newPassword) &&
      this.hasLowerCase(this.passwordForm.newPassword) &&
      this.hasNumber(this.passwordForm.newPassword)
    );
  }

  /**
   * Verificar si las contraseñas coinciden
   */
  passwordsMatch(): boolean {
    if (!this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      return false;
    }
    return this.passwordForm.newPassword === this.passwordForm.confirmPassword;
  }

  /**
   * Verificar si tiene al menos una mayúscula
   */
  hasUpperCase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  /**
   * Verificar si tiene al menos una minúscula
   */
  hasLowerCase(password: string): boolean {
    return /[a-z]/.test(password);
  }

  /**
   * Verificar si tiene al menos un número
   */
  hasNumber(password: string): boolean {
    return /[0-9]/.test(password);
  }

  // ==========================================
  // Password Management Methods
  // ==========================================

  /**
   * Cambiar contraseña
   */
  onChangePassword(): void {
    if (!this.isPasswordFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos correctamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: '¿Cambiar contraseña?',
      text: '¿Estás seguro de que deseas cambiar tu contraseña?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('🔐 Cambiando contraseña...');
        
        // Mostrar loading
        Swal.fire({
          title: 'Cambiando contraseña',
          text: 'Por favor espera...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Simular llamada a API
        setTimeout(() => {
          // TODO: Implementar llamada real a la API
          // this.authService.changePassword({
          //   currentPassword: this.passwordForm.currentPassword,
          //   newPassword: this.passwordForm.newPassword
          // }).subscribe({
          //   next: (response) => {
          //     this.onPasswordChangeSuccess();
          //   },
          //   error: (error) => {
          //     this.onPasswordChangeError(error);
          //   }
          // });

          // Simular éxito
          this.onPasswordChangeSuccess();
        }, 2000);
      }
    });
  }

  /**
   * Manejar éxito al cambiar contraseña
   */
  private onPasswordChangeSuccess(): void {
    // Limpiar formulario
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Resetear visibilidad de contraseñas
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;

    Swal.fire({
      icon: 'success',
      title: '¡Contraseña cambiada!',
      text: 'Tu contraseña ha sido actualizada exitosamente.',
      confirmButtonText: 'Continuar',
      timer: 3000,
      timerProgressBar: true
    });
  }

  /**
   * Manejar error al cambiar contraseña
   */
  private onPasswordChangeError(error: any): void {
    let errorMessage = 'No se pudo cambiar la contraseña. Intenta de nuevo.';
    
    if (error.message) {
      errorMessage = error.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Error al cambiar contraseña',
      text: errorMessage,
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Cancelar cambio de contraseña
   */
  onCancelPasswordChange(): void {
    if (this.passwordForm.currentPassword || this.passwordForm.newPassword || this.passwordForm.confirmPassword) {
      Swal.fire({
        title: '¿Cancelar cambio de contraseña?',
        text: 'Los datos ingresados se perderán.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando',
        confirmButtonColor: '#6c757d',
        cancelButtonColor: '#007bff'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetPasswordForm();
        }
      });
    } else {
      this.resetPasswordForm();
    }
  }

  /**
   * Resetear formulario de contraseña
   */
  private resetPasswordForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }
}
