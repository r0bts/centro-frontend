import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ContentMenu } from '../content-menu/content-menu';
import { RequisitionService, RequisitionProduct, Project as BackendProject, RequisitionArea, Location } from '../../services/requisition.service';
import Swal from 'sweetalert2';

export interface Event {
  id: string;
  name: string;
  date: Date;
}

// Project con fecha como Date (convertida del backend)
export interface Project {
  id: string;
  name: string;
  date: Date;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  actions: string;
}

export interface RequisitionSummary {
  area: string;
  areaId?: string; // ID del área para enviar al backend
  products: Product[];
}

@Component({
  selector: 'app-requisition',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './requisition.html',
  styleUrls: ['./requisition.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequisitionComponent implements OnInit, OnDestroy {
  activeSection: string = 'requisicion';
  
  // 🔥 Control de flujo de validación secuencial
  locationIdFromStorage: string = '0';
  isLocationLocked: boolean = false;
  
  // Propiedad para devolución
  isDevolucion: boolean = false;
  
  // Propiedad para unidad de negocio/trabajo
  businessUnit: string = '';
  
  // IDs seleccionados para enviar al backend
  selectedLocationId?: string;
  selectedProjectId?: string;
  selectedDepartmentId?: string;
  
  // Propiedades para fechas (OBLIGATORIO)
  selectedEvent: string = '';
  customDeliveryDate: string = '';
  deliveryTime: string = '08:00'; // Un solo campo de hora para ambas opciones
  currentDeliveryDate: Date | null = null;

  constructor(
    private router: Router,
    private requisitionService: RequisitionService,
    private cdr: ChangeDetectorRef
  ) {
    // Verificar si vienen datos del estado de navegación (desde confirmation)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['loadExistingData']) {
      this.loadExistingRequisitionData(navigation.extras.state);
    }
    // Verificar si vienen datos de una plantilla frecuente
    if (navigation?.extras.state?.['loadFromTemplate']) {
      this.loadTemplateData(navigation.extras.state);
    }
  }
  
  // Propiedades para área
  selectedArea: string = '';
  areaSearchTerm: string = '';
  showAreaDropdown: boolean = false;
  filteredAreas: string[] = [];
  selectedAreaIndex: number = -1; // 🔥 Índice para navegación por teclado
  
  // Propiedades para modal de cambio de área
  showAreaChangeModal: boolean = false;
  pendingAreaChange: string = '';
  currentAreaWithProducts: string = '';
  preventBlurProcessing: boolean = false;
  
    // Propiedades para producto
  selectedProduct: string = '';
  productSearchTerm: string = '';
  showProductDropdown: boolean = false;
  filteredProducts: string[] = [];
  selectedProductIndex: number = -1; // 🔥 Índice para navegación por teclado
  currentQuantity: string = '';
  isResumeCollapsed: boolean = false;

  // ✅ Datos del backend (se cargan en ngOnInit)
  backendProducts: RequisitionProduct[] = []; // Catálogo completo de productos del backend
  productNames: string[] = []; // Nombres para búsqueda
  selectedProductData: RequisitionProduct | null = null; // Producto seleccionado completo
  
  // ⚡ Optimizaciones de rendimiento
  private productMap: Map<string, RequisitionProduct> = new Map(); // Map indexado para búsqueda O(1)
  private productSearchSubject = new Subject<string>();
  private areaSearchSubject = new Subject<string>();
  
  projects: Project[] = []; // Proyectos/eventos del backend (141)
  
  backendAreas: RequisitionArea[] = []; // Áreas del backend (78)
  areas: string[] = []; // Nombres de áreas para compatibilidad con código existente
  
  locations: Location[] = []; // Locaciones (GLACIAR, HERMES)
  
  // Estado de carga
  isLoadingFormData: boolean = false;

  // Productos temporales del área actual
  products: Product[] = [];

  // Resumen de requisiciones por área (inicialmente vacío)
  requisitionSummary: RequisitionSummary[] = [];

  ngOnInit(): void {
    // 🔥 PASO 1: Verificar location_id del localStorage
    const storedLocationId = localStorage.getItem('location_id');
    
    if (storedLocationId) {
      this.locationIdFromStorage = storedLocationId;
      
      // Si tiene location_id y NO es '0', bloquear el select
      if (this.locationIdFromStorage !== '0') {
        this.isLocationLocked = true;
        console.log('🔒 Locación bloqueada desde localStorage:', this.locationIdFromStorage);
      }
    }
    
    // Cargar productos del área inicial si ya existen
    this.loadProductsForArea();
    
    // ✅ Cargar datos del backend
    this.loadFormData();
    
    // ⚡ Configurar debounce para búsquedas
    this.setupSearchDebounce();
  }
  
  /**
   * ⚡ Configurar debounce para optimizar búsquedas
   */
  private setupSearchDebounce(): void {
    // Debounce para búsqueda de productos (300ms)
    this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performProductSearch(searchTerm);
      this.cdr.markForCheck();
    });
    
    // Debounce para búsqueda de áreas (300ms)
    this.areaSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performAreaSearch(searchTerm);
      this.cdr.markForCheck();
    });
  }
  
  /**
   * ⚡ Ejecuta la búsqueda de productos (llamada después del debounce)
   */
  private performProductSearch(searchTerm: string): void {
    const availableProductsForArea = this.getAvailableProductsForCurrentArea();
    
    if (searchTerm.trim() === '') {
      this.filteredProducts = availableProductsForArea;
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      this.filteredProducts = availableProductsForArea.filter(product => 
        product.toLowerCase().includes(lowerSearch)
      );
    }
  }
  
  /**
   * ⚡ Ejecuta la búsqueda de áreas (llamada después del debounce)
   */
  private performAreaSearch(searchTerm: string): void {
    if (searchTerm.trim() === '') {
      this.filteredAreas = this.areas;
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      this.filteredAreas = this.areas.filter(area => 
        area.toLowerCase().includes(lowerSearch)
      );
    }
  }

  /**
   * Carga todos los datos del formulario desde el backend
   * - 651 productos
   * - 141 proyectos/eventos
   * - 78 áreas
   * - 2 locaciones (GLACIAR, HERMES)
   */
  loadFormData(): void {
    this.isLoadingFormData = true;
    
    Swal.fire({
      title: 'Cargando datos...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.requisitionService.getFormData().subscribe({
      next: (response) => {
        if (response.success) {
          // ⚡ PRIORIDAD 1: Cargar locaciones PRIMERO (solo 2, instantáneo)
          this.locations = response.data.locations;
          this.cdr.markForCheck(); // Actualizar UI inmediatamente con locaciones
          
          // ⚡ PRIORIDAD 2: Cargar proyectos/eventos (141) - necesarios para fechas
          this.projects = response.data.projects.map(project => ({
            ...project,
            date: new Date(project.date) // Convertir string a Date
          }));
          this.cdr.markForCheck();
          
          // ⚡ PRIORIDAD 3: Cargar áreas (78)
          this.backendAreas = response.data.areas;
          this.areas = this.backendAreas.map(a => a.name);
          this.filteredAreas = this.areas;
          this.cdr.markForCheck();
          
          // ⚡ PRIORIDAD 4: Cargar productos (651) - procesamiento más pesado
          this.backendProducts = response.data.products;
          this.productNames = this.backendProducts.map(p => p.name);
          this.filteredProducts = this.productNames;
          
          // ⚡ Crear Map indexado para búsqueda O(1) - proceso intensivo
          this.productMap.clear();
          this.backendProducts.forEach(product => {
            this.productMap.set(product.name, product);
          });
          
          Swal.close();
          this.isLoadingFormData = false;
          
          // 🔥 Auto-seleccionar locación si está bloqueada
          if (this.isLocationLocked && this.locationIdFromStorage) {
            const location = this.locations.find(loc => loc.id === this.locationIdFromStorage);
            if (location) {
              this.businessUnit = location.name;
              this.selectedLocationId = location.id;
              console.log('✅ Locación auto-seleccionada:', location.name);
              this.onLocationChange();
            }
          }
          
          this.cdr.markForCheck(); // ⚡ Marcar para detección de cambios final
          
          console.log('✅ Datos del formulario cargados:', {
            productos: this.backendProducts.length,
            proyectos: this.projects.length,
            areas: this.backendAreas.length,
            locaciones: this.locations.length
          });
        }
      },
      error: (error) => {
        this.isLoadingFormData = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          text: error.message || 'No se pudieron cargar los datos del formulario',
          confirmButtonText: 'Entendido'
        });
        console.error('❌ Error cargando datos del formulario:', error);
      }
    });
  }

  loadExistingRequisitionData(state: any): void {
    // Cargar los datos existentes de la requisición
    if (state['requisitionSummary']) {
      this.requisitionSummary = state['requisitionSummary'];
    }
    
    // Cargar la fecha de entrega
    if (state['deliveryDate']) {
      this.currentDeliveryDate = new Date(state['deliveryDate']);
      this.customDeliveryDate = this.formatDateForInput(this.currentDeliveryDate);
    }
    
    // Cargar el estado de devolución
    if (state['isDevolucion'] !== undefined) {
      this.isDevolucion = state['isDevolucion'];
    }
    
    // Cargar la unidad de negocio
    if (state['businessUnit']) {
      this.businessUnit = state['businessUnit'];
    }
    
    // Cargar el evento seleccionado si existe
    if (state['selectedEventId']) {
      this.selectedEvent = state['selectedEventId'];
      // Si hay un evento seleccionado, establecer automáticamente el área "Eventos"
      if (this.selectedEvent) {
        this.selectedArea = 'Eventos';
        this.areaSearchTerm = 'Eventos';
        this.loadProductsForArea();
      }
    }
    
    // Mostrar mensaje de carga exitosa
    console.log('Datos cargados desde confirmación:', {
      areas: this.requisitionSummary.length,
      deliveryDate: this.currentDeliveryDate,
      selectedEmployee: state['selectedEmployee'],
      isDevolucion: this.isDevolucion,
      selectedEvent: this.selectedEvent,
      businessUnit: this.businessUnit
    });
  }

  loadTemplateData(state: any): void {
    // Cargar los datos de la plantilla frecuente
    if (state['templateData']) {
      this.requisitionSummary = JSON.parse(JSON.stringify(state['templateData']));
      
      console.log('Plantilla cargada:', {
        templateName: state['templateName'],
        areas: this.requisitionSummary.length
      });
      
      // Opcional: Mostrar notificación al usuario
      if (state['templateName']) {
        // Aquí podrías mostrar un toast o mensaje indicando que se cargó la plantilla
        console.log(`Plantilla "${state['templateName']}" cargada exitosamente`);
      }
    }
  }

  formatDateForInput(date: Date): string {
    // Formatear fecha para el input type="date" (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  }

  onAreaChange(): void {
    console.log('Área seleccionada:', this.selectedArea);
    this.loadProductsForArea();
  }

  onAreaSearch(): void {
    this.showAreaDropdown = true;
    this.selectedAreaIndex = -1; // Reset índice al escribir
    // ⚡ Usar Subject para debounce (optimiza búsqueda)
    this.areaSearchSubject.next(this.areaSearchTerm);
  }

  selectArea(area: string): void {
    // Verificar si hay cambios sin guardar en el área actual
    if (this.hasUnsavedChanges() && this.selectedArea && this.selectedArea !== area) {
      // Hay cambios sin guardar, mostrar modal de confirmación
      this.pendingAreaChange = area;
      this.currentAreaWithProducts = this.selectedArea;
      this.showAreaChangeModal = true;
      this.preventBlurProcessing = true; // Evitar que onAreaBlur procese
      return;
    }
    
    // Si no hay cambios o es la misma área, cambiar normalmente
    this.selectedArea = area;
    this.areaSearchTerm = area;
    this.showAreaDropdown = false;
    this.preventBlurProcessing = true; // Evitar que onAreaBlur procese
    this.onAreaChange();
    this.cdr.markForCheck(); // ⚡ Marcar para detección de cambios
  }

  onAreaFocus(): void {
    this.showAreaDropdown = true;
    this.selectedAreaIndex = -1; // Reset índice al abrir
    this.filteredAreas = this.areas;
  }

  /**
   * 🔥 Maneja la navegación por teclado en el input de área
   */
  onAreaKeydown(event: KeyboardEvent): void {
    if (!this.showAreaDropdown || this.filteredAreas.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedAreaIndex = Math.min(this.selectedAreaIndex + 1, this.filteredAreas.length - 1);
        this.scrollToSelectedArea();
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.selectedAreaIndex = Math.max(this.selectedAreaIndex - 1, -1);
        this.scrollToSelectedArea();
        break;
      
      case 'Enter':
        event.preventDefault();
        if (this.selectedAreaIndex >= 0 && this.selectedAreaIndex < this.filteredAreas.length) {
          this.selectArea(this.filteredAreas[this.selectedAreaIndex]);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        this.showAreaDropdown = false;
        this.selectedAreaIndex = -1;
        break;
    }
  }

  /**
   * Scroll automático al elemento seleccionado en el dropdown de áreas
   */
  private scrollToSelectedArea(): void {
    setTimeout(() => {
      const dropdown = document.querySelector('.area-dropdown');
      const selectedItem = dropdown?.querySelector('.dropdown-item.active');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  /**
   * 🔥 Maneja la navegación por teclado en el input de producto
   */
  onProductKeydown(event: KeyboardEvent): void {
    if (!this.showProductDropdown || this.filteredProducts.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedProductIndex = Math.min(this.selectedProductIndex + 1, this.filteredProducts.length - 1);
        this.scrollToSelectedProduct();
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.selectedProductIndex = Math.max(this.selectedProductIndex - 1, -1);
        this.scrollToSelectedProduct();
        break;
      
      case 'Enter':
        event.preventDefault();
        if (this.selectedProductIndex >= 0 && this.selectedProductIndex < this.filteredProducts.length) {
          this.selectProduct(this.filteredProducts[this.selectedProductIndex]);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        this.showProductDropdown = false;
        this.selectedProductIndex = -1;
        break;
    }
  }

  /**
   * Scroll automático al elemento seleccionado en el dropdown de productos
   */
  private scrollToSelectedProduct(): void {
    setTimeout(() => {
      const dropdown = document.querySelector('.product-dropdown');
      const selectedItem = dropdown?.querySelector('.dropdown-item.active');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  onAreaBlur(): void {
    setTimeout(() => {
      // Si se está previniendo el procesamiento del blur, reset la bandera y salir
      if (this.preventBlurProcessing) {
        this.preventBlurProcessing = false;
        return;
      }
      
      this.selectedAreaIndex = -1; // Reset índice al cerrar
      this.showAreaDropdown = false;
      const exactMatch = this.areas.find(area => 
        area.toLowerCase() === this.areaSearchTerm.toLowerCase()
      );
      
      if (exactMatch) {
        // Encontró coincidencia exacta, verificar si hay cambios sin guardar
        if (this.hasUnsavedChanges() && this.selectedArea && this.selectedArea !== exactMatch) {
          // Hay cambios sin guardar, mostrar modal de confirmación
          this.pendingAreaChange = exactMatch;
          this.currentAreaWithProducts = this.selectedArea;
          this.showAreaChangeModal = true;
          return;
        }
        // Si no hay cambios o es la misma área, cambiar normalmente
        this.selectedArea = exactMatch;
        this.onAreaChange();
      } else {
        this.selectedArea = '';
        this.areaSearchTerm = '';
      }
    }, 200);
  }

  onProductSearch(): void {
    this.showProductDropdown = true;
    this.selectedProductIndex = -1; // Reset índice al escribir
    // ⚡ Usar Subject para debounce (optimiza búsqueda)
    this.productSearchSubject.next(this.productSearchTerm);
  }

  selectProduct(product: string): void {
    this.productSearchTerm = product;
    this.showProductDropdown = false;
    
    // ⚡ Buscar usando Map indexado (O(1) en lugar de O(n))
    this.selectedProductData = this.productMap.get(product) || null;
    
    if (this.selectedProductData) {
      console.log('Producto seleccionado:', {
        id: this.selectedProductData.id,
        name: this.selectedProductData.name,
        unit: this.selectedProductData.unit,
        code: this.selectedProductData.code
      });
    }
  }

  onProductFocus(): void {
    this.showProductDropdown = true;
    this.selectedProductIndex = -1; // Reset índice al abrir
    this.filteredProducts = this.getAvailableProductsForCurrentArea();
  }

  onProductBlur(): void {
    setTimeout(() => {
      this.selectedProductIndex = -1; // Reset índice al cerrar
      this.showProductDropdown = false;
      const availableProductsForArea = this.getAvailableProductsForCurrentArea();
      const exactMatch = availableProductsForArea.find(product => 
        product.toLowerCase() === this.productSearchTerm.toLowerCase()
      );
      if (exactMatch) {
        this.productSearchTerm = exactMatch;
      } else {
        this.productSearchTerm = '';
      }
    }, 200);
  }

  loadProductsForArea(): void {
    // Si no hay área seleccionada, limpiar productos
    if (!this.selectedArea) {
      this.products = [];
      return;
    }
    
    // Buscar si ya existe una requisición para esta área
    const existingRequisition = this.requisitionSummary.find(req => req.area === this.selectedArea);
    
    if (existingRequisition) {
      // Si existe, hacer una copia profunda de los productos para evitar modificar el original
      this.products = existingRequisition.products.map(product => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unit: product.unit,
        actions: product.actions
      }));
    } else {
      // Si no existe, limpiar la lista de productos
      this.products = [];
    }
  }

  onSearchProduct(): void {
    console.log('Buscar producto:', this.productSearchTerm);
  }

  onAddProduct(): void {
    // Validar que haya producto seleccionado
    if (!this.selectedProductData) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un producto',
        text: 'Debes seleccionar un producto válido de la lista',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // Validar que el producto no esté ya agregado en el área actual
    const productAlreadyExists = this.products.some(product => 
      product.name.toLowerCase() === this.selectedProductData!.name.toLowerCase()
    );
    
    if (productAlreadyExists) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto duplicado',
        text: 'Este producto ya está agregado en el área actual',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // Validar que haya cantidad y que sea mayor a 0
    const quantity = parseInt(this.currentQuantity);
    if (!this.currentQuantity.trim() || isNaN(quantity) || quantity <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'Debes ingresar una cantidad mayor a 0',
        confirmButtonText: 'Entendido'
      });
      return;
    }
    
    // ✅ Crear producto usando datos del backend
    const newProduct: Product = {
      id: this.selectedProductData.id, // ID del backend
      name: this.selectedProductData.name,
      quantity: quantity,
      unit: this.selectedProductData.unit, // ✅ Unidad del backend (PIEZA, KILO, LITRO, METRO)
      actions: ''
    };
    
    this.products.push(newProduct);
    
    // Limpiar campos
    this.productSearchTerm = '';
    this.currentQuantity = '';
    this.selectedProductData = null;
  }

  onAccept(): void {
    if (!this.currentDeliveryDate) {
      console.log('Debe seleccionar una fecha de entrega');
      return;
    }
    
    if (!this.selectedArea) {
      console.log('Debe seleccionar un área');
      return;
    }
    
    if (this.products.length === 0) {
      console.log('No hay productos para agregar');
      return;
    }

    // Buscar si ya existe una requisición para esta área
    const existingIndex = this.requisitionSummary.findIndex(req => req.area === this.selectedArea);
    
    // Encontrar el ID del área seleccionada
    const selectedAreaObj = this.backendAreas.find(a => a.name === this.selectedArea);
    const areaId = selectedAreaObj?.id;
    
    if (existingIndex !== -1) {
      // Si existe, actualizar los productos
      this.requisitionSummary[existingIndex].products = [...this.products];
      if (areaId) {
        this.requisitionSummary[existingIndex].areaId = areaId;
      }
    } else {
      // Si no existe, crear nueva requisición
      this.requisitionSummary.push({
        area: this.selectedArea,
        areaId: areaId,
        products: [...this.products]
      });
    }
    
    console.log('Productos aceptados para el área:', this.selectedArea);
    console.log('Resumen actualizado:', this.requisitionSummary);
    
    // Limpiar la lista temporal y resetear campos después de aceptar
    this.products = [];
    this.productSearchTerm = '';
    this.currentQuantity = '';
    
    // Solo limpiar el área si NO es un evento (área "Eventos")
    if (this.selectedArea !== 'Eventos') {
      this.selectedArea = '';
      this.areaSearchTerm = '';
    }
    // NO limpiar la fecha porque es para toda la solicitud
  }

  onConfirmRequisition(): void {
    if (this.requisitionSummary.length === 0) {
      console.log('No hay requisiciones para confirmar');
      return;
    }
    
    if (!this.currentDeliveryDate) {
      console.log('Debe seleccionar una fecha de entrega');
      return;
    }
    
    console.log('Navegar a confirmación con datos:', this.requisitionSummary);
    
    // Navegar a la vista de confirmación pasando los datos
    this.router.navigate(['/requisicion/confirmacion'], {
      state: {
        requisitionData: this.requisitionSummary,
        deliveryDate: this.currentDeliveryDate,
        isDevolucion: this.isDevolucion,
        selectedEventId: this.selectedEvent, // Pasar el evento seleccionado
        businessUnit: this.businessUnit, // Pasar la unidad de negocio
        selectedLocationId: this.selectedLocationId,
        selectedProjectId: this.selectedProjectId,
        selectedDepartmentId: this.selectedDepartmentId
      }
    });
  }

  removeAreaFromSummary(area: string): void {
    this.requisitionSummary = this.requisitionSummary.filter(req => req.area !== area);
    // Si el área eliminada es la actualmente seleccionada, limpiar productos
    if (this.selectedArea === area) {
      this.products = [];
    }
  }

  hasProductsInArea(area: string): boolean {
    return this.requisitionSummary.some(req => req.area === area && req.products.length > 0);
  }

  hasUnsavedChanges(): boolean {
    if (!this.selectedArea) {
      return false;
    }

    // Buscar si existe una requisición guardada para esta área
    const existingRequisition = this.requisitionSummary.find(req => req.area === this.selectedArea);
    
    if (!existingRequisition) {
      // Si no existe en el resumen, cualquier producto es un cambio sin guardar
      return this.products.length > 0;
    }

    // Comparar la lista actual con la guardada
    const currentProducts = this.products;
    const savedProducts = existingRequisition.products;

    // Si tienen diferente cantidad de productos, hay cambios
    if (currentProducts.length !== savedProducts.length) {
      return true;
    }

    // Verificar si algún producto actual no está en la lista guardada o tiene diferente cantidad/unidad
    for (const currentProduct of currentProducts) {
      const savedProduct = savedProducts.find(sp => 
        sp.name === currentProduct.name && 
        sp.quantity === currentProduct.quantity && 
        sp.unit === currentProduct.unit
      );
      
      if (!savedProduct) {
        return true; // Producto nuevo o modificado
      }
    }

    return false; // No hay cambios
  }

  getAvailableProductsForCurrentArea(): string[] {
    if (!this.selectedArea) {
      return this.productNames; // ✅ Usar productNames del backend
    }

    // ⚡ Usar Set para búsqueda O(1) en lugar de includes() O(n)
    const currentAreaProductsSet = new Set<string>();
    
    // Agregar productos de la lista temporal actual
    this.products.forEach(product => {
      currentAreaProductsSet.add(product.name);
    });
    
    // Agregar productos del resumen si existe una requisición para esta área
    const existingRequisition = this.requisitionSummary.find(req => req.area === this.selectedArea);
    if (existingRequisition) {
      existingRequisition.products.forEach(product => {
        currentAreaProductsSet.add(product.name);
      });
    }
    
    // ⚡ Filtrar productos disponibles usando Set.has() - mucho más rápido que includes()
    return this.productNames.filter(productName => !currentAreaProductsSet.has(productName));
  }

  removeProduct(productId: string): void {
    this.products = this.products.filter(p => p.id !== productId);
  }

  updateQuantity(productId: string, newQuantity: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.quantity = newQuantity;
    }
  }

  updateQuantityFromInput(productId: string, event: any): void {
    const value = event.target.value;
    // Permitir editar libremente y actualizar
    const cleanValue = value.replace(/[^0-9]/g, '');
    const numericValue = parseInt(cleanValue) || 1;
    this.updateQuantity(productId, numericValue);
  }

  // Método para validar al perder el foco en inputs de la tabla
  validateTableInput(productId: string, event: any): void {
    const value = event.target.value;
    const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 1;
    this.updateQuantity(productId, numericValue);
    event.target.value = numericValue.toString();
  }

  incrementQuantity(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.quantity += 1;
    }
  }

  decrementQuantity(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product && product.quantity > 1) {
      product.quantity -= 1;
    }
  }

  validateNumberInput(event: any): void {
    const value = event.target.value;
    // Permitir editar libremente, solo limpiar caracteres no numéricos
    const numericValue = value.replace(/[^0-9]/g, '');
    this.currentQuantity = numericValue;
    event.target.value = this.currentQuantity;
  }

  isValidQuantity(): boolean {
    const quantity = parseInt(this.currentQuantity);
    return this.currentQuantity.trim() !== '' && !isNaN(quantity) && quantity > 0;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
    // Aquí podrías agregar lógica adicional si necesitas manejar cambios de sección
  }

  toggleResumePanel(): void {
    this.isResumeCollapsed = !this.isResumeCollapsed;
  }

  onLocationChange(): void {
    if (this.businessUnit) {
      const selectedLocation = this.locations.find(loc => loc.name === this.businessUnit);
      if (selectedLocation) {
        this.selectedLocationId = selectedLocation.id;
        console.log(`✅ Locación seleccionada: ${this.businessUnit} (ID: ${this.selectedLocationId})`);
      }
    } else {
      this.selectedLocationId = undefined;
    }
  }

  onEventChange(): void {
    if (this.selectedEvent) {
      const selectedEventObj = this.projects.find(project => project.id === this.selectedEvent);
      if (selectedEventObj) {
        // Guardar el ID del proyecto para enviar al backend
        this.selectedProjectId = this.selectedEvent;
        
        // Establecer fecha el mismo día del evento con la hora seleccionada
        const deliveryDate = new Date(selectedEventObj.date);
        
        // Agregar la hora seleccionada
        const [hours, minutes] = this.deliveryTime.split(':').map(Number);
        deliveryDate.setHours(hours, minutes, 0, 0);
        
        this.currentDeliveryDate = deliveryDate;
        
        // Llenar automáticamente el campo de fecha personalizada
        this.customDeliveryDate = this.formatDateForInput(deliveryDate);
        
        // Seleccionar automáticamente el área "Eventos"
        this.selectedArea = 'Eventos';
        this.areaSearchTerm = 'Eventos';
        this.loadProductsForArea();
      }
    } else {
      this.selectedProjectId = undefined; // Limpiar el ID del proyecto
      this.currentDeliveryDate = null;
      this.customDeliveryDate = ''; // Limpiar fecha personalizada solo si no hay evento
      // Limpiar el área de eventos
      if (this.selectedArea === 'Eventos') {
        this.selectedArea = '';
        this.areaSearchTerm = '';
      }
    }
  }

  onCustomDateChange(): void {
    if (this.customDeliveryDate) {
      // Si es fecha personalizada, usa el día exacto seleccionado con la hora
      const dateParts = this.customDeliveryDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Los meses en JavaScript van de 0-11
      const day = parseInt(dateParts[2]);
      
      // Agregar la hora seleccionada
      const [hours, minutes] = this.deliveryTime.split(':').map(Number);
      
      this.currentDeliveryDate = new Date(year, month, day, hours, minutes, 0, 0);
      
      // NO limpiar el evento seleccionado - mantener ambos sincronizados
      // this.selectedEvent = ''; // COMENTADO: El evento se mantiene seleccionado
    } else {
      this.currentDeliveryDate = null;
      // Limpiar el área de eventos si no hay fecha
      if (this.selectedArea === 'Eventos' && !this.selectedEvent) {
        this.selectedArea = '';
        this.areaSearchTerm = '';
      }
    }
  }

  onTimeChange(): void {
    // Cuando cambia la hora, actualizar la fecha actual según la opción seleccionada
    if (this.selectedEvent) {
      this.onEventChange();
    } else if (this.customDeliveryDate) {
      this.onCustomDateChange();
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isEventDatePassed(eventDate: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  }

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getRequestDeliveryDate(): Date | null {
    return this.currentDeliveryDate;
  }

  // Verificar si el área debe estar deshabilitada (cuando hay un evento seleccionado)
  isAreaDisabled(): boolean {
    return this.selectedEvent !== '';
  }

  // Métodos para manejar el modal de cambio de área
  closeAreaChangeModal(): void {
    // Cuando se cierra el modal con X o backdrop, NO cambiar de área
    this.cancelAreaChangeInternal();
  }

  private cancelAreaChangeInternal(): void {
    // Solo para cerrar modal sin cambiar de área
    // Restaurar el área actual en el input
    if (this.currentAreaWithProducts) {
      this.areaSearchTerm = this.currentAreaWithProducts;
      this.selectedArea = this.currentAreaWithProducts;
      // Recargar productos del área actual para restaurar estado original
      this.loadProductsForArea();
    }
    
    // Limpiar variables del modal
    this.showAreaChangeModal = false;
    this.pendingAreaChange = '';
    this.currentAreaWithProducts = '';
    this.preventBlurProcessing = false;
  }

  addToRequisitionAndChange(): void {
    // Agregar productos del área actual a la requisición (igual que onAccept pero sin limpiar área)
    if (this.products.length > 0 && this.currentAreaWithProducts) {
      // Buscar si ya existe una requisición para esta área
      const existingIndex = this.requisitionSummary.findIndex(req => req.area === this.currentAreaWithProducts);
      
      // Encontrar el ID del área actual
      const selectedAreaObj = this.backendAreas.find(a => a.name === this.currentAreaWithProducts);
      const areaId = selectedAreaObj?.id;
      
      if (existingIndex !== -1) {
        // Si existe, actualizar los productos
        this.requisitionSummary[existingIndex].products = [...this.products];
        if (areaId) {
          this.requisitionSummary[existingIndex].areaId = areaId;
        }
      } else {
        // Si no existe, crear nueva requisición
        this.requisitionSummary.push({
          area: this.currentAreaWithProducts,
          areaId: areaId,
          products: [...this.products]
        });
      }
      
      console.log('Productos agregados a la requisición para el área:', this.currentAreaWithProducts);
      console.log('Resumen actualizado:', this.requisitionSummary);
    }
    
    // Cambiar al área nueva
    this.selectedArea = this.pendingAreaChange;
    this.areaSearchTerm = this.pendingAreaChange;
    this.showAreaDropdown = false;
    
    // Limpiar variables del modal directamente (sin restaurar área)
    this.showAreaChangeModal = false;
    this.pendingAreaChange = '';
    this.currentAreaWithProducts = '';
    this.preventBlurProcessing = false;
    
    // Cargar productos del área nueva (si existen) y limpiar la lista temporal
    this.onAreaChange();
  }

  cancelAreaChange(): void {
    // Descartar productos actuales y SÍ cambiar al área nueva
    this.products = [];
    this.productSearchTerm = '';
    this.currentQuantity = '';
    
    // Cambiar al área nueva
    this.selectedArea = this.pendingAreaChange;
    this.areaSearchTerm = this.pendingAreaChange;
    this.showAreaDropdown = false;
    
    // Limpiar variables del modal directamente (sin restaurar área)
    this.showAreaChangeModal = false;
    this.pendingAreaChange = '';
    this.currentAreaWithProducts = '';
    this.preventBlurProcessing = false;
    
    // Cargar productos del área nueva (si existen)
    this.onAreaChange();
  }

  // Método obsoleto - reemplazado por addToRequisitionAndChange
  confirmAreaChange(): void {
    this.addToRequisitionAndChange();
  }
  
  // ⚡ TrackBy functions para optimizar *ngFor (evita re-renders innecesarios)
  trackByProductId(index: number, product: Product): string {
    return product.id;
  }
  
  trackByAreaName(index: number, summary: RequisitionSummary): string {
    return summary.area;
  }
  
  trackByProductName(index: number, product: Product): string {
    return product.name;
  }
  
  trackByString(index: number, item: string): string {
    return item;
  }
  
  trackByLocationId(index: number, location: Location): string {
    return location.id || location.name; // Usar name como fallback
  }
  
  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }
  
  ngOnDestroy(): void {
    // ⚡ Cleanup de subscriptions
    this.productSearchSubject.complete();
    this.areaSearchSubject.complete();
  }
}