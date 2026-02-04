/**
 * ==================================================================================
 * COMPONENTE: Warehouse Supply (Surtido de Requisiciones)
 * ==================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Este componente gestiona el flujo completo de surtido de requisiciones en almacén
 * con sincronización automática a NetSuite.
 * 
 * FLUJO PRINCIPAL DE TRABAJO:
 * ===========================
 * 
 * 1. CARGAR REQUISICIÓN (loadRequisitionData)
 *    GET /api/requisitions/{id}/supply
 *    ↓ Carga datos del backend, mapea estados y agrupa por categoría
 * 
 * 2. SURTIR PRODUCTOS (markReadyForCollection)
 *    POST /api/requisitions/{id}/mark-ready
 *    ↓ Registra delivered_quantity en BD, genera PIN
 *    ℹ️  NetSuite: Pendiente de sincronizar
 * 
 * 3. ENTREGAR CON PIN (finalizeSupply → deliver)
 *    POST /api/requisitions/{id}/deliver
 *    ↓ Valida PIN
 *    ℹ️  NetSuite: Sincroniza si NO hay devolución pendiente
 *    ℹ️  NetSuite: Se diferida si hay devolución pendiente
 * 
 * 4. OPCIÓN A - SIN DEVOLUCIÓN:
 *    Requisición CERRADA
 *    ✅ Inventario NetSuite actualizado con: -(delivered - 0)
 * 
 * 4. OPCIÓN B - CON DEVOLUCIÓN PENDIENTE:
 *    Requisición en espera de devolución
 *    ℹ️  Inventario NetSuite aún no sincronizado
 * 
 * 5. PROCESAR DEVOLUCIÓN (returnProductsToWarehouse)
 *    POST /api/requisitions/{id}/process-return
 *    ↓ Registra returned_quantity, cierra requisición
 *    ✅ Inventario NetSuite actualizado con: -(delivered - returned)
 *    ⚠️  ESTA ACCIÓN SOLO SE PUEDE HACER UNA SOLA VEZ
 * 
 * ==================================================================================
 * SINCRONIZACIÓN CON NETSUITE
 * ==================================================================================
 * 
 * La sincronización ocurre automáticamente en dos momentos:
 * 
 * ESCENARIO 1 - Entrega sin devolución:
 *   deliver() → NetSuite sincroniza inmediatamente
 *   Ajuste: -(delivered_quantity - 0)
 *   Estado final: Entregado (CERRADA)
 * 
 * ESCENARIO 2 - Entrega con devolución pendiente:
 *   deliver() → NetSuite NO sincroniza aún
 *   Estado final: Espera Devolución (ABIERTA)
 *   ↓
 *   processReturn() → NetSuite sincroniza
 *   Ajuste: -(delivered_quantity - returned_quantity)
 *   Estado final: Entregado (CERRADA)
 * 
 * ==================================================================================
 * ESTADOS Y TRANSICIONES
 * ==================================================================================
 * 
 * autorizado
 *     ↓ [markReady] Registra cantidades
 * listo_recoger
 *     ↓ [deliver con PIN] Valida entrega
 *     ├─→ entregado (SIN devolución) ✅ NetSuite sincronizado
 *     └─→ espera_devolucion (CON devolución pendiente) ⏳ NetSuite diferido
 *             ↓ [processReturn] Registra devolución
 *             → entregado (CERRADA) ✅ NetSuite sincronizado
 * 
 * ==================================================================================
 * INFORMACIÓN IMPORTANTE
 * ==================================================================================
 * 
 * ✅ Validación de estado en cada paso
 * ✅ PIN de 4 dígitos para validar entrega
 * ✅ Cantidades registradas en mark-ready (NO en deliver)
 * ✅ NetSuite sincronización automática y no bloqueante
 * ⚠️  Devolución: Una sola vez, luego requisición se cierra
 * ⚠️  Si NetSuite falla, la operación local se completa igualmente
 * 
 * ==================================================================================
 */

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
import { AuthService } from '../../services/auth.service';import { RequisitionService } from '../../services/requisition.service';
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
    // Permitir si hay al menos un producto con nueva cantidad a entregar
    const hasNewDeliveries = req.products.some(p => p.newDeliveryQuantity && p.newDeliveryQuantity > 0);
    console.log('🔍 canComplete - hasNewDeliveries:', hasNewDeliveries);
    return hasNewDeliveries;
  });
  
  hasProductsForReturn = computed(() => {
    const req = this.requisition();
    if (!req) return false;
    return WarehouseSupplyHelper.hasProductsToReturn(req.products);
  });
  
  showReturnColumn = computed(() => {
    const req = this.requisition();
    if (!req) return false;
    // Mostrar columna cuando: espera_devolucion O (parcialmente_entregado/entregado + awaiting_return)
    return req.statusRaw === 'espera_devolucion' || 
           ((req.statusRaw === 'parcialmente_entregado' || req.statusRaw === 'entregado') && req.awaiting_return);
  });
  
  // Computed para control de botones según documentación
  canMarkReady = computed(() => {
    const req = this.requisition();
    console.log('🔍 canMarkReady - req:', req);
    if (!req) return false;
    const result = req.statusRaw === 'autorizado' || req.statusRaw === 'parcialmente_entregado';
    console.log('🔍 canMarkReady - statusRaw:', req.statusRaw, 'result:', result);
    return result;
  });
  
  canDeliver = computed(() => {
    const req = this.requisition();
    console.log('🔍 canDeliver - req:', req);
    if (!req) return false;
    const result = req.statusRaw === 'listo_recoger';
    console.log('🔍 canDeliver - statusRaw:', req.statusRaw, 'result:', result);
    return result;
  });
  
  canProcessReturn = computed(() => {
    const req = this.requisition();
    console.log('🔍 canProcessReturn - req:', req);
    if (!req) return false;
    const allowedStatuses = ['espera_devolucion', 'entregado', 'parcialmente_entregado'];
    const result = allowedStatuses.includes(req.statusRaw) && req.awaiting_return;
    console.log('🔍 canProcessReturn - statusRaw:', req.statusRaw, 'awaiting_return:', req.awaiting_return, 'result:', result);
    return result;
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
    private authService: AuthService,
    private requisitionService: RequisitionService
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
          // Mapear datos de la API usando el helper
          const mappedRequisition = WarehouseSupplyHelper.mapRequisitionFromAPI(
            response.data.requisition
          );
          
          console.log('📦 Requisición cargada:', mappedRequisition);
          console.log('📊 Estado:', mappedRequisition.statusRaw, 'Awaiting Return:', mappedRequisition.awaiting_return);
          
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
          this.requisition.set(null);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
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
    const alreadyDelivered = product.suppliedQuantity || 0;
    const remaining = product.requestedQuantity - alreadyDelivered;
    
    if (remaining <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Producto ya surtido completamente',
        text: `El producto "${product.name}" ya fue surtido completamente (${alreadyDelivered} ${product.unit}).`,
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    if (product.availableStock < remaining) {
      Swal.fire({
        title: 'Stock insuficiente',
        html: `
          <p><strong>${product.name}</strong></p>
          <p>Cantidad pendiente: <strong>${remaining} ${product.unit}</strong></p>
          <p>Disponible: <strong>${product.availableStock} ${product.unit}</strong></p>
          <p>¿Agregar cantidad disponible?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar disponible',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.updateProductInRequisition(product.id, (p) => {
            p.newDeliveryQuantity = Math.min(p.availableStock, remaining);
            return p;
          });
          this.updateProgress();
        }
      });
      return;
    } else {
      this.updateProductInRequisition(product.id, (p) => {
        p.newDeliveryQuantity = remaining;
        return p;
      });
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
    
    // Calcular cuánto ya se entregó y cuánto falta (VALIDACIÓN INCREMENTAL)
    const alreadyDelivered = product.suppliedQuantity || 0;
    const remaining = product.requestedQuantity - alreadyDelivered;
    
    if (quantity > remaining) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad excedida',
        text: `Solo puedes agregar ${remaining} ${product.unit} más (ya entregado: ${alreadyDelivered}, solicitado: ${product.requestedQuantity})`,
        confirmButtonText: 'Entendido'
      });
      
      this.updateProductInRequisition(product.id, (p) => {
        p.newDeliveryQuantity = remaining;
        return p;
      });
      event.target.value = remaining.toString();
      return;
    }
    
    if (quantity > product.availableStock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `No hay suficiente stock. Disponible: ${product.availableStock} ${product.unit}`,
        confirmButtonText: 'Entendido'
      });
      
      const maxCanDeliver = Math.min(product.availableStock, remaining);
      this.updateProductInRequisition(product.id, (p) => {
        p.newDeliveryQuantity = maxCanDeliver;
        return p;
      });
      event.target.value = maxCanDeliver.toString();
      return;
    }
    
    // Guardar en newDeliveryQuantity (cantidad a AGREGAR, no total)
    this.updateProductInRequisition(product.id, (p) => {
      p.newDeliveryQuantity = quantity;
      return p;
    });
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



  /**
   * Paso 4: Marcar como lista para recoger
   * POST /api/requisitions/{id}/mark-ready
   */
  markReadyForCollection(): void {
    const req = this.requisition();
    if (!req) return;
    
    // Verificar que haya productos con nueva entrega
    const productsToDeliver = req.products.filter(p => p.newDeliveryQuantity && p.newDeliveryQuantity > 0);
    
    if (productsToDeliver.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos para entregar',
        text: 'Debes agregar al menos un producto con cantidad a entregar',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    Swal.fire({
      title: '¿Marcar como lista para recolección?',
      text: `Se registrarán ${productsToDeliver.length} producto(s) y se generará un PIN para validar la entrega.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como lista',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Preparar array de items con cantidades NUEVAS a agregar (incremental)
        const items = this.filteredProducts().map((product: WarehouseProduct) => ({
          item_id: parseInt(product.id, 10),
          delivered_quantity: product.newDeliveryQuantity || 0
        }));
        
        // Mostrar loading
        Swal.fire({
          title: 'Procesando...',
          text: 'Registrando cantidades y generando PIN...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al endpoint con items
        this.requisitionService.markReady(req.id, items).subscribe({
          next: (response) => {
            if (response.success) {
              const data = response.data;
              
              Swal.fire({
                icon: 'success',
                title: '¡Lista para Recolección!',
                html: `
                  <div class="text-start">
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Estado:</strong> <span class="badge bg-success">${data.current_status}</span></p>
                    <p><strong>Fecha de Preparación:</strong> ${new Date(data.ready_at).toLocaleString('es-MX')}</p>
                    <hr>
                    <div class="alert alert-info mb-0 mt-3">
                      <h5 class="mb-2"><i class="bi bi-key-fill me-2"></i>PIN de Recolección</h5>
                      <p class="mb-2">El solicitante usará este PIN para recoger:</p>
                      <div class="text-center">
                        <h1 class="display-3 fw-bold text-primary mb-0" style="letter-spacing: 0.5rem;">${data.pin}</h1>
                      </div>
                      <small class="text-muted d-block mt-2">
                        <i class="bi bi-info-circle me-1"></i>
                        ${data.pickup_person ? `Recogerá: ${data.pickup_person.full_name}` : 'Comparte este PIN con quien recogerá'}
                      </small>
                    </div>
                    <div class="alert alert-light mt-3 mb-0 text-muted">
                      <small>
                        <i class="bi bi-database me-1"></i>
                        ✅ Datos guardados en base de datos<br>
                        <i class="bi bi-cloud me-1"></i>
                        ⏳ NetSuite se sincronizará al confirmar la entrega
                      </small>
                    </div>
                  </div>
                `,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#28a745',
                width: '600px'
              }).then(() => {
                this.goBackToList();
              });
            }
          },
          error: (error) => {
            let errorMessage = 'No se pudo marcar la requisición como lista';
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      }
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

    // Cerrar modal y enviar al backend para validación
    const modalElement = document.getElementById('nipModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }

    // Proceder con completar el surtido (backend validará el PIN)
    this.finalizeSupply();
  }

  /**
   * ENTREGA FINAL CON VALIDACIÓN PIN Y SINCRONIZACIÓN NETSUITE
   * ===========================================================
   * Paso 5.1: Si NO hay devolución pendiente
   * POST /api/requisitions/{id}/deliver
   * 
   * DESCRIPCIÓN:
   * Valida el PIN y completa la entrega al usuario final.
   * Las cantidades ya fueron registradas en markReady().
   * 
   * IMPORTANTE - SINCRONIZACIÓN CON NETSUITE:
   * ✅ SI awaiting_return = false (entrega normal):
   *    - Se ejecuta sincronización automática con NetSuite
   *    - Se crean Inventory Adjustments con: -(delivered_quantity - 0)
   *    - Inventario de NetSuite se reduce por lo entregado
   *    - Response incluye campo netsuite_sync con resultado:
   *      {
   *        "success": true,
   *        "adjustments_created": 2,
   *        "items_synced": 5,
   *        "error": null
   *      }
   * 
   * ❌ SI awaiting_return = true (en espera de devolución):
   *    - NO se sincroniza con NetSuite
   *    - Inventario no se ajusta todavía
   *    - Sincronización ocurre cuando se procese la devolución (process-return)
   *    - Response NO incluye campo netsuite_sync
   * 
   * VALIDACIÓN:
   * - El PIN debe ser exacto (case-sensitive)
   * - La requisición debe estar en "listo_recoger"
   * 
   * RESPUESTA EXITOSA (sin devolución):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "REQ-0004",
   *     "status": "Entregado",
   *     "delivered_at": "2026-01-05T15:30:22-06:00",
   *     "awaiting_return": false,
   *     "netsuite_sync": {
   *       "success": true,
   *       "adjustments_created": 2,
   *       "items_synced": 5,
   *       "error": null
   *     }
   *   }
   * }
   * 
   * RESPUESTA EXITOSA (con devolución pendiente):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "REQ-0004",
   *     "status": "Espera Devolución",
   *     "delivered_at": "2026-01-05T15:30:22-06:00",
   *     "awaiting_return": true
   *     // ⚠️ NO incluye netsuite_sync
   *   }
   * }
   */
  private finalizeSupply(): void {
    const req = this.requisition();
    if (!req) return;
    
    const nip = this.enteredNip();
    
    // Mostrar loading
    Swal.fire({
      title: 'Completando suministro...',
      text: 'Validando PIN y sincronizando con NetSuite...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Llamar al endpoint de entrega (solo envía PIN, las cantidades ya fueron guardadas en mark-ready)
    this.requisitionService.deliver(req.id, nip).subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data;
          
          let itemsHtml = '';
          if (data.items_delivered && data.items_delivered.length > 0) {
            itemsHtml = '<div class="mt-3"><h6>Productos entregados:</h6><ul class="list-unstyled text-start">';
            data.items_delivered.forEach((item: any) => {
              itemsHtml += `<li class="mb-1"><small>Item ${item.item_id}: ${item.delivered} de ${item.requested} unidades</small></li>`;
            });
            itemsHtml += '</ul></div>';
          }
          
          let netsuiteStatusHtml = '';
          if (data.netsuite_sync) {
            if (data.netsuite_sync.success) {
              netsuiteStatusHtml = `
                <div class="alert alert-success mt-3 mb-0">
                  <i class="bi bi-check-circle-fill me-2"></i>
                  <strong>NetSuite Sincronizado:</strong> ${data.netsuite_sync.adjustments_created} ajustes creados, ${data.netsuite_sync.items_synced} items sincronizados
                </div>
              `;
            } else {
              netsuiteStatusHtml = `
                <div class="alert alert-warning mt-3 mb-0">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Advertencia NetSuite:</strong> ${data.netsuite_sync.error || 'Error desconocido'}
                  <br><small>La requisición se completó localmente. Verificar sincronización manualmente.</small>
                </div>
              `;
            }
          } else if (data.awaiting_return) {
            netsuiteStatusHtml = `
              <div class="alert alert-info mt-3 mb-0">
                <i class="bi bi-hourglass-split me-2"></i>
                <strong>Devolución Pendiente:</strong> NetSuite se sincronizará cuando se procese la devolución
              </div>
            `;
          }
          
          // Manejar respuesta según estado resultante
          const status = data.status;
          if (status === 'Parcialmente Entregado') {
            Swal.fire({
              icon: 'info',
              title: 'Entrega Parcial Completada',
              html: `
                <div class="text-start">
                  <p class="mb-3">Algunos productos no fueron entregados en esta ocasión.</p>
                  <p><strong>ID:</strong> ${data.id}</p>
                  <p><strong>Estado:</strong> <span class="badge bg-warning text-dark">${status}</span></p>
                  <p><strong>Entregado el:</strong> ${new Date(data.delivered_at).toLocaleString('es-MX')}</p>
                  ${data.pickup_person ? `<p><strong>Recogido por:</strong> ${data.pickup_person.full_name}</p>` : ''}
                  ${itemsHtml}
                  ${netsuiteStatusHtml}
                  <div class="alert alert-info mt-3 mb-0">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Podrás completar la entrega de los productos faltantes cuando haya stock disponible
                  </div>
                </div>
              `,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#ffc107'
            }).then(() => {
              this.loadRequisitionData(this.requisitionId());
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: '¡Suministro Completado!',
              html: `
                <div class="text-start">
                  <p><strong>ID:</strong> ${data.id}</p>
                  <p><strong>Estado:</strong> <span class="badge bg-success">${status}</span></p>
                  <p><strong>Entregado el:</strong> ${new Date(data.delivered_at).toLocaleString('es-MX')}</p>
                  ${data.pickup_person ? `<p><strong>Recogido por:</strong> ${data.pickup_person.full_name}</p>` : ''}
                  ${itemsHtml}
                  ${netsuiteStatusHtml}
                  ${data.awaiting_return ? '<div class="alert alert-warning mt-3 mb-0"><small><i class="bi bi-arrow-return-left me-1"></i>Se espera devolución de productos</small></div>' : ''}
                </div>
              `,
              confirmButtonText: 'Continuar',
              confirmButtonColor: '#28a745'
            }).then(() => {
              this.goBackToList();
            });
          }
        }
      },
      error: (error) => {
        // Cerrar el loading primero
        Swal.close();
        
        let errorMessage = 'No se pudo completar el suministro';
        let errorTitle = 'Error';
        let allowRetry = false;
        
        // Obtener mensaje del backend
        if (error.message) {
          errorMessage = error.message;
        }
        
        // Manejo específico para PIN incorrecto
        // El error viene como Error.message después del handleError del servicio
        if (error.message && error.message.includes('PIN incorrecto')) {
          errorTitle = 'PIN Incorrecto';
          errorMessage = `El PIN que ingresaste (${this.enteredNip()}) no coincide con el PIN de la requisición.\n\n¿Deseas intentar nuevamente?`;
          allowRetry = true;
        } else if (error.message && error.message.includes('Estado')) {
          errorTitle = 'Estado Inválido';
          errorMessage = error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: errorTitle,
          html: errorMessage.replace(/\n/g, '<br>'),
          showCancelButton: allowRetry,
          confirmButtonText: allowRetry ? 'Sí, reintentar' : 'Entendido',
          cancelButtonText: allowRetry ? 'Cancelar' : undefined,
          confirmButtonColor: allowRetry ? '#007bff' : '#dc3545',
          cancelButtonColor: '#6c757d'
        }).then((result) => {
          if (result.isConfirmed && allowRetry) {
            // Limpiar el PIN y reabrir modal para reintentar
            this.enteredNip.set('');
            this.nipError.set('');
            this.openNipModalForCompletion();
          }
        });
      }
    });
  }

  /**
   * PROCESAR DEVOLUCIÓN CON SINCRONIZACIÓN NETSUITE
   * ===============================================
   * Paso 5.2: Si hay devolución pendiente
   * POST /api/requisitions/{id}/process-return
   * 
   * DESCRIPCIÓN:
   * Registra los productos devueltos y sincroniza con NetSuite.
   * 
   * IMPORTANTE - CARACTERÍSTICAS CRÍTICAS:
   * ⚠️  ESTA OPERACIÓN SOLO SE PUEDE REALIZAR UNA SOLA VEZ
   * 
   * FLUJO DE SINCRONIZACIÓN CON NETSUITE:
   * ✅ Se ejecuta sincronización automática con NetSuite
   * 
   * CÁLCULO DE AJUSTE:
   * Formula: adjustQtyBy = -(delivered_quantity - returned_quantity)
   * 
   * Ejemplo 1 - Devolución Total (10 entregados, 10 devueltos):
   *   -(10 - 10) = 0 → No se crea ajuste (filtrado automáticamente)
   *   Inventario NetSuite: Sin cambios
   * 
   * Ejemplo 2 - Devolución Parcial (10 entregados, 4 devueltos):
   *   -(10 - 4) = -6 → Se reduce inventario en 6 unidades
   *   Inventario NetSuite: Reduce 6 unidades (neto consumido)
   * 
   * Ejemplo 3 - Sin Devolución (10 entregados, 0 devueltos):
   *   -(10 - 0) = -10 → Se reduce inventario en 10 unidades
   *   Inventario NetSuite: Reduce 10 unidades (consumo total)
   * 
   * VALIDACIONES:
   * - La requisición debe estar en "espera_devolucion"
   * - Cada item: returned_quantity ≤ delivered_quantity
   * - NO se pueden procesar devoluciones si ya está "entregado" (ya fue procesada)
   * 
   * RESPUESTA EXITOSA:
   * {
   *   "success": true,
   *   "message": "Devolución procesada exitosamente - Requisición cerrada",
   *   "data": {
   *     "id": "REQ-0004",
   *     "previous_status": "Espera Devolución",
   *     "current_status": "Entregado",  // ← CERRADA después de esto
   *     "processed_at": "2026-01-05T16:45:12-06:00",
   *     "items_returned": [...],
   *     "return_notes": "...",
   *     "netsuite_sync": {
   *       "success": true,
   *       "adjustments_created": 2,
   *       "items_synced": 5,
   *       "error": null
   *     }
   *   }
   * }
   * 
   * DESPUÉS DE PROCESAR:
   * - Estado cambia a "Entregado" (CERRADA)
   * - NO se permiten más devoluciones (próximo intento → Error 400)
   * - awaiting_return se establece en false
   */
  returnProductsToWarehouse(): void {
    const req = this.requisition();
    if (!req) return;
    
    // Obtener TODOS los productos que fueron entregados (con o sin devolución)
    const productsDelivered = req.products.filter(p => p.suppliedQuantity && p.suppliedQuantity > 0);
    
    if (productsDelivered.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay productos entregados',
        text: 'No se puede procesar devolución porque no hay productos entregados.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Calcular productos con devolución
    const productsToReturn = WarehouseSupplyHelper.getProductsToReturn(req.products);
    const hasReturns = productsToReturn.length > 0;

    let returnListHtml = '<div class="text-start">';
    
    if (hasReturns) {
      returnListHtml += '<h6>Productos a devolver:</h6><ul class="list-unstyled">';
      productsToReturn.forEach(product => {
        returnListHtml += `<li class="mb-2">
          <strong>${product.name}</strong><br>
          <small class="text-muted">Devolver: ${product.returnQuantity} ${product.unit}</small>
        </li>`;
      });
      returnListHtml += '</ul>';
    } else {
      returnListHtml += '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i><strong>Sin devoluciones:</strong> Se cerrará la requisición sin devolver productos.</div>';
    }
    
    returnListHtml += '</div>';

    Swal.fire({
      title: '¿Confirmar devolución al almacén?',
      html: `
        ${returnListHtml}
        <div class="alert alert-warning mt-3 mb-0">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>⚠️ IMPORTANTE - ACCIÓN IRREVERSIBLE:</strong>
          <ul class="mb-0 mt-2">
            <li>Esta devolución se puede procesar <strong>UNA SOLA VEZ</strong></li>
            <li>Después de confirmar, la requisición se cerrará</li>
            <li>NetSuite se sincronizará automáticamente</li>
            <li>NO se permiten devoluciones adicionales</li>
          </ul>
        </div>
      `,
      input: 'textarea',
      inputPlaceholder: 'Notas sobre la devolución (opcional)',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, procesar devolución',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#F4D35E',
      cancelButtonColor: '#5B5B5B',
      width: '650px'
    }).then((result) => {
      if (result.isConfirmed) {
        const notes = result.value?.trim() || undefined;
        
        // Preparar items para la devolución (incluir TODOS los entregados, incluso con returned=0)
        const items = productsDelivered.map(product => ({
          item_id: parseInt(product.id),
          returned_quantity: product.returnQuantity || 0
        }));
        
        // Mostrar loading
        Swal.fire({
          title: 'Procesando devolución...',
          text: 'Registrando productos y sincronizando con NetSuite...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al endpoint
        this.requisitionService.processReturn(req.id, items, notes).subscribe({
          next: (response) => {
            if (response.success) {
              const data = response.data;
              
              let itemsHtml = '<div class="mt-3"><h6>Productos devueltos:</h6><ul class="list-unstyled text-start">';
              if (data.items_returned) {
                data.items_returned.forEach((item: any) => {
                  const cantidadConsumida = item.delivered - item.returned_quantity;
                  itemsHtml += `<li class="mb-2">
                    <small>
                      <strong>Item ${item.item_id}:</strong> 
                      Devuelto: ${item.returned_quantity} de ${item.delivered} entregados
                      ${cantidadConsumida > 0 ? ` | <span class="text-danger">Consumido: ${cantidadConsumida}</span>` : ''}
                    </small>
                  </li>`;
                });
              }
              itemsHtml += '</ul></div>';
              
              let netsuiteHtml = '';
              if (data.netsuite_sync) {
                if (data.netsuite_sync.success) {
                  netsuiteHtml = `
                    <div class="alert alert-success mt-3">
                      <i class="bi bi-check-circle-fill me-2"></i>
                      <strong>NetSuite Sincronizado Exitosamente</strong>
                      <br><small>${data.netsuite_sync.adjustments_created} ajustes creados, ${data.netsuite_sync.items_synced} items procesados</small>
                    </div>
                  `;
                } else {
                  netsuiteHtml = `
                    <div class="alert alert-warning mt-3">
                      <i class="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Advertencia de Sincronización</strong>
                      <br><small>${data.netsuite_sync.error || 'Error en NetSuite'}</small>
                      <br><small class="text-muted">⚠️ La devolución se registró localmente. Verificar sincronización manualmente.</small>
                    </div>
                  `;
                }
              }
              
              Swal.fire({
                icon: 'success',
                title: '¡Devolución Procesada Exitosamente!',
                html: `
                  <div class="text-start">
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Estado Anterior:</strong> ${data.previous_status}</p>
                    <p><strong>Estado Actual:</strong> <span class="badge bg-success">${data.current_status}</span></p>
                    <p><strong>Procesado el:</strong> ${new Date(data.processed_at).toLocaleString('es-MX')}</p>
                    ${data.return_notes ? `<p><strong>Notas:</strong> ${data.return_notes}</p>` : ''}
                    ${itemsHtml}
                    ${netsuiteHtml}
                    <div class="alert alert-info mt-3 mb-0">
                      <i class="bi bi-check-circle-fill me-2"></i>
                      ✅ La requisición ha sido cerrada. No se permiten devoluciones adicionales.
                    </div>
                  </div>
                `,
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#28a745'
              }).then(() => {
                this.goBackToList();
              });
            }
          },
          error: (error) => {
            let errorMessage = 'No se pudo procesar la devolución';
            if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            // Mensaje específico si ya fue procesada
            if (error.error?.error?.code === 'INVALID_STATUS' && error.error?.error?.current_status === 'Entregado') {
              errorMessage = 'Esta requisición ya procesó su devolución y está cerrada. No se permiten devoluciones adicionales.';
            }
            
            Swal.fire({
              icon: 'error',
              title: 'Error en Devolución',
              text: errorMessage,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#dc3545'
            });
          }
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
