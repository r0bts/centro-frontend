import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../../services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

declare var $: any; // Para jQuery/DataTables

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss']
})
export class ProductsListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('productsTable', { static: false }) productsTable!: ElementRef;
  @Output() viewProduct = new EventEmitter<Product>();
  @Output() syncProducts = new EventEmitter<void>();

  products: Product[] = []; // Ya NO es @Input
  private productsDataTable: any;
  private destroy$ = new Subject<void>();
  private isDestroyed = false;
  private initTimeout: any = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    console.log('✅ ProductsListComponent initialized');
    this.loadProducts(); // Cargar productos internamente
  }

  ngAfterViewInit(): void {
    // Vacío - la inicialización se hace en loadProducts()
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    
    // Cancelar timeout pendiente
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
      this.initTimeout = null;
    }
    
    this.destroy$.next();
    this.destroy$.complete();
    if (this.productsDataTable) {
      this.productsDataTable.destroy();
    }
  }

  /**
   * Cargar productos desde el backend
   */
  private loadProducts(): void {
    Swal.fire({
      title: 'Cargando productos',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.productService.getAllProducts(1000, 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (products) => {
        // Verificar si el componente sigue vivo
        if (this.isDestroyed) {
          console.log('⚠️ Componente destruido, ignorando respuesta');
          return;
        }
        
        this.products = products;
        console.log('✅ HIJO - Productos cargados:', this.products.length);
        
        Swal.close();
        
        // Si DataTable no existe, crear; si existe, actualizar
        if (!this.productsDataTable) {
          this.initTimeout = setTimeout(() => {
            this.initTimeout = null;
            this.initProductsDataTable();
          }, 100);
        } else {
          this.refreshDataTables();
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    });
  }

  private initProductsDataTable(): void {
    // Verificar si el componente fue destruido
    if (this.isDestroyed) {
      return;
    }
    
    // 🔥 Verificar si DataTable ya existe
    if (this.productsDataTable) {
      this.productsDataTable.destroy();
      this.productsDataTable = null;
    }
    
    if (this.productsTable && this.products.length > 0) {
      this.productsDataTable = $(this.productsTable.nativeElement).DataTable({
        data: this.products,
        columns: [
          {
            data: null,
            render: (data: Product) => {
              return `
                <div class="d-flex align-items-center">
                  <div>
                    <strong>${data.code}</strong> - ${data.name}
                    <br>
                    <small class="text-muted">${data.description || ''}</small>
                    <br>
                    <small><span class="badge bg-info">${data.unit}</span></small>
                  </div>
                </div>
              `;
            }
          },
          {
            data: null,
            render: (data: Product) => {
              return `
                <span class="badge bg-primary">${data.category_name || 'Sin categoría'}</span>
                <br>
                <small class="text-muted">${data.subcategory_name || ''}</small>
              `;
            }
          },
          {
            data: null,
            className: 'text-center',
            render: (data: Product) => {
              return data.isActive 
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';
            }
          },
          {
            data: null,
            className: 'text-center',
            orderable: false,
            render: (data: Product) => {
              return `
                <button class="btn btn-sm btn-light view-btn" data-id="${data.id}">
                  <i class="bi bi-eye"></i>
                </button>
              `;
            }
          }
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
      
      // Agregar event listeners para los botones (delegación de eventos)
      $(this.productsTable.nativeElement).on('click', '.view-btn', (event: any) => {
        event.preventDefault();
        const button = $(event.currentTarget);
        const productId = String(button.data('id')); // Convertir a string
        
        const product = this.products.find(p => p.id === productId);
        
        if (product) {
          this.onViewProduct(product);
        }
      });
    }
  }

  refreshDataTables(): void {
    console.log('🔄 refreshDataTables - products.length:', this.products.length);
    
    if (this.productsDataTable) {
      console.log('🔄 Actualizando datos del DataTable...');
      // Limpiar datos actuales, agregar nuevos datos y redibujar
      this.productsDataTable.clear().rows.add(this.products).draw();
      console.log('✅ DataTable actualizado con nuevos datos');
    } else {
      console.warn('⚠️ No hay DataTable para refrescar');
    }
  }

  onSyncProducts(): void {
    // Emitir evento para que componente externo sincronice con NetSuite
    this.syncProducts.emit();
    
    // Después de sincronizar, recargar automáticamente
    setTimeout(() => {
      this.loadProducts();
    }, 1000);
  }

  onViewProduct(product: Product): void {
    this.viewProduct.emit(product);
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
