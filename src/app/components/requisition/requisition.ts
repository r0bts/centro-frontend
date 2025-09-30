import { Component } from '@angular/core';
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
export class RequisitionComponent {
  activeSection: string = 'requisicion';
  
  selectedArea: string = 'Restaurante';
  searchProduct: string = '';
  selectedUnit: string = 'ml';

  areas: string[] = ['Restaurante', 'Cocina', 'Bar', 'Limpieza', 'Administración'];
  units: string[] = ['ml', 'Lt', 'Kg', 'g', 'Pzs', 'Cajas'];

  products: Product[] = [
    { id: '1', name: 'Producto 1', quantity: 5, unit: 'Lt', actions: '' },
    { id: '2', name: 'Producto 2', quantity: 6, unit: 'Lt', actions: '' },
    { id: '3', name: 'Producto 3', quantity: 3, unit: 'Kg', actions: '' },
    { id: '4', name: 'Producto 4', quantity: 1, unit: 'Kg', actions: '' }
  ];

  requisitionSummary: RequisitionSummary[] = [
    {
      area: 'Baño',
      products: [
        { id: '1', name: 'Producto 1', quantity: 5, unit: 'Lt', actions: '' },
        { id: '2', name: 'Producto 2', quantity: 6, unit: 'Lt', actions: '' },
        { id: '3', name: 'Producto 3', quantity: 3, unit: 'Kg', actions: '' },
        { id: '4', name: 'Producto 4', quantity: 1, unit: 'Kg', actions: '' }
      ]
    },
    {
      area: 'Piscina',
      products: [
        { id: '1', name: 'Producto 1', quantity: 3, unit: 'Pzs', actions: '' },
        { id: '2', name: 'Producto 2', quantity: 6, unit: 'Lt', actions: '' },
        { id: '3', name: 'Producto 3', quantity: 3, unit: 'Kg', actions: '' }
      ]
    }
  ];

  onAreaChange(): void {
    console.log('Área seleccionada:', this.selectedArea);
  }

  onSearchProduct(): void {
    console.log('Buscar producto:', this.searchProduct);
  }

  onAddProduct(): void {
    if (this.searchProduct.trim()) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: this.searchProduct,
        quantity: 1,
        unit: this.selectedUnit,
        actions: ''
      };
      this.products.push(newProduct);
      this.searchProduct = '';
    }
  }

  onAccept(): void {
    console.log('Aceptar productos seleccionados');
  }

  onConfirmRequisition(): void {
    console.log('Confirmar solicitud de requisición');
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

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
    // Aquí podrías agregar lógica adicional si necesitas manejar cambios de sección
  }
}