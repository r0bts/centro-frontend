import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
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
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss']
})
export class ProductsListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('productsTable', { static: false }) productsTable!: ElementRef;
  @Input() products: Product[] = [];
  @Output() editProduct = new EventEmitter<Product>();
  @Output() viewProduct = new EventEmitter<Product>();
  @Output() syncProducts = new EventEmitter<void>();
  @Output() deleteProduct = new EventEmitter<string>();
  @Output() toggleProductStatus = new EventEmitter<string>();

  // DataTables
  private productsDataTable: any;
  private viewInitialized = false;

  constructor() {}

  ngOnInit(): void {
    console.log('✅ ProductsListComponent initialized, productos:', this.products.length);
  }

  ngAfterViewInit(): void {
    console.log('🔄 ngAfterViewInit, productos:', this.products.length);
    this.viewInitialized = true;
    // Si ya hay productos, inicializar inmediatamente
    if (this.products.length > 0) {
      setTimeout(() => {
        this.initProductsDataTable();
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔔 ngOnChanges detectado:', changes);
    // Detectar cuando llegan los productos desde el padre
    if (changes['products'] && this.viewInitialized) {
      const currentValue = changes['products'].currentValue;
      console.log('📦 Productos cambiaron:', currentValue?.length || 0);
      
      if (currentValue && currentValue.length > 0) {
        // Destruir DataTable existente si hay
        if (this.productsDataTable) {
          this.productsDataTable.destroy();
          this.productsDataTable = null;
        }
        
        // Inicializar con los nuevos datos
        setTimeout(() => {
          this.initProductsDataTable();
        }, 100);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.productsDataTable) {
      this.productsDataTable.destroy();
    }
  }

  private initProductsDataTable(): void {
    if (this.productsTable && this.products.length > 0) {
      console.log('🎯 Inicializando DataTable con', this.products.length, 'productos');
      
      // Convertir productos a formato de datos para DataTables
      const tableData = this.products.map(product => {
        return [
          `<div class="d-flex align-items-center">
            <div>
              <strong>${product.code}</strong> - ${product.name}
              <br>
              <small class="text-muted">${product.description}</small>
              <br>
              <small><span class="badge bg-info">${product.unit}</span></small>
            </div>
          </div>`,
          `<span class="badge bg-info">${product.category}</span>`,
          `<span class="badge ${product.isActive ? 'bg-success' : 'bg-secondary'}">
            ${product.isActive ? 'Activo' : 'Inactivo'}
          </span>`,
          `<button class="btn btn-sm btn-light view-btn" data-id="${product.id}" title="Ver detalles">
            <i class="bi bi-eye"></i>
          </button>`
        ];
      });

      this.productsDataTable = $(this.productsTable.nativeElement).DataTable({
        data: tableData,
        columns: [
          { title: 'Producto' },
          { title: 'Categoría' },
          { title: 'Estado', className: 'text-center' },
          { title: 'Acciones', className: 'text-center', orderable: false }
        ],
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
        order: [[0, 'asc']]
      });

      // Event listener para botones de ver
      $(this.productsTable.nativeElement).on('click', '.view-btn', (e: any) => {
        const productId = $(e.currentTarget).data('id');
        const product = this.products.find(p => p.id === productId);
        if (product) {
          this.onViewProduct(product);
        }
      });

      console.log('✅ DataTable inicializado correctamente');
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
