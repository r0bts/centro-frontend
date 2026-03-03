import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';
import { 
  RequisitionService, 
  RequisitionUser, 
  CreateRequisitionPayload,
  RequisitionItemPayload 
} from '../../services/requisition.service';
import { AuthService } from '../../services/auth.service';
import { FrequentTemplatesService } from '../../services/frequent-templates.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface RequisitionSummary {
  area: string;
  areaId?: string; // ID del área para enviar al backend
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  actions: string;
}

export interface ConsolidatedProduct {
  name: string;
  totalQuantity: number;
  unit: string;
  details: ProductDetail[];
}

export interface ProductDetail {
  area: string;
  quantity: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
}

@Component({
  selector: 'app-requisition-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './requisition-confirmation.html',
  styleUrls: ['./requisition-confirmation.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequisitionConfirmationComponent implements OnInit, OnDestroy {
  private requisitionService = inject(RequisitionService);
  private authService = inject(AuthService);
  private frequentTemplatesService = inject(FrequentTemplatesService);
  private cdr = inject(ChangeDetectorRef);
  
  // Subjects para debounce y limpieza de suscripciones
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Conteos cacheados: evitan ejecutar métodos en cada ciclo de detección de cambios
  totalAreasCount: number = 0;
  totalProductsCount: number = 0;

  activeSection: string = 'requisicion';
  
  // Datos de la requisición recibidos del componente anterior
  requisitionData: RequisitionSummary[] = [];
  deliveryDate: Date | null = null;
  
  // Productos consolidados
  consolidatedProducts: ConsolidatedProduct[] = [];

  // Variables para el select de empleados - ahora se cargan desde el backend
  employees: Employee[] = [];
  isLoadingEmployees: boolean = false;
  
  filteredEmployees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  employeeSearchTerm: string = '';
  showEmployeeDropdown: boolean = false;
  
  // Propiedades para manejo de parámetros
  requisitionId: string = '';
  viewMode: 'view' | 'edit' = 'view';
  isFromList: boolean = false;
  
  // Propiedad para devolución
  isDevolucion: boolean = false;
  
  // Propiedad para almacenar el evento seleccionado
  selectedEventId: string = '';
  
  // Propiedad para unidad de negocio
  businessUnit: string = '';
  
  // Propiedades adicionales para crear la requisición
  selectedDepartmentId?: number;
  selectedLocationId?: number;
  selectedProjectId?: number;
  
  // Status de la requisición para controlar botones
  requisitionStatus: string = '';

  // PIN de la requisición para recoger
  requisitionPin: string = '';

  constructor(private router: Router, private route: ActivatedRoute) {
    // Obtener datos del estado de navegación (para flujo normal y desde listado)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.requisitionData = navigation.extras.state['requisitionData'] || [];
      this.deliveryDate = navigation.extras.state['deliveryDate'] || null;
      this.isDevolucion = navigation.extras.state['isDevolucion'] || false;
      this.selectedEventId = navigation.extras.state['selectedEventId'] || '';
      this.businessUnit = navigation.extras.state['businessUnit'] || '';
      this.selectedDepartmentId = navigation.extras.state['selectedDepartmentId'];
      this.selectedLocationId = navigation.extras.state['selectedLocationId'];
      this.selectedProjectId = navigation.extras.state['selectedProjectId'];
    }
  }

  ngOnInit(): void {
    // Configurar debounce de 300ms para búsqueda de empleados
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(term => this._filterEmployees(term));

    // Verificar si vienen parámetros de query (desde la lista)
    this.route.queryParams.subscribe(params => {
      if (params['id'] && params['mode']) {
        this.requisitionId = params['id'];
        this.viewMode = params['mode'];
        this.isFromList = true; // Marca que viene desde la lista
        
        // Cuando viene del listado, NO cargar empleados desde getFormData()
        // Los datos ya vienen en getRequisitionById()
        this.loadRequisitionData(this.requisitionId);
      } else {
        // Si no hay datos ni parámetros, redirigir de vuelta
        if (this.requisitionData.length === 0) {
          this.router.navigate(['/requisicion']);
          return;
        }
        this.isFromList = false; // Viene del flujo normal
        
        // Solo cargar empleados cuando viene del formulario (flujo normal)
        this.loadEmployees();
        this.consolidateProducts();
      }
    });
  }

  loadEmployees(): void {
    this.isLoadingEmployees = true;
    
    Swal.fire({
      title: 'Cargando empleados...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.requisitionService.getFormData().subscribe({
      next: (response) => {
        // Mapear RequisitionUser[] a Employee[]
        this.employees = response.data.users.map((user: RequisitionUser) => ({
          id: user.id,
          name: user.full_name,
          position: `#${user.employee_number}` // Mostrar número de empleado
        }));
        
        // Auto-seleccionar usuario logueado como empleado responsable
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const loggedUserEmployee = this.employees.find(
            emp => emp.id === currentUser.id.toString()
          );
          
          if (loggedUserEmployee) {
            this.selectedEmployee = loggedUserEmployee;
            this.employeeSearchTerm = loggedUserEmployee.name;
          }
        }
        
        this.isLoadingEmployees = false;
        this.cdr.markForCheck();
        Swal.close();
      },
      error: (error) => {
        this.isLoadingEmployees = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los empleados. Por favor, recarga la página.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  loadRequisitionData(requisitionId: string): void {
    // Mostrar loading
    Swal.fire({
      title: 'Cargando requisición...',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Cargar datos desde el API
    this.requisitionService.getRequisitionById(requisitionId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const data = response.data;
          
          // Mapear datos principales
          this.deliveryDate = data.deliveryDateTime ? new Date(data.deliveryDateTime) : null;
          this.isDevolucion = data.awaitingReturn;
          this.businessUnit = data.businessUnit || '';
          this.selectedLocationId = data.locationId;
          this.selectedDepartmentId = data.departmentId;
          this.selectedProjectId = data.projectId;
          this.requisitionStatus = data.status || '';
          
          // Capturar PIN de la requisición
          this.requisitionPin = data.pin || '';
          
          // Mapear empleado responsable (persona que recoge)
          if (data.pickupPersonId && data.pickupPerson) {
            this.selectedEmployee = {
              id: data.pickupPersonId.toString(),
              name: data.pickupPerson,
              position: '' // Se llenará al cargar empleados
            };
            this.employeeSearchTerm = data.pickupPerson;
          }
          
          // Agrupar items por área
          const areaMap = new Map<string, RequisitionSummary>();
          
          data.items.forEach((item: any) => {
            const areaKey = item.areaName || 'Sin área';
            
            if (!areaMap.has(areaKey)) {
              areaMap.set(areaKey, {
                area: areaKey,
                areaId: item.areaId?.toString(),
                products: []
              });
            }
            
            const area = areaMap.get(areaKey)!;
            area.products.push({
              id: item.productId.toString(),
              name: item.productName || 'Producto sin nombre',
              quantity: item.requestedQuantity,
              unit: item.unit || '',
              actions: ''
            });
          });
          
          // Convertir map a array
          this.requisitionData = Array.from(areaMap.values());
          
          this.consolidateProducts();
          this.cdr.markForCheck();
          Swal.close();
        }
      },
      error: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo cargar la requisición',
          confirmButtonText: 'Volver'
        }).then(() => {
          this.router.navigate(['/requisicion/lista']);
        });
      }
    });
  }

  consolidateProducts(): void {
    const productMap = new Map<string, ConsolidatedProduct>();

    // Iterar por cada área y sus productos
    this.requisitionData.forEach(summary => {
      summary.products.forEach(product => {
        const key = `${product.name}-${product.unit}`;
        
        if (productMap.has(key)) {
          // Si el producto ya existe, agregar la cantidad y el detalle del área
          const existingProduct = productMap.get(key)!;
          existingProduct.totalQuantity += Number(product.quantity) || 0;
          existingProduct.details.push({
            area: summary.area,
            quantity: Number(product.quantity) || 0
          });
        } else {
          // Si es un producto nuevo, crearlo
          productMap.set(key, {
            name: product.name,
            totalQuantity: Number(product.quantity) || 0,
            unit: product.unit,
            details: [{
              area: summary.area,
              quantity: Number(product.quantity) || 0
            }]
          });
        }
      });
    });

    // Convertir el map a array y ordenar alfabéticamente
    this.consolidatedProducts = Array.from(productMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Actualizar conteos cacheados una sola vez al final
    this.totalAreasCount = this.requisitionData.length;
    this.totalProductsCount = this.consolidatedProducts.length;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateWithTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  // --- TrackBy functions: evitan destruir y recrear nodos DOM en cada *ngFor ---
  trackByProductName(_index: number, product: ConsolidatedProduct): string {
    return product.name + '-' + product.unit;
  }

  trackBySummaryArea(_index: number, summary: RequisitionSummary): string {
    return summary.area;
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }

  trackByEmployeeId(_index: number, employee: Employee): string {
    return employee.id;
  }

  trackByDetail(_index: number, detail: ProductDetail): string {
    return detail.area;
  }
  // ---------------------------------------------------------------------------

  goBack(): void {
    // Si vino desde la lista, regresar a la lista
    if (this.requisitionId) {
      this.router.navigate(['/requisicion/lista']);
    } else {
      // Si vino del flujo normal de creación, navegar de vuelta con todos los datos
      this.router.navigate(['/requisicion'], {
        state: {
          loadExistingData: true,
          requisitionSummary: this.requisitionData,
          deliveryDate: this.deliveryDate,
          selectedEmployee: this.selectedEmployee,
          isDevolucion: this.isDevolucion,
          selectedEventId: this.selectedEventId, // Pasar el evento seleccionado original
          businessUnit: this.businessUnit // Pasar la unidad de negocio
        }
      });
    }
  }

  // Métodos para el manejo de empleados
  onEmployeeSearch(): void {
    this.showEmployeeDropdown = true;
    this.searchSubject.next(this.employeeSearchTerm);
  }

  private _filterEmployees(term: string): void {
    if (term.trim()) {
      this.filteredEmployees = this.employees
        .filter(e =>
          e.name.toLowerCase().includes(term.toLowerCase()) ||
          e.position.toLowerCase().includes(term.toLowerCase())
        )
        .slice(0, 20);
    } else {
      this.filteredEmployees = this.employees.slice(0, 20);
    }
    this.cdr.markForCheck();
  }

  onEmployeeFocus(): void {
    this.filteredEmployees = this.employees.slice(0, 20);
    this.showEmployeeDropdown = true;
    this.cdr.markForCheck();
  }

  onEmployeeBlur(): void {
    setTimeout(() => {
      this.showEmployeeDropdown = false;
      this.cdr.markForCheck();
    }, 200);
  }

  selectEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.employeeSearchTerm = employee.name;
    this.showEmployeeDropdown = false;
    this.cdr.markForCheck();
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.employeeSearchTerm = '';
    this.cdr.markForCheck();
  }

  confirmFinalRequisition(): void {
    // Validar que se haya seleccionado un empleado
    if (!this.selectedEmployee) {
      Swal.fire({
        icon: 'warning',
        title: 'Empleado requerido',
        text: 'Por favor selecciona un empleado responsable antes de confirmar la requisición.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Construir el payload para enviar al backend
    const items: RequisitionItemPayload[] = [];
    
    // Iterar por cada área y sus productos
    this.requisitionData.forEach(summary => {
      summary.products.forEach(product => {
        const productId = parseInt(product.id);
        const areaId = summary.areaId ? parseInt(summary.areaId) : undefined;
        
        if (isNaN(productId)) {
          return;
        }
        
        items.push({
          product_id: productId,
          requested_quantity: product.quantity,
          area_id: areaId || 1, // Usar 1 como default si no hay área
          unit: product.unit
        });
      });
    });

    // Validar que haya fecha de entrega
    if (!this.deliveryDate) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Falta la fecha de entrega. Por favor regresa y selecciona una fecha.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar que se haya seleccionado una locación (OBLIGATORIO)
    if (!this.selectedLocationId) {
      Swal.fire({
        icon: 'error',
        title: 'Locación requerida',
        text: 'Por favor regresa y selecciona una locación (GLACIAR o HERMES).',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Formatear delivery_date a YYYY-MM-DD
    const deliveryDateStr = this.deliveryDate.toISOString().split('T')[0];
    
    // Formatear delivery_time a HH:MM:SS (con segundos en 00)
    const hours = this.deliveryDate.getHours().toString().padStart(2, '0');
    const minutes = this.deliveryDate.getMinutes().toString().padStart(2, '0');
    const deliveryTimeStr = `${hours}:${minutes}:00`; // ⭐ Segundos siempre en 00

    // Obtener el ID del usuario logueado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: 'No se pudo obtener el usuario logueado. Por favor, inicia sesión nuevamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const payload: CreateRequisitionPayload = {
      requester_id: currentUser.id, // ⭐ ID del usuario logueado (quien crea)
      pickup_user_id: parseInt(this.selectedEmployee.id), // ⭐ ID del empleado que recogerá
      delivery_date: deliveryDateStr, // ⭐ CAMPO OBLIGATORIO (YYYY-MM-DD)
      delivery_time: deliveryTimeStr, // ⭐ CAMPO OBLIGATORIO (HH:MM:SS)
      location_id: this.selectedLocationId, // ⭐ CAMPO OBLIGATORIO (1=HERMES, 9=GLACIAR)
      awaiting_return: this.isDevolucion,
      items: items
    };

    // Solo agregar campos opcionales si tienen valor
    if (this.selectedDepartmentId) {
      payload.department_id = this.selectedDepartmentId;
    }
    if (this.selectedProjectId) {
      payload.project_id = this.selectedProjectId;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Enviando requisición...',
      text: 'Por favor espera mientras se procesa tu solicitud',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Enviar la requisición al backend
    this.requisitionService.createRequisition(payload).subscribe({
      next: (response) => {
        // Determinar el mensaje según si fue auto-autorizada o no
        const wasAutoAuthorized = response.data.auto_authorized === true;
        const statusBadgeClass = response.data.status === 'autorizado' ? 'bg-success' : 'bg-warning';
        const statusText = response.data.status === 'autorizado' ? 'Autorizado' : 'Solicitado';
        
        let htmlContent = `
          <div class="text-start">
            <p class="mb-2"><strong>ID de requisición:</strong> ${response.data.requisition_id}</p>
            <p class="mb-2"><strong>Estado:</strong> <span class="badge ${statusBadgeClass}">${statusText}</span></p>
            <p class="mb-2"><strong>Fecha de solicitud:</strong> ${new Date(response.data.request_date).toLocaleDateString('es-ES')}</p>
        `;
        
        // Si fue auto-autorizada, agregar información adicional
        if (wasAutoAuthorized) {
          htmlContent += `
            <div class="alert alert-success mt-3 mb-3">
              <h6 class="alert-heading mb-2">
                Autorización Automática
              </h6>
              <p class="mb-0 small">Todos los productos solicitados están asignados a tu usuario. Esta requisición ha sido autorizada automáticamente.</p>
            </div>
          `;
        }
        
        htmlContent += `
            <hr>
            <div class="alert alert-warning mb-0">
              <h5 class="alert-heading">
                PIN de Seguridad
              </h5>
              <p class="mb-2">Guarda este PIN para recoger tu requisición:</p>
              <h2 class="text-center mb-0 fw-bold" style="font-size: 3rem; letter-spacing: 0.5rem;">${response.data.pin}</h2>
            </div>
          </div>
        `;
        
        Swal.fire({
          icon: 'success',
          title: wasAutoAuthorized ? '¡Requisición autorizada automáticamente!' : '¡Requisición creada exitosamente!',
          html: htmlContent,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#28a745',
          width: '600px'
        }).then(() => {
          this.router.navigate(['/requisicion']);
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear la requisición. Por favor intenta de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // Métodos para el modo edición desde la lista
  confirmEdit(): void {
    Swal.fire({
      title: '¿Confirmar autorización?',
      text: 'Esta acción autorizará la requisición y no se podrá deshacer.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, autorizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading mientras se procesa
        Swal.fire({
          title: 'Autorizando requisición...',
          text: 'Por favor espera...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al endpoint de autorización
        this.requisitionService.authorizeRequisition(this.requisitionId).subscribe({
          next: (response) => {
            if (response.success) {
              const data = response.data;
              
              Swal.fire({
                icon: 'success',
                title: '¡Requisición Autorizada!',
                html: `
                  <div class="text-start">
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Estado:</strong> <span class="badge bg-success">${data.status}</span></p>
                    <p><strong>Autorizado por:</strong> ${data.authorized_by.full_name}</p>
                    <p><strong>Fecha de autorización:</strong> ${new Date(data.authorization_date).toLocaleString('es-MX')}</p>
                    ${data.electronic_signature ? `<p><strong>Firma digital:</strong> <code class="text-primary">${data.signature_hash}</code></p>` : ''}
                    <hr>
                    <div class="alert alert-info mb-0 mt-3">
                      <h5 class="mb-2"><i class="bi bi-key-fill me-2"></i>PIN de Recolección</h5>
                      <p class="mb-2">El usuario necesitará este PIN para recoger su requisición:</p>
                      <div class="text-center">
                        <h1 class="display-3 fw-bold text-primary mb-0" style="letter-spacing: 0.5rem;">${data.pin || '****'}</h1>
                      </div>
                      <small class="text-muted d-block mt-2">
                        <i class="bi bi-info-circle me-1"></i>
                        Por favor, comparte este PIN con la persona que recogerá la requisición.
                      </small>
                    </div>
                  </div>
                `,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#28a745',
                width: '600px'
              }).then(() => {
                // Redirigir a la lista de requisiciones
                this.router.navigate(['/requisicion/lista']);
              });
            }
          },
          error: (error) => {
            let errorMessage = 'No se pudo autorizar la requisición';
            let errorTitle = 'Error de Autorización';
            
            // Manejar errores específicos del backend
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            if (error.error?.error?.code === 'INVALID_STATUS') {
              errorTitle = 'Estado Inválido';
              errorMessage = `La requisición debe estar en estado "Solicitado" para ser autorizada. Estado actual: ${error.error.error.current_status}`;
            }
            
            Swal.fire({
              icon: 'error',
              title: errorTitle,
              text: errorMessage,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  cancelEditing(): void {
    Swal.fire({
      title: '¿Cancelar edición?',
      text: 'Se perderán todos los cambios no guardados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Continuar editando',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/requisicion/lista']);
      }
    });
  }

  cancelRequisition(): void {
    Swal.fire({
      title: '¿Cancelar requisición?',
      text: 'Opcionalmente puedes agregar un motivo de cancelación:',
      input: 'textarea',
      inputPlaceholder: 'Motivo de cancelación (opcional)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar requisición',
      cancelButtonText: 'No cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      inputValidator: undefined // No es obligatorio
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value?.trim() || undefined;
        
        // Mostrar loading mientras se procesa
        Swal.fire({
          title: 'Cancelando requisición...',
          text: 'Por favor espera...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al endpoint de cancelación
        this.requisitionService.cancelRequisition(this.requisitionId, reason).subscribe({
          next: (response) => {
            if (response.success) {
              const data = response.data;
              
              Swal.fire({
                icon: 'success',
                title: 'Requisición Cancelada',
                html: `
                  <div class="text-start">
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Estado anterior:</strong> <span class="badge bg-secondary">${data.previous_status}</span></p>
                    <p><strong>Estado actual:</strong> <span class="badge bg-danger">${data.current_status}</span></p>
                    <p><strong>Fecha de cancelación:</strong> ${new Date(data.cancelled_at).toLocaleString('es-MX')}</p>
                    ${data.cancellation_reason ? `<p><strong>Motivo:</strong> ${data.cancellation_reason}</p>` : ''}
                  </div>
                `,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#6c757d'
              }).then(() => {
                // Redirigir a la lista de requisiciones
                this.router.navigate(['/requisicion/lista']);
              });
            }
          },
          error: (error) => {
            let errorMessage = 'No se pudo cancelar la requisición';
            let errorTitle = 'Error de Cancelación';
            
            // Manejar errores específicos del backend
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            if (error.error?.error?.code === 'INVALID_STATUS') {
              errorTitle = 'Estado Inválido';
              errorMessage = `No se puede cancelar una requisición en estado "${error.error.error.current_status}". Solo se pueden cancelar requisiciones en estados: Solicitado, Autorizado, En Proceso, Listo Recoger o Espera Devolución.`;
            }
            
            Swal.fire({
              icon: 'error',
              title: errorTitle,
              text: errorMessage,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
    });
  }

  saveAsTemplate(): void {
    Swal.fire({
      title: 'Guardar como plantilla frecuente',
      text: 'Ingrese un nombre para esta plantilla:',
      input: 'text',
      inputPlaceholder: 'Nombre de la plantilla',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un nombre para la plantilla';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const templateName = result.value.trim();
        
        // Mostrar loading
        Swal.fire({
          title: 'Guardando plantilla...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // 🔍 DEBUG: Ver qué ID se está enviando
        
        // Llamar al servicio para crear la plantilla
        this.frequentTemplatesService.createTemplate({
          requisition_id: this.requisitionId,
          name: templateName,
          description: `Creada desde requisición ${this.requisitionId}`,
          is_public: false
        }).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Plantilla guardada!',
              text: response.message,
              confirmButtonText: 'Entendido'
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo guardar la plantilla',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  cerrarDevolucion(): void {
    Swal.fire({
      title: '¿Cerrar devolución?',
      text: '¿Estás seguro de que deseas cerrar esta devolución?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar devolución',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Devolución cerrada',
          text: 'La devolución ha sido cerrada exitosamente.',
          confirmButtonText: 'Continuar'
        }).then(() => {
          // Redirigir a la lista de requisiciones
          this.router.navigate(['/requisicion/lista']);
        });
      }
    });
  }
}