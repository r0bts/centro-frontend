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
  
  // Propiedades para productos
  searchProduct: string = '';
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
    this.selectedArea = area;
    this.areaSearchTerm = area;
    this.showAreaDropdown = false;
    this.onAreaChange();
  }

  onAreaFocus(): void {
    this.showAreaDropdown = true;
    this.filteredAreas = this.areas;
  }

  onAreaBlur(): void {
    setTimeout(() => {
      this.showAreaDropdown = false;
      const exactMatch = this.areas.find(area => 
        area.toLowerCase() === this.areaSearchTerm.toLowerCase()
      );
      if (!exactMatch) {
        this.selectedArea = '';
        this.areaSearchTerm = '';
      }
    }, 200);
  }

  onProductSearch(): void {
    this.showProductDropdown = true;
    if (this.productSearchTerm.trim() === '') {
      this.filteredProducts = this.availableProducts;
    } else {
      this.filteredProducts = this.availableProducts.filter(product => 
        product.toLowerCase().includes(this.productSearchTerm.toLowerCase())
      );
    }
  }

  selectProduct(product: string): void {
    this.searchProduct = product;
    this.productSearchTerm = product;
    this.showProductDropdown = false;
  }

  onProductFocus(): void {
    this.showProductDropdown = true;
    this.filteredProducts = this.availableProducts;
  }

  onProductBlur(): void {
    setTimeout(() => {
      this.showProductDropdown = false;
      const exactMatch = this.availableProducts.find(product => 
        product.toLowerCase() === this.productSearchTerm.toLowerCase()
      );
      if (exactMatch) {
        this.searchProduct = exactMatch;
      } else {
        this.searchProduct = '';
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
      // Si existe, cargar los productos en la lista temporal para editar
      this.products = [...existingRequisition.products];
    } else {
      // Si no existe, limpiar la lista de productos
      this.products = [];
    }
  }

  onSearchProduct(): void {
    console.log('Buscar producto:', this.searchProduct);
  }

  onAddProduct(): void {
    if (this.searchProduct.trim()) {
      // Si currentQuantity está vacío, usar 1 como default
      const quantity = parseInt(this.currentQuantity) || 1;
      const newProduct: Product = {
        id: Date.now().toString(),
        name: this.searchProduct,
        quantity: quantity,
        unit: this.selectedUnit,
        actions: ''
      };
      this.products.push(newProduct);
      this.searchProduct = '';
      this.currentQuantity = '';
    }
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
    this.searchProduct = '';
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
        this.customDeliveryDate = '';
      }
    }
  }

  onCustomDateChange(): void {
    if (this.customDeliveryDate) {
      // Si es fecha personalizada, usa el día exacto seleccionado
      this.currentDeliveryDate = new Date(this.customDeliveryDate);
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
}