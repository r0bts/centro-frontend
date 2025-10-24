import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';

// Interfaces para el manejo de datos de requisición individual
interface WarehouseProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  requestedQuantity: number;
  suppliedQuantity: number;
  availableStock: number;
  unit: string;
  location: string;
  barcode: string;
  area: string;
  isSupplied: boolean;
  notes?: string;
}

interface RequisitionWarehouse {
  id: string;
  creator: string;
  deliveryDate: Date;
  status: string;
  products: WarehouseProduct[];
  totalProducts: number;
  suppliedProducts: number;
  pendingProducts: number;
}

export interface SupplySession {
  startTime: Date;
  scannedItems: number;
  suppliedItems: number;
  employee: string;
  totalProducts: number;
  completedProducts: number;
  progress: number;
}

@Component({
  selector: 'app-warehouse-supply',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './warehouse-supply.html',
  styleUrls: ['./warehouse-supply.scss']
})
export class WarehouseSupplyComponent implements OnInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;

  activeSection: string = 'almacen-surtido';
  
  // Datos de la requisición
  requisition: RequisitionWarehouse | null = null;
  requisitionId: string = '';
  
  // Productos agrupados por categoría
  productsByCategory: { [key: string]: WarehouseProduct[] } = {};
  categories: string[] = [];
  
  // Control de surtido
  supplySession: SupplySession;
  currentScannedCode: string = '';
  searchTerm: string = '';
  selectedCategory: string = 'all';
  
  // Estado de escaneo
  scannedProduct: WarehouseProduct | null = null;
  scanSuccess: boolean = false;
  scanError: boolean = false;
  
  // Filtros y vistas
  showOnlyPending: boolean = false;
  showScanner: boolean = false;
  scannerEnabled: boolean = false;
  
  // Estado de carga
  isLoading: boolean = false;
  
  constructor(private router: Router, private route: ActivatedRoute) {
    this.supplySession = {
      startTime: new Date(),
      scannedItems: 0,
      suppliedItems: 0,
      employee: 'Usuario Almacén', // En producción vendría del servicio de autenticación
      totalProducts: 0,
      completedProducts: 0,
      progress: 0
    };
  }

  ngOnInit(): void {
    // Obtener ID de requisición desde parámetros de query
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.requisitionId = params['id'];
        this.loadRequisitionData(this.requisitionId);
      } else {
        this.router.navigate(['/requisicion/lista']);
      }
    });
  }

  loadRequisitionData(requisitionId: string): void {
    this.isLoading = true;
    
    // Cargar datos directamente sin setTimeout
    this.requisition = this.getSimulatedWarehouseData(requisitionId);
    if (this.requisition) {
      this.groupProductsByCategory();
    }
    this.isLoading = false;
  }

  getSimulatedWarehouseData(requisitionId: string): RequisitionWarehouse {
    const products: WarehouseProduct[] = [
      {
        id: '1',
        name: 'Aceite vegetal',
        requestedQuantity: 5,
        availableStock: 12,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'A-01-B',
        barcode: '7501234567890',
        code: 'ALM-001',
        category: 'Abarrotes',
        isSupplied: false,
        area: 'Cocina',
        notes: ''
      },
      {
        id: '2',
        name: 'Sal marina',
        requestedQuantity: 2,
        availableStock: 8,
        suppliedQuantity: 0,
        unit: 'Kg',
        location: 'A-02-C',
        barcode: '7501234567891',
        code: 'ALM-002',
        category: 'Abarrotes',
        isSupplied: false,
        area: 'Cocina'
      },
      {
        id: '3',
        name: 'Azúcar refinada',
        requestedQuantity: 10,
        availableStock: 25,
        suppliedQuantity: 0,
        unit: 'Kg',
        location: 'A-02-D',
        barcode: '7501234567892',
        code: 'ALM-003',
        category: 'Abarrotes',
        isSupplied: false,
        area: 'Cocina'
      },
      {
        id: '4',
        name: 'Papel higiénico',
        requestedQuantity: 24,
        availableStock: 30,
        suppliedQuantity: 0,
        unit: 'Rollos',
        location: 'B-01-A',
        barcode: '7501234567893',
        code: 'LIM-001',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Almacén'
      },
      {
        id: '5',
        name: 'Detergente',
        requestedQuantity: 3,
        availableStock: 2,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'B-02-B',
        barcode: '7501234567894',
        code: 'LIM-002',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Almacén',
        notes: 'Stock insuficiente'
      },
      {
        id: '6',
        name: 'Escobas',
        requestedQuantity: 3,
        availableStock: 5,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'B-03-A',
        barcode: '7501234567895',
        code: 'UTE-001',
        category: 'Utensilios',
        isSupplied: false,
        area: 'Mantenimiento'
      },
      {
        id: '7',
        name: 'Cloro',
        requestedQuantity: 2,
        availableStock: 4,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'B-02-C',
        barcode: '7501234567896',
        code: 'LIM-003',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Mantenimiento'
      }
    ];

    return {
      id: requisitionId,
      creator: 'Juan Pérez López',
      deliveryDate: new Date('2025-10-25T10:00:00'),
      status: 'Autorizada',
      products: products,
      totalProducts: products.length,
      suppliedProducts: 0,
      pendingProducts: products.length
    };
  }

  groupProductsByCategory(): void {
    if (!this.requisition) return;
    
    this.productsByCategory = {};
    this.categories = [];
    
    this.requisition.products.forEach(product => {
      if (!this.productsByCategory[product.category]) {
        this.productsByCategory[product.category] = [];
        this.categories.push(product.category);
      }
      this.productsByCategory[product.category].push(product);
    });
    
    // Ordenar categorías alfabéticamente
    this.categories.sort();
  }

  // Funciones de escaneo
  toggleScanner(): void {
    this.showScanner = !this.showScanner;
    if (this.showScanner) {
      this.scannerEnabled = true;
      setTimeout(() => {
        this.barcodeInput?.nativeElement.focus();
      }, 100);
    } else {
      this.scannerEnabled = false;
      this.currentScannedCode = '';
    }
  }

  onBarcodeScanned(): void {
    if (!this.currentScannedCode.trim()) return;
    
    const product = this.findProductByCode(this.currentScannedCode);
    if (product) {
      this.selectProductForSupply(product);
    } else {
      alert(`No se encontró producto con código: ${this.currentScannedCode}`);
    }
    
    this.currentScannedCode = '';
    this.barcodeInput?.nativeElement.focus();
  }

  findProductByCode(code: string): WarehouseProduct | null {
    if (!this.requisition) return null;
    
    return this.requisition.products.find(p => p.code === code || p.barcode === code) || null;
  }

  selectProductForSupply(product: WarehouseProduct): void {
    if (product.isSupplied) {
      alert(`El producto "${product.name}" ya fue surtido completamente.`);
      return;
    }
    
    if (product.availableStock < product.requestedQuantity) {
      const confirmed = confirm(
        `Stock insuficiente para "${product.name}". 
        Cantidad solicitada: ${product.requestedQuantity} ${product.unit}
        Disponible: ${product.availableStock} ${product.unit}
        ¿Surtir cantidad disponible?`
      );
      
      if (confirmed) {
        product.suppliedQuantity = product.availableStock;
        product.isSupplied = true;
      }
    } else {
      product.suppliedQuantity = product.requestedQuantity;
      product.isSupplied = true;
    }
    
    this.calculateProgress();
    this.updateRequisitionStatus();
  }

  // Funciones de control manual
  updateSuppliedQuantity(product: WarehouseProduct, event: any): void {
    const quantity = parseInt(event.target.value) || 0;
    
    if (quantity > product.availableStock) {
      alert(`No se puede surtir más de ${product.availableStock} ${product.unit}`);
      product.suppliedQuantity = product.availableStock;
      return;
    }
    
    if (quantity < 0) {
      product.suppliedQuantity = 0;
      return;
    }
    
    product.suppliedQuantity = quantity;
    product.isSupplied = quantity > 0;
    
    this.calculateProgress();
    this.updateRequisitionStatus();
  }

  markAsComplete(product: WarehouseProduct): void {
    if (product.availableStock >= product.requestedQuantity) {
      product.suppliedQuantity = product.requestedQuantity;
    } else {
      product.suppliedQuantity = product.availableStock;
    }
    
    product.isSupplied = true;
    this.calculateProgress();
    this.updateRequisitionStatus();
  }

  // Funciones nuevas requeridas por el HTML
  getSupplyProgressPercentage(): number {
    if (!this.requisition || this.requisition.products.length === 0) return 0;
    const suppliedProducts = this.requisition.products.filter(p => p.isSupplied).length;
    return Math.round((suppliedProducts / this.requisition.products.length) * 100);
  }

  toggleProductSupply(productId: string): void {
    if (!this.requisition) return;
    
    const product = this.requisition.products.find(p => p.id === productId);
    if (product) {
      product.isSupplied = !product.isSupplied;
      if (product.isSupplied) {
        product.suppliedQuantity = product.requestedQuantity;
      } else {
        product.suppliedQuantity = 0;
      }
      this.calculateProgress();
      this.updateRequisitionStatus();
    }
  }

  updateRequisitionStatus(): void {
    if (!this.requisition) return;
    
    this.requisition.suppliedProducts = this.requisition.products.filter(p => p.isSupplied).length;
    this.requisition.pendingProducts = this.requisition.products.length - this.requisition.suppliedProducts;
  }

  initializeSupplySession(): void {
    if (!this.requisition) return;
    
    this.supplySession = {
      startTime: new Date(),
      totalProducts: this.requisition.products.length,
      completedProducts: this.requisition.products.filter(p => p.isSupplied).length,
      progress: 0,
      scannedItems: 0,
      suppliedItems: this.requisition.products.filter(p => p.isSupplied).length,
      employee: 'Usuario Almacén'
    };
    
    this.calculateProgress();
  }

  calculateProgress(): void {
    if (!this.requisition || this.supplySession.totalProducts === 0) return;
    
    const completedProducts = this.requisition.products.filter(p => p.isSupplied).length;
    this.supplySession.completedProducts = completedProducts;
    this.supplySession.progress = Math.round((completedProducts / this.supplySession.totalProducts) * 100);
  }

  onScanSuccess(result: string): void {
    if (!this.requisition) return;
    
    const product = this.requisition.products.find(p => p.barcode === result);
    
    if (product) {
      this.scannedProduct = product;
      this.scanSuccess = true;
      
      setTimeout(() => {
        this.scanSuccess = false;
      }, 3000);
    } else {
      this.scanError = true;
      setTimeout(() => {
        this.scanError = false;
      }, 3000);
    }
  }

  confirmScan(): void {
    if (this.scannedProduct) {
      this.toggleProductSupply(this.scannedProduct.id);
      this.scannedProduct = null;
      this.scanSuccess = false;
    }
  }

  cancelScan(): void {
    this.scannedProduct = null;
    this.scanSuccess = false;
    this.scanError = false;
  }

  saveProgress(): void {
    if (!this.requisition) return;
    
    // Simular guardado
    console.log('Progreso guardado:', {
      requisitionId: this.requisition.id,
      suppliedProducts: this.requisition.suppliedProducts,
      progress: this.getSupplyProgressPercentage()
    });
    
    // Mostrar mensaje de confirmación
    alert('Progreso guardado exitosamente');
  }

  completeSupply(): void {
    if (!this.requisition) return;
    
    const allSupplied = this.requisition.products.every(p => p.isSupplied);
    
    if (!allSupplied) {
      const confirmPartial = confirm('¿Desea completar el suministro aunque no todos los productos hayan sido surtidos?');
      if (!confirmPartial) return;
    }
    
    // Simular completar suministro
    console.log('Suministro completado:', {
      requisitionId: this.requisition.id,
      completedAt: new Date(),
      suppliedProducts: this.requisition.suppliedProducts,
      totalProducts: this.requisition.totalProducts
    });
    
    alert('Suministro completado exitosamente');
    this.goBack();
  }

  canCompleteSupply(): boolean {
    if (!this.requisition) return false;
    return this.requisition.products.some(p => p.isSupplied);
  }

  goBack(): void {
    this.router.navigate(['/requisicion/lista']);
  }

  // Funciones de filtrado
  getFilteredProducts(): WarehouseProduct[] {
    if (!this.requisition) return [];
    
    let products = this.requisition.products;
    
    // Filtrar por categoría
    if (this.selectedCategory !== 'all') {
      products = products.filter(p => p.category === this.selectedCategory);
    }
    
    // Filtrar por pendientes
    if (this.showOnlyPending) {
      products = products.filter(p => !p.isSupplied);
    }
    
    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.area?.toLowerCase().includes(term)
      );
    }
    
    return products;
  }

  getProductsByCategory(category: string): WarehouseProduct[] {
    return this.productsByCategory[category] || [];
  }

  // Funciones de utilidad
  getStockStatusClass(product: WarehouseProduct): string {
    if (product.availableStock >= product.requestedQuantity) {
      return 'text-success';
    } else if (product.availableStock > 0) {
      return 'text-warning';
    } else {
      return 'text-danger';
    }
  }

  getStatusBadgeClass(product: WarehouseProduct): string {
    if (product.isSupplied) {
      return 'bg-success';
    } else if (product.suppliedQuantity > 0) {
      return 'bg-warning';
    } else if (product.availableStock === 0) {
      return 'bg-danger';
    } else {
      return 'bg-secondary';
    }
  }

  getStatusText(product: WarehouseProduct): string {
    if (product.isSupplied) {
      return 'Completo';
    } else if (product.suppliedQuantity > 0) {
      return 'Parcial';
    } else if (product.availableStock === 0) {
      return 'Sin Stock';
    } else {
      return 'Pendiente';
    }
  }

  // Funciones de navegación y finalización
  goBackToList(): void {
    this.router.navigate(['/requisicion/lista']);
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

  onSectionChange(section: string): void {
    this.activeSection = section;
  }
}