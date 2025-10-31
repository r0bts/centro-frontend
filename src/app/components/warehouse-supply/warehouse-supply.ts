import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

// Interfaces para el manejo de datos de requisición individual
interface WarehouseProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  requestedQuantity: number;
  suppliedQuantity: number;
  returnQuantity?: number;
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
  authorizedBy?: string;
  authorizationDate?: Date;
  electronicSignature?: boolean;
  signatureHash?: string;
  signatureDate?: Date;
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
  showReturnColumn: boolean = false; // Nueva variable para mostrar/ocultar columna de devolución
  
  // Estado de carga
  isLoading: boolean = false;
  
  // Variables para el modal de NIP
  enteredNip: string = '';
  nipError: string = '';
  private readonly validNip: string = '1234'; // NIP para pruebas
  
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
      // Mantenimiento - 2 productos
      {
        id: '101',
        name: 'Aceite Lubricante Multiusos',
        requestedQuantity: 2,
        availableStock: 5,
        suppliedQuantity: 0, // YA SURTIDO para pruebas
        unit: 'Litros',
        location: 'M-01-A',
        barcode: '7501234560101',
        code: '101',
        category: 'Mantenimiento',
        isSupplied: false, // MARCADO COMO SURTIDO
        area: 'Mantenimiento'
      },
      {
        id: '102',
        name: 'Foco LED E27 Luz Blanca',
        requestedQuantity: 3,
        availableStock: 25,
        suppliedQuantity: 0, // YA SURTIDO para pruebas
        unit: 'Piezas',
        location: 'M-02-B',
        barcode: '7501234560102',
        code: '102',
        category: 'Mantenimiento',
        isSupplied: false, // MARCADO COMO SURTIDO
        area: 'Mantenimiento'
      },
      // Cafetería - 2 productos
      {
        id: '201',
        name: 'Galletas de Avena (Paquete)',
        requestedQuantity: 4,
        availableStock: 20,
        suppliedQuantity: 0, // YA SURTIDO para pruebas
        unit: 'Paquetes',
        location: 'C-01-A',
        barcode: '7501234560201',
        code: '201',
        category: 'Cafetería',
        isSupplied: false, // MARCADO COMO SURTIDO
        area: 'Cafetería'
      },
      {
        id: '202',
        name: 'Café Soluble Clásico 200g',
        requestedQuantity: 2,
        availableStock: 15,
        suppliedQuantity: 0, // YA SURTIDO para pruebas
        unit: 'Frascos',
        location: 'C-02-B',
        barcode: '7501234560202',
        code: '202',
        category: 'Cafetería',
        isSupplied: false, // MARCADO COMO SURTIDO
        area: 'Cafetería'
      },
      // Limpieza - 2 productos (pendientes)
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
      // Papelería - 1 producto (pendiente)
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
    ];

    return {
      id: requisitionId,
      creator: 'Ana López Martínez',
      deliveryDate: new Date('2025-10-28T14:00:00'),
      status: 'Autorizada',
      authorizedBy: 'Dr. Carlos Mendoza',
      authorizationDate: new Date('2025-10-27T10:30:00'),
      electronicSignature: true,
      signatureHash: 'A3F7-8B2C-D9E1-5A6F-C4B8-7D3E-9F1A-2C5B',
      signatureDate: new Date('2025-10-27T10:32:15'),
      products: products,
      totalProducts: products.length,
      suppliedProducts: 0, // 4 productos ya surtidos para pruebas
      pendingProducts: products.length - 4
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
      Swal.fire({
        icon: 'warning',
        title: 'Producto no encontrado',
        text: `No se encontró producto con código: ${this.currentScannedCode}`,
        confirmButtonText: 'Entendido'
      });
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
      Swal.fire({
        icon: 'info',
        title: 'Producto ya surtido',
        text: `El producto "${product.name}" ya fue surtido completamente.`,
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    if (product.availableStock < product.requestedQuantity) {
      Swal.fire({
        title: 'Stock insuficiente',
        html: `
          <p><strong>${product.name}</strong></p>
          <p>Cantidad solicitada: <strong>${product.requestedQuantity} ${product.unit}</strong></p>
          <p>Disponible: <strong>${product.availableStock} ${product.unit}</strong></p>
          <p>¿Surtir cantidad disponible?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, surtir disponible',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          product.suppliedQuantity = product.availableStock;
          product.isSupplied = product.suppliedQuantity >= product.requestedQuantity;
          this.calculateProgress();
          this.updateRequisitionStatus();
        }
      });
      return;
    } else {
      product.suppliedQuantity = product.requestedQuantity;
      product.isSupplied = true;
    }
    
    this.calculateProgress();
    this.updateRequisitionStatus();
  }

  // Funciones de control manual
  updateSuppliedQuantity(product: WarehouseProduct, event: any): void {
    const value = event.target.value;
    
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    event.target.value = numericValue;
    
    const quantity = parseInt(numericValue) || 0;
    
    if (quantity > product.requestedQuantity) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad excedida',
        text: `No se puede surtir más de ${product.requestedQuantity} ${product.unit} (cantidad solicitada)`,
        confirmButtonText: 'Entendido'
      });
      product.suppliedQuantity = product.requestedQuantity;
      event.target.value = product.requestedQuantity.toString();
      return;
    }
    
    if (quantity > product.availableStock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${product.availableStock} ${product.unit} disponibles en stock`,
        confirmButtonText: 'Entendido'
      });
      product.suppliedQuantity = product.availableStock;
      event.target.value = product.availableStock.toString();
      return;
    }
    
    if (quantity < 0) {
      product.suppliedQuantity = 0;
      event.target.value = '0';
      return;
    }
    
    product.suppliedQuantity = quantity;
    product.isSupplied = quantity > 0;
    
    this.calculateProgress();
    this.updateRequisitionStatus();
  }

  updateReturnQuantity(product: WarehouseProduct, event: any): void {
    const value = event.target.value;
    
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    event.target.value = numericValue;
    
    const quantity = parseInt(numericValue) || 0;
    
    if (quantity < 0) {
      product.returnQuantity = 0;
      return;
    }
    
    product.returnQuantity = quantity;
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
    Swal.fire({
      icon: 'success',
      title: '¡Progreso guardado!',
      text: 'El progreso ha sido guardado exitosamente',
      confirmButtonText: 'Continuar',
      timer: 2000,
      timerProgressBar: true
    });
  }

  completeSupply(): void {
    if (!this.requisition) return;
    
    const allSupplied = this.requisition.products.every(p => p.isSupplied);
    
    if (!allSupplied) {
      Swal.fire({
        title: 'Suministro incompleto',
        text: '¿Desea completar el suministro aunque no todos los productos hayan sido surtidos?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.finalizeSupply();
        }
      });
      return;
    }
    
    this.finalizeSupply();
  }

  private finalizeSupply(): void {
    if (!this.requisition) return;
    
    // Simular completar suministro
    console.log('Suministro completado:', {
      requisitionId: this.requisition.id,
      completedAt: new Date(),
      suppliedProducts: this.requisition.suppliedProducts,
      totalProducts: this.requisition.totalProducts
    });
    
    Swal.fire({
      icon: 'success',
      title: '¡Suministro completado!',
      text: 'El suministro ha sido completado exitosamente',
      confirmButtonText: 'Continuar'
    }).then(() => {
      this.goBack();
    });
  }

  canCompleteSupply(): boolean {
    if (!this.requisition) return false;
    // Solo permitir cuando TODOS los productos que tienen stock disponible estén surtidos
    const productsWithStock = this.requisition.products.filter(p => p.availableStock > 0);
    if (productsWithStock.length === 0) return false;
    return productsWithStock.every(p => p.isSupplied);
  }

  hasProductsToReturn(): boolean {
    if (!this.requisition) return false;
    return this.requisition.products.some(p => p.returnQuantity && p.returnQuantity > 0);
  }

  toggleReturnColumn(): void {
    this.showReturnColumn = !this.showReturnColumn;
    
    // Si se oculta la columna, limpiar todas las cantidades de devolución
    if (!this.showReturnColumn && this.requisition) {
      this.requisition.products.forEach(product => {
        product.returnQuantity = 0;
      });
    }
  }

  markReadyForCollection(): void {
    if (!this.requisition) return;
    
    // Limpiar estado anterior
    this.enteredNip = '';
    this.nipError = '';
    
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('nipModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  validateNipAndProceed(): void {
    if (!this.enteredNip || this.enteredNip.length < 4) {
      this.nipError = 'El NIP debe tener 4 dígitos';
      return;
    }

    if (this.enteredNip !== this.validNip) {
      this.nipError = 'NIP incorrecto. Intente nuevamente.';
      // Limpiar el input después de error
      setTimeout(() => {
        this.enteredNip = '';
      }, 1500);
      return;
    }

    // NIP correcto - cerrar modal y proceder
    const modalElement = document.getElementById('nipModal');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    }

    // Proceder con la confirmación
    this.proceedWithCollection();
  }

  private proceedWithCollection(): void {
    if (!this.requisition) return;

    Swal.fire({
      title: '¡Autorización exitosa!',
      html: `
        <div class="text-center">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
          <p class="mt-3 mb-2">La requisición <strong>${this.requisition.id}</strong> ha sido autorizada.</p>
          <p class="text-muted">El solicitante será notificado para recoger los productos.</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#43B581' // Success color from global styles
    }).then(() => {
      // Simular marcado como listo para recolección
      console.log('Requisición autorizada y lista para recolección:', {
        requisitionId: this.requisition?.id,
        authorizedAt: new Date(),
        authorizedBy: 'Usuario actual',
        nipUsed: true,
        suppliedProducts: this.requisition?.suppliedProducts,
        totalProducts: this.requisition?.totalProducts
      });
      
      this.goBackToList();
    });
  }

  returnProductsToWarehouse(): void {
    if (!this.requisition) return;
    
    const productsToReturn = this.requisition.products.filter(p => p.returnQuantity && p.returnQuantity > 0);
    
    if (productsToReturn.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay productos para devolver',
        text: 'No se han especificado cantidades de devolución en ningún producto.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    let returnListHtml = '<div class="text-start"><h6>Productos a devolver:</h6><ul class="list-unstyled">';
    productsToReturn.forEach(product => {
      returnListHtml += `<li class="mb-2">
        <strong>${product.name}</strong><br>
        <small class="text-muted">Cantidad: ${product.returnQuantity} ${product.unit}</small>
      </li>`;
    });
    returnListHtml += '</ul></div>';

    Swal.fire({
      title: '¿Confirmar devolución al almacén?',
      html: returnListHtml,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, devolver productos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#F4D35E', // Warning color from global styles
      cancelButtonColor: '#5B5B5B',  // Neutral-700 from global styles
      width: '600px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Simular devolución de productos
        console.log('Productos devueltos al almacén:', {
          requisitionId: this.requisition?.id,
          returnedProducts: productsToReturn,
          timestamp: new Date()
        });
        
        // Limpiar cantidades de devolución después del proceso
        productsToReturn.forEach(product => {
          product.returnQuantity = 0;
        });
        
        Swal.fire({
          icon: 'success',
          title: '¡Productos devueltos!',
          text: `${productsToReturn.length} producto(s) han sido devueltos al almacén exitosamente.`,
          confirmButtonText: 'Continuar'
        });
      }
    });
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
        p.barcode.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        p.area?.toLowerCase().includes(term)
      );
    }
    
    return products;
  }

  getProductsByCategory(category: string): WarehouseProduct[] {
    let products = this.productsByCategory[category] || [];
    
    // Aplicar filtro de búsqueda si hay un término
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        p.area?.toLowerCase().includes(term)
      );
    }
    
    return products;
  }

  // Función para verificar si una categoría tiene productos después del filtrado
  hasProductsInCategory(category: string): boolean {
    return this.getProductsByCategory(category).length > 0;
  }

  // Función para verificar si hay alguna categoría con productos después de la búsqueda
  hasAnyProductsInSearch(): boolean {
    return this.categories.some(category => this.hasProductsInCategory(category));
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