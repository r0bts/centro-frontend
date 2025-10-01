import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../content-menu/content-menu';

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
  
  selectedArea: string = '';
  searchProduct: string = '';
  selectedUnit: string = 'ml';
  currentQuantity: string = '';
  isResumeCollapsed: boolean = false;

  areas: string[] = ['Restaurante', 'Cocina', 'Bar', 'Limpieza', 'Administración'];
  units: string[] = ['ml', 'Lt', 'Kg', 'g', 'Pzs', 'Cajas'];
  
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
    
    // Limpiar la lista temporal y resetear área después de aceptar
    this.products = [];
    this.searchProduct = '';
    this.currentQuantity = '';
    this.selectedArea = '';
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
}