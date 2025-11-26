import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

declare var $: any; // Para jQuery/DataTables

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  lastSync?: Date;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss']
})
export class ProductsListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('productsTable', { static: false }) productsTable!: ElementRef;
  @Input() products: Product[] = [];
  @Output() editProduct = new EventEmitter<Product>();
  @Output() viewProduct = new EventEmitter<Product>();
  @Output() syncProducts = new EventEmitter<void>();
  @Output() deleteProduct = new EventEmitter<string>();
  @Output() toggleProductStatus = new EventEmitter<string>();

  // DataTables
  private productsDataTable: any;

  constructor() {}

  ngOnInit(): void {
    console.log('✅ ProductsListComponent initialized');
  }

  ngAfterViewInit(): void {
    // Inicializar DataTables después de que la vista esté lista
    setTimeout(() => {
      this.initProductsDataTable();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.productsDataTable) {
      this.productsDataTable.destroy();
    }
  }

  private initProductsDataTable(): void {
    if (this.productsTable && this.products.length > 0) {
      this.productsDataTable = $(this.productsTable.nativeElement).DataTable({
        language: {
          "decimal": "",
          "emptyTable": "No hay datos disponibles en la tabla",
          "info": "Mostrando _START_ a _END_ de _TOTAL_ entradas",
          "infoEmpty": "Mostrando 0 a 0 de 0 entradas",
          "infoFiltered": "(filtrado de _MAX_ entradas totales)",
          "infoPostFix": "",
          "thousands": ",",
          "lengthMenu": "Mostrar _MENU_ entradas",
          "loadingRecords": "Cargando...",
          "processing": "Procesando...",
          "search": "Buscar:",
          "zeroRecords": "No se encontraron registros coincidentes",
          "paginate": {
            "first": "Primero",
            "last": "Último",
            "next": "Siguiente",
            "previous": "Anterior"
          },
          "aria": {
            "sortAscending": ": activar para ordenar la columna ascendente",
            "sortDescending": ": activar para ordenar la columna descendente"
          }
        },
        responsive: true,
        pageLength: 10,
        order: [[0, 'asc']], // Ordenar por código de producto
        columnDefs: [
          { orderable: false, targets: [3] }, // Deshabilitar orden en acciones (columna 3)
          { className: 'text-center', targets: [2, 3] } // Centrar Estado y Acciones
        ]
      });
    }
  }

  refreshDataTables(): void {
    if (this.productsDataTable) {
      this.productsDataTable.destroy();
    }
    
    setTimeout(() => {
      this.initProductsDataTable();
    }, 100);
  }

  onSyncProducts(): void {
    this.syncProducts.emit();
  }

  onViewProduct(product: Product): void {
    this.viewProduct.emit(product);
  }

  onEditProduct(product: Product): void {
    this.editProduct.emit(product);
  }

  onDeleteProduct(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    Swal.fire({
      title: '¿Eliminar producto?',
      html: `¿Estás seguro de que deseas eliminar el producto <strong>${product.name}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteProduct.emit(productId);
        
        Swal.fire({
          icon: 'success',
          title: 'Producto eliminado',
          text: `El producto "${product.name}" ha sido eliminado exitosamente`,
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  onToggleProductStatus(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.toggleProductStatus.emit(productId);
      
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El producto "${product.name}" ahora está ${!product.isActive ? 'activo' : 'inactivo'}`,
        confirmButtonText: 'Continuar',
        timer: 1500,
        timerProgressBar: true
      });
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
