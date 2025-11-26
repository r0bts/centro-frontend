import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

export interface RequisitionSummary {
  area: string;
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
  styleUrls: ['./requisition-confirmation.scss']
})
export class RequisitionConfirmationComponent implements OnInit {
  activeSection: string = 'requisicion';
  
  // Datos de la requisición recibidos del componente anterior
  requisitionData: RequisitionSummary[] = [];
  deliveryDate: Date | null = null;
  
  // Productos consolidados
  consolidatedProducts: ConsolidatedProduct[] = [];

  // Variables para el select de empleados
  employees: Employee[] = [
    { id: '1', name: 'Juan Pérez López', position: 'Supervisor de Almacén' },
    { id: '2', name: 'María González García', position: 'Jefe de Compras' },
    { id: '3', name: 'Carlos Rodríguez Martín', position: 'Coordinador de Inventario' },
    { id: '4', name: 'Ana Fernández Ruiz', position: 'Asistente de Logística' },
    { id: '5', name: 'Luis Martínez Sánchez', position: 'Encargado de Recepción' },
    { id: '6', name: 'Carmen Jiménez Torres', position: 'Supervisora de Distribución' },
    { id: '7', name: 'Roberto Silva Mendoza', position: 'Coordinador de Requisiciones' },
    { id: '8', name: 'Patricia López Hernández', position: 'Jefe de Operaciones' }
  ];
  
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

  constructor(private router: Router, private route: ActivatedRoute) {
    // Obtener datos del estado de navegación (para flujo normal)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.requisitionData = navigation.extras.state['requisitionData'] || [];
      this.deliveryDate = navigation.extras.state['deliveryDate'] || null;
      this.isDevolucion = navigation.extras.state['isDevolucion'] || false;
      this.selectedEventId = navigation.extras.state['selectedEventId'] || '';
      this.businessUnit = navigation.extras.state['businessUnit'] || '';
    }
  }

  ngOnInit(): void {
    // Verificar si vienen parámetros de query (desde la lista)
    this.route.queryParams.subscribe(params => {
      if (params['id'] && params['mode']) {
        this.requisitionId = params['id'];
        this.viewMode = params['mode'];
        this.isFromList = true; // Marca que viene desde la lista
        this.loadRequisitionData(this.requisitionId);
      } else {
        // Si no hay datos ni parámetros, redirigir de vuelta
        if (this.requisitionData.length === 0) {
          this.router.navigate(['/requisicion']);
          return;
        }
        this.isFromList = false; // Viene del flujo normal
        this.consolidateProducts();
      }
    });
  }

  loadRequisitionData(requisitionId: string): void {
    // Aquí cargarías los datos de la requisición desde el servicio
    // Por ahora, voy a simular datos basándose en el ID
    console.log(`Cargando datos para requisición: ${requisitionId} en modo: ${this.viewMode}`);
    
    // Datos simulados basándose en el ID de la requisición
    this.requisitionData = this.getSimulatedRequisitionData(requisitionId);
    
    // Simular fecha de entrega
    this.deliveryDate = new Date('2025-10-25T10:00:00');
    
    // Simular empleado responsable asignado
    this.selectedEmployee = this.getSimulatedResponsibleEmployee(requisitionId);
    if (this.selectedEmployee) {
      this.employeeSearchTerm = this.selectedEmployee.name;
    }
    
    this.consolidateProducts();
  }

  getSimulatedRequisitionData(requisitionId: string): RequisitionSummary[] {
    // Datos simulados que varían según el ID
    const baseData: RequisitionSummary[] = [
      {
        area: 'Cocina',
        products: [
          { id: '1', name: 'Aceite vegetal', quantity: 5, unit: 'Litros', actions: '' },
          { id: '2', name: 'Sal marina', quantity: 2, unit: 'Kg', actions: '' },
          { id: '3', name: 'Azúcar refinada', quantity: 10, unit: 'Kg', actions: '' }
        ]
      },
      {
        area: 'Almacén',
        products: [
          { id: '4', name: 'Papel higiénico', quantity: 24, unit: 'Rollos', actions: '' },
          { id: '5', name: 'Detergente', quantity: 3, unit: 'Litros', actions: '' }
        ]
      }
    ];

    // Modificar datos según el ID para simular diferentes requisiciones
    if (requisitionId.includes('002') || requisitionId.includes('008')) {
      baseData.push({
        area: 'Mantenimiento',
        products: [
          { id: '6', name: 'Escobas', quantity: 3, unit: 'Piezas', actions: '' },
          { id: '7', name: 'Cloro', quantity: 2, unit: 'Litros', actions: '' }
        ]
      });
    }

    return baseData;
  }

  getSimulatedResponsibleEmployee(requisitionId: string): Employee | null {
    // Simular empleado responsable según el ID de la requisición
    const employeeMapping: { [key: string]: Employee } = {
      'REQ-001': this.employees[1], // María González García
      'REQ-002': this.employees[2], // Carlos Rodríguez Martín
      'REQ-003': this.employees[4], // Luis Martínez Sánchez
      'REQ-004': this.employees[7], // Patricia López Hernández
      'REQ-005': this.employees[1], // María González García
      'REQ-006': this.employees[3], // Ana Fernández Ruiz
      'REQ-007': this.employees[0], // Juan Pérez López
      'REQ-008': this.employees[6], // Roberto Silva Mendoza
      'REQ-009': this.employees[7], // Patricia López Hernández
      'REQ-010': this.employees[1], // María González García
      'REQ-011': this.employees[4], // Luis Martínez Sánchez
      'REQ-012': this.employees[2], // Carlos Rodríguez Martín
      'REQ-013': this.employees[0], // Juan Pérez López
      'REQ-014': this.employees[7], // Patricia López Hernández
      'REQ-015': this.employees[3], // Ana Fernández Ruiz
      'REQ-016': this.employees[1], // María González García
      'REQ-017': this.employees[4], // Luis Martínez Sánchez
      'REQ-018': this.employees[6]  // Roberto Silva Mendoza
    };

    return employeeMapping[requisitionId] || this.employees[0]; // Default al primer empleado si no se encuentra
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
          existingProduct.totalQuantity += product.quantity;
          existingProduct.details.push({
            area: summary.area,
            quantity: product.quantity
          });
        } else {
          // Si es un producto nuevo, crearlo
          productMap.set(key, {
            name: product.name,
            totalQuantity: product.quantity,
            unit: product.unit,
            details: [{
              area: summary.area,
              quantity: product.quantity
            }]
          });
        }
      });
    });

    // Convertir el map a array y ordenar alfabéticamente
    this.consolidatedProducts = Array.from(productMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
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

  getTotalProductsCount(): number {
    return this.consolidatedProducts.length;
  }

  getTotalAreasCount(): number {
    return this.requisitionData.length;
  }

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
    if (this.employeeSearchTerm.trim()) {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.name.toLowerCase().includes(this.employeeSearchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(this.employeeSearchTerm.toLowerCase())
      );
    } else {
      this.filteredEmployees = [...this.employees];
    }
    this.showEmployeeDropdown = true;
  }

  onEmployeeFocus(): void {
    this.filteredEmployees = [...this.employees];
    this.showEmployeeDropdown = true;
  }

  onEmployeeBlur(): void {
    // Timeout para permitir clic en dropdown
    setTimeout(() => {
      this.showEmployeeDropdown = false;
    }, 200);
  }

  selectEmployee(employee: Employee): void {
    this.selectedEmployee = employee;
    this.employeeSearchTerm = employee.name;
    this.showEmployeeDropdown = false;
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.employeeSearchTerm = '';
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

    // Aquí se enviaría la requisición final al servidor
    console.log('Requisición final confirmada:', {
      deliveryDate: this.deliveryDate,
      responsibleEmployee: this.selectedEmployee,
      areas: this.requisitionData,
      consolidatedProducts: this.consolidatedProducts
    });
    
    // Mostrar mensaje de éxito y navegar
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Requisición enviada exitosamente',
      confirmButtonText: 'Continuar'
    }).then(() => {
      this.router.navigate(['/requisicion']);
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
        // Aquí se enviaría la requisición autorizada al servidor
        console.log('Requisición autorizada');
        
        Swal.fire({
          icon: 'success',
          title: '¡Autorizada!',
          text: 'La requisición ha sido autorizada exitosamente.',
          confirmButtonText: 'Continuar'
        }).then(() => {
          this.router.navigate(['/requisitions']);
        });
      }
    });
  }

  cancelEdit(): void {
    Swal.fire({
      title: '¿Cancelar edición?',
      text: 'Se perderán todos los cambios no guardados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar editando',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/requisitions']);
      }
    });
  }

  saveAsTemplate(): void {
    Swal.fire({
      title: 'Guardar como lista frecuente',
      text: 'Ingrese un nombre para esta lista frecuente:',
      input: 'text',
      inputPlaceholder: 'Nombre de la lista frecuente',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un nombre para la lista frecuente';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const templateName = result.value.trim();
        
        console.log('Guardando como plantilla:', {
          name: templateName,
          areas: this.requisitionData,
          consolidatedProducts: this.consolidatedProducts,
          createdFrom: this.requisitionId,
          createdDate: new Date()
        });
        
        // Aquí se guardaría la plantilla en el servidor o localStorage
        const template = {
          id: `TEMPLATE-${Date.now()}`,
          name: templateName,
          areas: this.requisitionData,
          consolidatedProducts: this.consolidatedProducts,
          createdFrom: this.requisitionId,
          createdDate: new Date()
        };
        
        // Simular guardado en localStorage
        const existingTemplates = JSON.parse(localStorage.getItem('requisitionTemplates') || '[]');
        existingTemplates.push(template);
        localStorage.setItem('requisitionTemplates', JSON.stringify(existingTemplates));
        
        Swal.fire({
          icon: 'success',
          title: '¡Lista frecuente guardada!',
          text: `La lista frecuente "${templateName}" ha sido guardada exitosamente.`,
          confirmButtonText: 'Entendido'
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
        console.log('Cerrando devolución para requisición:', this.requisitionId);
        
        // Aquí implementarías la lógica para cerrar la devolución
        // Por ejemplo, cambiar el estado de la requisición
        
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