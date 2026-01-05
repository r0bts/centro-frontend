import { Component, OnInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

// Importar modelos y helpers
import {
  WarehouseProduct,
  RequisitionWarehouse,
  SupplySession,
  ProductsByCategory,
  WarehouseSupplyResponse
} from '../../models/warehouse-supply.model';
import { WarehouseSupplyHelper } from '../../helpers/warehouse-supply.helper';
import { AuthService } from '../../services/auth.service';

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
  
  // Signals para estado reactivo
  requisition = signal<RequisitionWarehouse | null>(null);
  requisitionId = signal<string>('');
  productsByCategory = signal<ProductsByCategory>({});
  categories = signal<string[]>([]);
  supplySession = signal<SupplySession>({
    startTime: new Date(),
    scannedItems: 0,
    suppliedItems: 0,
    employee: 'Usuario Almacén',
    totalProducts: 0,
    completedProducts: 0,
    progress: 0
  });
  
  // Señales de control
  currentScannedCode = signal<string>('');
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('all');
  scannedProduct = signal<WarehouseProduct | null>(null);
  scanSuccess = signal<boolean>(false);
  scanError = signal<boolean>(false);
  showOnlyPending = signal<boolean>(false);
  showScanner = signal<boolean>(false);
  scannerEnabled = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  enteredNip = signal<string>('');
  nipError = signal<string>('');
  generatedNip = signal<string>('');
  
  // Computed signals
  hasRequisition = computed(() => this.requisition() !== null);
  
  supplyProgressPercentage = computed(() => {
    const req = this.requisition();
    if (!req) return 0;
    return WarehouseSupplyHelper.calculateSupplyProgress(req);
  });
  
  canComplete = computed(() => {
    const req = this.requisition();
    if (!req) return false;
    return WarehouseSupplyHelper.canCompleteSupply(req);
  });
  
  hasProductsForReturn = computed(() => {
    const req = this.requisition();
    if (!req) return false;
    return WarehouseSupplyHelper.hasProductsToReturn(req.products);
  });
  
  showReturnColumn = computed(() => {
    const req = this.requisition();
    if (!req) return false;
    return req.awaiting_return;
  });
  
  filteredProducts = computed(() => {
    const req = this.requisition();
    if (!req) return [];
    
    let products = req.products;
    
    // Filtrar por categoría
    const category = this.selectedCategory();
    if (category !== 'all') {
      products = WarehouseSupplyHelper.filterProductsByCategory(products, category);
    }
    
    // Filtrar por pendientes
    if (this.showOnlyPending()) {
      products = WarehouseSupplyHelper.filterPendingProducts(products);
    }
    
    // Filtrar por búsqueda
    const search = this.searchTerm();
    if (search.trim()) {
      products = WarehouseSupplyHelper.filterProductsBySearch(products, search);
    }
    
    return products;
  });
  
  private readonly validNip: string = '1234';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener ID de requisición desde parámetros de query
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.requisitionId.set(params['id']);
        this.loadRequisitionData(this.requisitionId());
      } else {
        this.router.navigate(['/requisicion/lista']);
      }
    });
  }

  loadRequisitionData(requisitionId: string): void {
    this.isLoading.set(true);
    
    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('❌ No hay token de autenticación');
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const apiUrl = `${environment.apiUrl}/requisitions/${requisitionId}/supply`;
    
    this.http.get<WarehouseSupplyResponse>(apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.success && response.data?.requisition) {
          console.log('✅ Requisición cargada:', response.data.requisition);
          
          // Mapear datos de la API usando el helper
          const mappedRequisition = WarehouseSupplyHelper.mapRequisitionFromAPI(
            response.data.requisition
          );
          
          this.requisition.set(mappedRequisition);
          
          // Agrupar productos por categoría
          const grouped = WarehouseSupplyHelper.groupProductsByCategory(mappedRequisition.products);
          this.productsByCategory.set(grouped);
          
          // Extraer categorías únicas
          const cats = WarehouseSupplyHelper.extractCategories(grouped);
          this.categories.set(cats);
          
          // Inicializar sesión de surtido
          const session = WarehouseSupplyHelper.initializeSupplySession(
            mappedRequisition,
            'Usuario Almacén' // En producción vendría del servicio de autenticación
          );
          this.supplySession.set(session);
        } else {
          console.error('❌ Respuesta inválida del servidor');
          this.requisition.set(null);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar requisición:', error);
        this.isLoading.set(false);
        this.requisition.set(null);
        
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          text: 'No se pudo cargar la información de la requisición',
          confirmButtonText: 'Volver'
        }).then(() => {
          this.goBackToList();
        });
      }
    });
  }

  // Funciones de utilidad para templates
  getProductsByCategory(category: string): WarehouseProduct[] {
    const grouped = this.productsByCategory();
    let products = grouped[category] || [];
    
    // Aplicar filtro de búsqueda si hay un término
    const search = this.searchTerm();
    if (search.trim()) {
      products = WarehouseSupplyHelper.filterProductsBySearch(products, search);
    }
    
    return products;
  }

  hasProductsInCategory(category: string): boolean {
    return this.getProductsByCategory(category).length > 0;
  }

  hasAnyProductsInSearch(): boolean {
    const cats = this.categories();
    return cats.some(category => this.hasProductsInCategory(category));
  }

  getFilteredProducts(): WarehouseProduct[] {
    return this.filteredProducts();
  }

  getSupplyProgressPercentage(): number {
    return this.supplyProgressPercentage();
  }

  canCompleteSupply(): boolean {
    return this.canComplete();
  }

  hasProductsToReturn(): boolean {
    return this.hasProductsForReturn();
  }

  // Funciones de escaneo
  toggleScanner(): void {
    this.showScanner.update(show => !show);
    if (this.showScanner()) {
      this.scannerEnabled.set(true);
      setTimeout(() => {
        this.barcodeInput?.nativeElement.focus();
      }, 100);
    } else {
      this.scannerEnabled.set(false);
      this.currentScannedCode.set('');
    }
  }

  onBarcodeScanned(): void {
    const code = this.currentScannedCode();
    if (!code.trim()) return;
    
    const req = this.requisition();
    if (!req) return;
    
    const product = WarehouseSupplyHelper.findProductByBarcode(req.products, code);
    if (product) {
      this.selectProductForSupply(product);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Producto no encontrado',
        text: `No se encontró producto con código: ${code}`,
        confirmButtonText: 'Entendido'
      });
    }
    
    this.currentScannedCode.set('');
    this.barcodeInput?.nativeElement.focus();
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
          this.updateProductInRequisition(product.id, (p) => 
            WarehouseSupplyHelper.updateSuppliedQuantity(p, p.availableStock)
          );
          this.updateProgress();
        }
      });
      return;
    } else {
      this.updateProductInRequisition(product.id, (p) => 
        WarehouseSupplyHelper.updateSuppliedQuantity(p, p.requestedQuantity)
      );
    }
    
    this.updateProgress();
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
      
      this.updateProductInRequisition(product.id, (p) => 
        WarehouseSupplyHelper.updateSuppliedQuantity(p, p.requestedQuantity)
      );
      event.target.value = product.requestedQuantity.toString();
      return;
    }
    
    if (quantity > product.availableStock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `No hay suficiente stock. Disponible: ${product.availableStock} ${product.unit}`,
        confirmButtonText: 'Entendido'
      });
      
      this.updateProductInRequisition(product.id, (p) => 
        WarehouseSupplyHelper.updateSuppliedQuantity(p, p.availableStock)
      );
      event.target.value = product.availableStock.toString();
      return;
    }
    
    this.updateProductInRequisition(product.id, (p) => 
      WarehouseSupplyHelper.updateSuppliedQuantity(p, quantity)
    );
    this.updateProgress();
  }

  updateReturnQuantity(product: WarehouseProduct, event: any): void {
    const value = event.target.value;
    
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    event.target.value = numericValue;
    
    const quantity = parseInt(numericValue) || 0;
    
    this.updateProductInRequisition(product.id, (p) => 
      WarehouseSupplyHelper.updateReturnQuantity(p, quantity)
    );
  }

  toggleProductSupply(productId: string): void {
    this.updateProductInRequisition(productId, (p) => 
      WarehouseSupplyHelper.toggleProductSupply(p)
    );
    this.updateProgress();
  }

  // Helper para actualizar productos de forma inmutable
  private updateProductInRequisition(
    productId: string,
    updateFn: (product: WarehouseProduct) => WarehouseProduct
  ): void {
    this.requisition.update(req => {
      if (!req) return req;
      
      const updatedProducts = req.products.map(p => 
        p.id === productId ? updateFn(p) : p
      );
      
      const updatedReq = { ...req, products: updatedProducts };
      return WarehouseSupplyHelper.updateRequisitionStats(updatedReq);
    });
    
    // Actualizar agrupación por categoría
    const req = this.requisition();
    if (req) {
      const grouped = WarehouseSupplyHelper.groupProductsByCategory(req.products);
      this.productsByCategory.set(grouped);
    }
  }

  // Actualizar progreso de la sesión
  private updateProgress(): void {
    const req = this.requisition();
    if (!req) return;
    
    this.supplySession.update(session => 
      WarehouseSupplyHelper.updateSupplySessionProgress(session, req.products)
    );
  }



  markReadyForCollection(): void {
    const req = this.requisition();
    if (!req) return;
    
    // Generar un NIP de 4 dígitos aleatorio
    const nip = WarehouseSupplyHelper.generateCollectionNip();
    this.generatedNip.set(nip);
    
    // Mostrar el NIP generado al usuario
    Swal.fire({
      title: '¡Requisición lista para recolección!',
      html: `
        <div class="text-center">
          <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
          <p class="mt-3 mb-2">La requisición <strong>${req.id}</strong> está lista.</p>
          <div class="alert alert-info mt-3">
            <h5 class="mb-2">NIP de recolección generado:</h5>
            <div class="display-4 fw-bold text-primary">${nip}</div>
            <small class="text-muted">Proporcione este NIP al solicitante para la recolección</small>
          </div>
          <p class="text-muted mt-3">El solicitante podrá usar este NIP para recoger los productos.</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#28a745',
      width: '500px'
    }).then(() => {
      console.log('NIP generado para recolección:', nip);
    });
  }

  completeSupply(): void {
    const req = this.requisition();
    if (!req) return;
    
    const allSupplied = req.products.every(p => p.isSupplied);
    
    if (!allSupplied) {
      Swal.fire({
        title: '¿Completar con productos pendientes?',
        text: 'Algunos productos aún no han sido surtidos completamente. ¿Deseas completar el suministro de todas formas?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.openNipModalForCompletion();
        }
      });
      return;
    }
    
    this.openNipModalForCompletion();
  }

  private openNipModalForCompletion(): void {
    // Limpiar estado anterior
    this.enteredNip.set('');
    this.nipError.set('');
    
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('nipModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  validateNipAndProceed(): void {
    const nip = this.enteredNip();
    if (!nip || nip.length < 4) {
      this.nipError.set('Debe ingresar un NIP de 4 dígitos');
      return;
    }

    // Validar contra el NIP generado para recolección
    const currentValidNip = this.generatedNip() || this.validNip;
    
    if (nip !== currentValidNip) {
      this.nipError.set('NIP incorrecto. Intente nuevamente.');
      this.enteredNip.set('');
      setTimeout(() => {
        this.nipError.set('');
      }, 3000);
      return;
    }

    // NIP correcto - cerrar modal y proceder con completar surtido
    const modalElement = document.getElementById('nipModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }

    // Proceder con completar el surtido
    this.finalizeSupply();
  }

  private finalizeSupply(): void {
    const req = this.requisition();
    if (!req) return;
    
    // Simular completar suministro
    console.log('Suministro completado:', {
      requisitionId: req.id,
      completedAt: new Date(),
      suppliedProducts: req.suppliedProducts,
      totalProducts: req.totalProducts
    });
    
    Swal.fire({
      icon: 'success',
      title: '¡Suministro completado!',
      text: 'El suministro ha sido completado exitosamente',
      confirmButtonText: 'Continuar'
    }).then(() => {
      this.goBackToList();
    });
  }

  returnProductsToWarehouse(): void {
    const req = this.requisition();
    if (!req) return;
    
    const productsToReturn = WarehouseSupplyHelper.getProductsToReturn(req.products);
    
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
      confirmButtonColor: '#F4D35E',
      cancelButtonColor: '#5B5B5B',
      width: '600px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Simular devolución de productos
        console.log('Productos devueltos al almacén:', {
          requisitionId: req.id,
          returnedProducts: productsToReturn,
          timestamp: new Date()
        });
        
        // Limpiar cantidades de devolución después del proceso
        this.requisition.update(r => {
          if (!r) return r;
          return {
            ...r,
            products: WarehouseSupplyHelper.clearReturnQuantities(r.products)
          };
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

  // Funciones de utilidad para CSS/clases
  getStockStatusClass(product: WarehouseProduct): string {
    return WarehouseSupplyHelper.getStockStatusClass(product);
  }

  getStatusBadgeClass(product: WarehouseProduct): string {
    return WarehouseSupplyHelper.getStatusBadgeClass(product);
  }

  getStatusText(product: WarehouseProduct): string {
    const status = WarehouseSupplyHelper.getProductStockStatus(product);
    return status.statusText;
  }

  // Funciones de formato
  formatDate(dateString: string): string {
    return WarehouseSupplyHelper.formatDate(dateString);
  }

  formatTime(dateString: string): string {
    return WarehouseSupplyHelper.formatTime(dateString);
  }

  // Navegación
  goBackToList(): void {
    this.router.navigate(['/requisicion/lista']);
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }
}
