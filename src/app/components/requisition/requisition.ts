import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  
  // Propiedades para fechas (OBLIGATORIO)
  selectedEvent: string = '';
  customDeliveryDate: string = '';
  currentDeliveryDate: Date | null = null;
  
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
  
  // Eventos predefinidos
  events: Event[] = [
    { id: '1', name: 'Cena de Gala', date: new Date('2025-10-15') },
    { id: '2', name: 'Evento Corporativo', date: new Date('2025-10-20') },
    { id: '3', name: 'Banquete de Bodas', date: new Date('2025-10-25') },
    { id: '4', name: 'Reunión de Directivos', date: new Date('2025-11-05') },
    { id: '5', name: 'Celebración de Aniversario', date: new Date('2025-11-10') }
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
    this.selectedArea = '';
    this.areaSearchTerm = '';
    // NO limpiar la fecha porque es para toda la solicitud
  }

  onConfirmRequisition(): void {
    if (this.requisitionSummary.length === 0) {
      console.log('No hay requisiciones para confirmar');
      return;
    }
    console.log('Confirmar solicitud de requisición:', this.requisitionSummary);
    // Aquí podrías enviar la requisición al servidor
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
        // Establecer fecha un día antes del evento
        const deliveryDate = new Date(selectedEventObj.date);
        deliveryDate.setDate(deliveryDate.getDate() - 1);
        this.currentDeliveryDate = deliveryDate;
        this.customDeliveryDate = ''; // Limpiar fecha personalizada
      }
    } else {
      this.currentDeliveryDate = null;
    }
  }

  onCustomDateChange(): void {
    if (this.customDeliveryDate) {
      // Si es fecha personalizada, usa el día exacto seleccionado
      // Crear la fecha con componentes específicos para evitar problemas de zona horaria
      const dateParts = this.customDeliveryDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Los meses en JavaScript van de 0-11
      const day = parseInt(dateParts[2]);
      this.currentDeliveryDate = new Date(year, month, day);
      this.selectedEvent = ''; // Limpiar evento seleccionado
    } else {
      this.currentDeliveryDate = null;
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