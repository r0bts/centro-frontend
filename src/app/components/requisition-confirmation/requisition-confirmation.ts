import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';

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

  constructor(private router: Router) {
    // Obtener datos del estado de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.requisitionData = navigation.extras.state['requisitionData'] || [];
      this.deliveryDate = navigation.extras.state['deliveryDate'] || null;
    }
  }

  ngOnInit(): void {
    // Si no hay datos, redirigir de vuelta
    if (this.requisitionData.length === 0) {
      this.router.navigate(['/requisicion']);
      return;
    }
    
    this.consolidateProducts();
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

  getTotalProductsCount(): number {
    return this.consolidatedProducts.length;
  }

  getTotalAreasCount(): number {
    return this.requisitionData.length;
  }

  goBack(): void {
    // Navegar de vuelta con todos los datos para cargar la información nuevamente
    this.router.navigate(['/requisicion'], {
      state: {
        loadExistingData: true,
        requisitionSummary: this.requisitionData,
        deliveryDate: this.deliveryDate,
        selectedEmployee: this.selectedEmployee
      }
    });
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
      alert('Por favor selecciona un empleado responsable antes de confirmar la requisición.');
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
    alert('¡Requisición enviada exitosamente!');
    this.router.navigate(['/requisicion']);
  }
}