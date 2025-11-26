import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';

export interface Event {
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
  products: Product[];
}

@Component({
  selector: 'app-requisition',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './requisition.html',
  styleUrls: ['./requisition.scss']
})
export class RequisitionComponent implements OnInit {
  activeSection: string = 'requisicion';
  
  // Propiedad para devolución
  isDevolucion: boolean = false;
  
  // Propiedad para unidad de negocio/trabajo
  businessUnit: string = '';
  
  // Propiedades para fechas (OBLIGATORIO)
  selectedEvent: string = '';
  customDeliveryDate: string = '';
  deliveryTime: string = '08:00'; // Un solo campo de hora para ambas opciones
  currentDeliveryDate: Date | null = null;

  constructor(private router: Router) {
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
  selectedUnit: string = 'ml';
  currentQuantity: string = '';
  isResumeCollapsed: boolean = false;

  areas: string[] = ['Restaurante', 'Cocina', 'Bar', 'Limpieza', 'Administración'];
  units: string[] = ['ml', 'Lt', 'Kg', 'g', 'Pzs', 'Cajas'];
  
  // Unidades de negocio/trabajo
  businessUnits: string[] = [
    'Unidad Centro',
    'Corporativo'
  ];
  
  // Eventos predefinidos (actualizados desde 4 de noviembre de 2025)
  events: Event[] = [
    { id: '1', name: 'Cena de Gala', date: new Date('2025-11-05') },
    { id: '2', name: 'Evento Corporativo', date: new Date('2025-11-08') },
    { id: '3', name: 'Banquete de Bodas', date: new Date('2025-11-12') },
    { id: '4', name: 'Reunión de Directivos', date: new Date('2025-11-15') },
    { id: '5', name: 'Celebración de Aniversario', date: new Date('2025-11-20') },
    { id: '6', name: 'Conferencia Anual', date: new Date('2025-11-25') },
    { id: '7', name: 'Evento de Fin de Año', date: new Date('2025-12-15') },
    { id: '8', name: 'Celebración Navideña', date: new Date('2025-12-22') }
  ];
  
  // Lista de productos disponibles para seleccionar
  availableProducts: string[] = [
    'Detergente líquido',
    'Jabón en polvo', 
    'Desinfectante',
    'Papel higiénico',
    'Toallas de papel',
    'Cloro',
    'Aceite de cocina',
    'Sal',
    'Azúcar',
    'Harina',
    'Arroz',
    'Pasta',
    'Cerveza',
    'Vino tinto',
    'Whisky',
    'Ron',
    'Vodka'
  ];

  // Productos temporales del área actual
  products: Product[] = [];

  // Resumen de requisiciones por área (inicialmente vacío)
  requisitionSummary: RequisitionSummary[] = [];

  ngOnInit(): void {
    // Cargar productos del área inicial si ya existen
    this.loadProductsForArea();
    //consultas a endpoints para cargar areas y productos
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
    if (this.areaSearchTerm.trim() === '') {
      this.filteredAreas = this.areas;
    } else {
      this.filteredAreas = this.areas.filter(area => 
        area.toLowerCase().includes(this.areaSearchTerm.toLowerCase())
      );
    }
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
  }

  onAreaFocus(): void {
    this.showAreaDropdown = true;
    this.filteredAreas = this.areas;
  }

  onAreaBlur(): void {
    setTimeout(() => {
      // Si se está previniendo el procesamiento del blur, reset la bandera y salir
      if (this.preventBlurProcessing) {
        this.preventBlurProcessing = false;
        return;
      }
      
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
    const availableProductsForArea = this.getAvailableProductsForCurrentArea();
    
    if (this.productSearchTerm.trim() === '') {
      this.filteredProducts = availableProductsForArea;
    } else {
      this.filteredProducts = availableProductsForArea.filter(product => 
        product.toLowerCase().includes(this.productSearchTerm.toLowerCase())
      );
    }
  }

  selectProduct(product: string): void {
    this.productSearchTerm = product;
    this.showProductDropdown = false;
  }

  onProductFocus(): void {
    this.showProductDropdown = true;
    this.filteredProducts = this.getAvailableProductsForCurrentArea();
  }

  onProductBlur(): void {
    setTimeout(() => {
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
    if (!this.productSearchTerm.trim()) {
      console.log('Debe seleccionar un producto');
      return;
    }
    
    // Validar que el producto no esté ya agregado en el área actual
    const productAlreadyExists = this.products.some(product => 
      product.name.toLowerCase() === this.productSearchTerm.toLowerCase()
    );
    
    if (productAlreadyExists) {
      console.log('Este producto ya está agregado en el área actual');
      return;
    }
    
    // Validar que haya cantidad y que sea mayor a 0
    const quantity = parseInt(this.currentQuantity);
    if (!this.currentQuantity.trim() || isNaN(quantity) || quantity <= 0) {
      console.log('Debe ingresar una cantidad válida mayor a 0');
      return;
    }
    
    const newProduct: Product = {
      id: Date.now().toString(),
      name: this.productSearchTerm,
      quantity: quantity,
      unit: this.selectedUnit,
      actions: ''
    };
    this.products.push(newProduct);
    this.productSearchTerm = '';
    this.currentQuantity = '';
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
    
    if (existingIndex !== -1) {
      // Si existe, actualizar los productos
      this.requisitionSummary[existingIndex].products = [...this.products];
    } else {
      // Si no existe, crear nueva requisición
      this.requisitionSummary.push({
        area: this.selectedArea,
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
        businessUnit: this.businessUnit // Pasar la unidad de negocio
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
      return this.availableProducts;
    }

    // Obtener productos que ya están en el área actual (en la lista temporal y en el resumen)
    const currentAreaProducts: string[] = [];
    
    // Agregar productos de la lista temporal actual
    this.products.forEach(product => {
      if (!currentAreaProducts.includes(product.name)) {
        currentAreaProducts.push(product.name);
      }
    });
    
    // Agregar productos del resumen si existe una requisición para esta área
    const existingRequisition = this.requisitionSummary.find(req => req.area === this.selectedArea);
    if (existingRequisition) {
      existingRequisition.products.forEach(product => {
        if (!currentAreaProducts.includes(product.name)) {
          currentAreaProducts.push(product.name);
        }
      });
    }
    
    // Filtrar productos disponibles excluyendo los que ya están en el área actual
    return this.availableProducts.filter(product => !currentAreaProducts.includes(product));
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

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
    // Aquí podrías agregar lógica adicional si necesitas manejar cambios de sección
  }

  toggleResumePanel(): void {
    this.isResumeCollapsed = !this.isResumeCollapsed;
  }

  onEventChange(): void {
    if (this.selectedEvent) {
      const selectedEventObj = this.events.find(event => event.id === this.selectedEvent);
      if (selectedEventObj) {
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
      
      if (existingIndex !== -1) {
        // Si existe, actualizar los productos
        this.requisitionSummary[existingIndex].products = [...this.products];
      } else {
        // Si no existe, crear nueva requisición
        this.requisitionSummary.push({
          area: this.currentAreaWithProducts,
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
}