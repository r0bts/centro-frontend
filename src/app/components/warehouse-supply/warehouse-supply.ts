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
      // Mantenimiento
      {
        id: '101',
        name: 'Aceite Lubricante Multiusos',
        requestedQuantity: 2,
        availableStock: 5,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'M-01-A',
        barcode: '7501234560101',
        code: '101',
        category: 'Mantenimiento',
        isSupplied: false,
        area: 'Mantenimiento'
      },
      {
        id: '102',
        name: 'Foco LED E27 Luz Blanca',
        requestedQuantity: 10,
        availableStock: 25,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'M-02-B',
        barcode: '7501234560102',
        code: '102',
        category: 'Mantenimiento',
        isSupplied: false,
        area: 'Mantenimiento'
      },
      {
        id: '103',
        name: 'Clavos de Acero 2"',
        requestedQuantity: 1,
        availableStock: 8,
        suppliedQuantity: 0,
        unit: 'Kg',
        location: 'M-03-C',
        barcode: '7501234560103',
        code: '103',
        category: 'Mantenimiento',
        isSupplied: false,
        area: 'Mantenimiento'
      },
      {
        id: '104',
        name: 'Pintura Acrílica Blanca (Galón)',
        requestedQuantity: 3,
        availableStock: 4,
        suppliedQuantity: 0,
        unit: 'Galones',
        location: 'M-04-D',
        barcode: '7501234560104',
        code: '104',
        category: 'Mantenimiento',
        isSupplied: false,
        area: 'Mantenimiento'
      },
      {
        id: '105',
        name: 'Cinta Adhesiva Aislante Negra',
        requestedQuantity: 5,
        availableStock: 12,
        suppliedQuantity: 0,
        unit: 'Rollos',
        location: 'M-05-A',
        barcode: '7501234560105',
        code: '105',
        category: 'Mantenimiento',
        isSupplied: false,
        area: 'Mantenimiento'
      },
      // Cafetería
      {
        id: '201',
        name: 'Galletas de Avena (Paquete)',
        requestedQuantity: 15,
        availableStock: 20,
        suppliedQuantity: 0,
        unit: 'Paquetes',
        location: 'C-01-A',
        barcode: '7501234560201',
        code: '201',
        category: 'Cafetería',
        isSupplied: false,
        area: 'Cafetería'
      },
      {
        id: '202',
        name: 'Café Soluble Clásico 200g',
        requestedQuantity: 8,
        availableStock: 15,
        suppliedQuantity: 0,
        unit: 'Frascos',
        location: 'C-02-B',
        barcode: '7501234560202',
        code: '202',
        category: 'Cafetería',
        isSupplied: false,
        area: 'Cafetería'
      },
      {
        id: '203',
        name: 'Leche en Polvo Entera 1kg',
        requestedQuantity: 5,
        availableStock: 10,
        suppliedQuantity: 0,
        unit: 'Kg',
        location: 'C-03-C',
        barcode: '7501234560203',
        code: '203',
        category: 'Cafetería',
        isSupplied: false,
        area: 'Cafetería'
      },
      {
        id: '204',
        name: 'Azúcar Estándar (Kilo)',
        requestedQuantity: 12,
        availableStock: 18,
        suppliedQuantity: 0,
        unit: 'Kg',
        location: 'C-04-D',
        barcode: '7501234560204',
        code: '204',
        category: 'Cafetería',
        isSupplied: false,
        area: 'Cafetería'
      },
      {
        id: '205',
        name: 'Tazas Desechables para Café 8oz',
        requestedQuantity: 200,
        availableStock: 300,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'C-05-A',
        barcode: '7501234560205',
        code: '205',
        category: 'Cafetería',
        isSupplied: false,
        area: 'Cafetería'
      },
      // Limpieza
      {
        id: '301',
        name: 'Cloro Desinfectante 4L',
        requestedQuantity: 6,
        availableStock: 8,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'L-01-A',
        barcode: '7501234560301',
        code: '301',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Limpieza'
      },
      {
        id: '302',
        name: 'Jabón Líquido para Manos 1L',
        requestedQuantity: 10,
        availableStock: 15,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'L-02-B',
        barcode: '7501234560302',
        code: '302',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Limpieza'
      },
      {
        id: '303',
        name: 'Toallas de Papel Desechables (Paquete)',
        requestedQuantity: 25,
        availableStock: 30,
        suppliedQuantity: 0,
        unit: 'Paquetes',
        location: 'L-03-C',
        barcode: '7501234560303',
        code: '303',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Limpieza'
      },
      {
        id: '304',
        name: 'Limpiador Multiusos con Aroma 1L',
        requestedQuantity: 8,
        availableStock: 12,
        suppliedQuantity: 0,
        unit: 'Litros',
        location: 'L-04-D',
        barcode: '7501234560304',
        code: '304',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Limpieza'
      },
      {
        id: '305',
        name: 'Bolsas para Basura Negras Extra Grandes',
        requestedQuantity: 50,
        availableStock: 75,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'L-05-A',
        barcode: '7501234560305',
        code: '305',
        category: 'Limpieza',
        isSupplied: false,
        area: 'Limpieza'
      },
      // Papelería
      {
        id: '401',
        name: 'Carpetas de Anillos Tamaño Carta',
        requestedQuantity: 15,
        availableStock: 20,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'P-01-A',
        barcode: '7501234560401',
        code: '401',
        category: 'Papelería',
        isSupplied: false,
        area: 'Administración'
      },
      {
        id: '402',
        name: 'Hojas Blancas Carta (Paquete 500)',
        requestedQuantity: 10,
        availableStock: 25,
        suppliedQuantity: 0,
        unit: 'Paquetes',
        location: 'P-02-B',
        barcode: '7501234560402',
        code: '402',
        category: 'Papelería',
        isSupplied: false,
        area: 'Administración'
      },
      {
        id: '403',
        name: 'Tóner para Impresora (Modelo Genérico)',
        requestedQuantity: 3,
        availableStock: 2,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'P-03-C',
        barcode: '7501234560403',
        code: '403',
        category: 'Papelería',
        isSupplied: false,
        area: 'Administración',
        notes: 'Stock insuficiente'
      },
      {
        id: '404',
        name: 'Folders Tamaño Carta Manila',
        requestedQuantity: 50,
        availableStock: 100,
        suppliedQuantity: 0,
        unit: 'Piezas',
        location: 'P-04-D',
        barcode: '7501234560404',
        code: '404',
        category: 'Papelería',
        isSupplied: false,
        area: 'Administración'
      },
      {
        id: '405',
        name: 'Plumas de Gel Negras (Caja)',
        requestedQuantity: 8,
        availableStock: 15,
        suppliedQuantity: 0,
        unit: 'Cajas',
        location: 'P-05-A',
        barcode: '7501234560405',
        code: '405',
        category: 'Papelería',
        isSupplied: false,
        area: 'Administración'
      }
    ];

    return {
      id: requisitionId,
      creator: 'Ana López Martínez',
      deliveryDate: new Date('2025-10-28T14:00:00'),
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