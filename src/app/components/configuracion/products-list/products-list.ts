import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

  products: Product[] = [];
  private productsDataTable: any;
  private destroy$ = new Subject<void>();
  private isDestroyed = false;
  private initTimeout: any = null;
  
  // 🔥 Filtros y estadísticas
  lastSyncDate: Date | null = null;
  totalProducts: number = 0;
  filteredCount: number = 0;
  activeCount: number = 0;
  withCategoryCount: number = 0;
  withSubcategoryCount: number = 0;
  categoriesMap: { [key: string]: {name: string, count: number} } = {};
  subcategoriesMap: { [key: string]: {name: string, count: number} } = {};

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

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
    
    // 🔥 Cargar TODOS los productos (límite 5000 para asegurar que se carguen todos)
    this.productService.getAllProducts(5000, 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (products) => {
        // Verificar si el componente sigue vivo
        if (this.isDestroyed) {
          console.log('⚠️ Componente destruido, ignorando respuesta');
          return;
        }
        
        this.products = products;
        this.totalProducts = products.length;
        this.filteredCount = products.length;
        
        // Extraer fecha de sincronización del primer producto
        if (products.length > 0 && products[0].lastSync) {
          this.lastSyncDate = new Date(products[0].lastSync);
        }
        
        console.log('✅ HIJO - Productos cargados:', this.products.length);
        
        // 🔥 Construir mapa de categorías
        this.buildCategoriesMap();
        
        // 🔥 Construir mapa de subcategorías
        this.buildSubcategoriesMap();
        
        // 🔥 Actualizar estadísticas
        this.updateStatistics();
        
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
            // Código
            data: null,
            render: (data: Product) => {
              return `<strong>${data.code}</strong>`;
            }
          },
          {
            // Nombre
            data: null,
            render: (data: Product) => {
              return `
                <div>
                  <strong>${data.name}</strong>
                  ${data.description ? `<br><small class="text-muted">${data.description}</small>` : ''}
                </div>
              `;
            }
          },
          {
            // Categoría
            data: null,
            render: (data: Product) => {
              return data.category_name 
                ? `<span class="badge bg-primary">${data.category_name}</span>`
                : '<span class="badge bg-secondary">Sin categoría</span>';
            }
          },
          {
            // Subcategoría
            data: null,
            render: (data: Product) => {
              return data.subcategory_name 
                ? `<span class="badge bg-info">${data.subcategory_name}</span>`
                : '<span class="badge bg-light text-muted">Sin subcategoría</span>';
            }
          },
          {
            // Unidad
            data: null,
            render: (data: Product) => {
              return `<span class="badge bg-secondary">${data.unit}</span>`;
            }
          },
          {
            // Estado
            data: null,
            className: 'text-center',
            render: (data: Product) => {
              return data.isActive 
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';
            }
          },
          {
            // Acciones
            data: null,
            className: 'text-center',
            orderable: false,
            render: (data: Product) => {
              return `
                <button class="btn btn-sm btn-light view-btn" data-id="${data.id}">
                  <i class="bi bi-eye"></i> Ver
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
      
      // 🔥 Inicializar filtros
      this.initFilters();
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
    // TODO: Llamar al servicio de sincronización cuando exista
    Swal.fire({
      icon: 'info',
      title: 'Sincronización',
      text: 'La sincronización de productos se implementará próximamente',
      confirmButtonText: 'Entendido'
    });
    
    // Cuando el backend esté listo:
    // this.productService.syncProducts().subscribe({
    //   next: () => {
    //     this.loadProducts();
    //     Swal.fire('Sincronización completa', 'Productos actualizados', 'success');
    //   },
    //   error: (error) => {
    //     Swal.fire('Error', 'No se pudo sincronizar', 'error');
    //   }
    // });
  }

  onViewProduct(product: Product): void {
    Swal.fire({
      title: 'Detalles del Producto',
      html: `
        <div class="text-start">
          <p><strong>Código:</strong> ${product.code}</p>
          <p><strong>Nombre:</strong> ${product.name}</p>
          <p><strong>Descripción:</strong> ${product.description || 'N/A'}</p>
          <p><strong>Categoría:</strong> ${product.category_name || 'N/A'}</p>
          <p><strong>Subcategoría:</strong> ${product.subcategory_name || 'N/A'}</p>
          <p><strong>Unidad:</strong> ${product.unit}</p>
          <p><strong>Estado:</strong> ${product.isActive ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</p>
          <p><strong>Fecha de creación:</strong> ${new Date(product.createdAt).toLocaleDateString('es-ES')}</p>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  }

  /**
   * 🔥 Construir mapa de categorías desde los productos
   */
  private buildCategoriesMap(): void {
    const categoriesCount: { [key: string]: {name: string, count: number} } = {};
    
    this.products.forEach(product => {
      const catId = product.category_id?.toString();
      const catName = product.category_name || 'Sin categoría';
      
      if (catId) {
        if (!categoriesCount[catId]) {
          categoriesCount[catId] = { name: catName, count: 0 };
        }
        categoriesCount[catId].count++;
      }
    });
    
    this.categoriesMap = categoriesCount;
    console.log('📊 Categorías encontradas:', Object.keys(categoriesCount).length);
    
    // Poblar dropdown de categorías
    this.populateCategoryDropdown();
  }

  /**
   * 🔥 Poblar dropdown de categorías
   */
  private populateCategoryDropdown(): void {
    const categorySelect = $('#categoryFilter');
    categorySelect.find('option:not(:first)').remove();
    
    // Ordenar categorías alfabéticamente
    const sortedCategories = Object.entries(this.categoriesMap)
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
    
    sortedCategories.forEach(([id, data]) => {
      categorySelect.append(
        `<option value="${id}">${data.name} (${data.count})</option>`
      );
    });
  }

  /**
   * 🔥 Construir mapa de subcategorías desde los productos
   */
  private buildSubcategoriesMap(): void {
    const subcategoriesCount: { [key: string]: {name: string, count: number} } = {};
    
    this.products.forEach(product => {
      const subcatId = product.subcategory_id?.toString();
      const subcatName = product.subcategory_name || 'Sin subcategoría';
      
      if (subcatId) {
        if (!subcategoriesCount[subcatId]) {
          subcategoriesCount[subcatId] = { name: subcatName, count: 0 };
        }
        subcategoriesCount[subcatId].count++;
      }
    });
    
    this.subcategoriesMap = subcategoriesCount;
    console.log('📊 Subcategorías encontradas:', Object.keys(subcategoriesCount).length);
    
    // Poblar dropdown de subcategorías
    this.populateSubcategoryDropdown();
  }

  /**
   * 🔥 Poblar dropdown de subcategorías
   */
  private populateSubcategoryDropdown(): void {
    const subcategorySelect = $('#subcategoryFilter');
    subcategorySelect.find('option:not(:first)').remove();
    
    // Ordenar subcategorías alfabéticamente
    const sortedSubcategories = Object.entries(this.subcategoriesMap)
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
    
    sortedSubcategories.forEach(([id, data]) => {
      subcategorySelect.append(
        `<option value="${id}">${data.name} (${data.count})</option>`
      );
    });
  }

  /**
   * 🔥 Inicializar filtros de la tabla
   */
  private initFilters(): void {
    if (this.isDestroyed) return;
    
    const self = this;
    
    // 🔍 Búsqueda nativa de DataTables
    $('#searchInput').on('keyup', function(this: HTMLInputElement) {
      if (self.productsDataTable) {
        self.productsDataTable.search($(this).val()).draw();
        self.updateFilteredCount();
      }
    });
    
    // 🔥 Filtro personalizado para categoría, subcategoría y estado
    $.fn.dataTable.ext.search.push((settings: any, data: any, dataIndex: number) => {
      if (!self.products || !self.products[dataIndex]) return true;
      
      const product = self.products[dataIndex];
      
      // Filtro de categoría
      const selectedCategory = $('#categoryFilter').val() as string;
      if (selectedCategory && product.category_id?.toString() !== selectedCategory) {
        return false;
      }
      
      // Filtro de subcategoría
      const selectedSubcategory = $('#subcategoryFilter').val() as string;
      if (selectedSubcategory && product.subcategory_id?.toString() !== selectedSubcategory) {
        return false;
      }
      
      // Filtro de estado
      const selectedStatus = $('#statusFilter').val() as string;
      if (selectedStatus === 'active' && product.isActive === false) return false;
      if (selectedStatus === 'inactive' && product.isActive === true) return false;
      
      return true;
    });
    
    // 🔄 Eventos de cambio en los filtros
    $('#categoryFilter, #subcategoryFilter, #statusFilter').on('change', function() {
      if (self.productsDataTable) {
        self.productsDataTable.draw();
        self.updateFilteredCount();
      }
    });
    
    // 🧹 Limpiar filtros
    $('#clearFiltersBtn').on('click', function() {
      $('#searchInput').val('');
      $('#categoryFilter').val('');
      $('#subcategoryFilter').val('');
      $('#statusFilter').val('');
      
      if (self.productsDataTable) {
        self.productsDataTable.search('').draw();
        self.updateFilteredCount();
      }
    });
    
    console.log('✅ Filtros inicializados');
  }

  /**
   * 🔥 Actualizar contador de productos filtrados
   */
  private updateFilteredCount(): void {
    if (this.productsDataTable) {
      const info = this.productsDataTable.page.info();
      this.filteredCount = info.recordsDisplay;
      
      // Forzar detección de cambios para evitar ExpressionChangedAfterItHasBeenCheckedError
      this.cdr.detectChanges();
    }
  }

  /**
   * 🔥 Formatear fecha para mostrar
   */
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * 🔥 Actualizar estadísticas de productos
   */
  private updateStatistics(): void {
    this.activeCount = this.products.filter(p => p.isActive).length;
    this.withCategoryCount = this.products.filter(p => p.category_id).length;
    this.withSubcategoryCount = this.products.filter(p => p.subcategory_id).length;
    
    console.log('📊 Estadísticas actualizadas:', {
      total: this.totalProducts,
      activos: this.activeCount,
      conCategoria: this.withCategoryCount,
      conSubcategoria: this.withSubcategoryCount
    });
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

}
