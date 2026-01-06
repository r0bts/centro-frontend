import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category, CategoryService, Account } from '../../../../services/category.service';
import { AuthService } from '../../../../services/auth.service';
import Swal from 'sweetalert2';

// DataTables types
declare var $: any;

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.html',
  styleUrls: ['./categories-list.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CategoriesListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('categoriesTable', { static: false }) categoriesTable!: ElementRef;
  @Input() categories: Category[] = [];
  @Output() categoryUpdated = new EventEmitter<void>();
  
  private categoriesDataTable: any;
  private accountsInventario: Account[] = [];
  private accountsGasto: Account[] = [];
  
  // Permisos del usuario
  canView = false;
  canUpdate = false;

  constructor(
    private authService: AuthService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.checkPermissions();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCategoriesDataTable();
    }, 100);
  }

  ngOnDestroy() {
    if (this.categoriesDataTable) {
      this.categoriesDataTable.destroy();
    }
  }

  /**
   * Verificar permisos del usuario
   */
  checkPermissions() {
    this.canView = this.authService.hasPermission('categorias', 'view');
    this.canUpdate = this.authService.hasPermission('categorias', 'update');
  }

  /**
   * Inicializar DataTable
   */
  private initCategoriesDataTable() {
    console.log('🎯 initCategoriesDataTable - ViewChild:', !!this.categoriesTable, '| categories:', this.categories.length);
    
    if (!this.categoriesTable) {
      console.warn('⚠️ No hay ViewChild categoriesTable');
      return;
    }

    if (this.categories.length === 0) {
      console.warn('⚠️ Array categories está vacío');
      return;
    }

    // Destruir DataTable existente si lo hay
    if (this.categoriesDataTable) {
      console.log('🗑️ Destruyendo DataTable en init...');
      this.categoriesDataTable.destroy();
    }

    this.categoriesDataTable = $(this.categoriesTable.nativeElement).DataTable({
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
        }
      },
      responsive: true,
      pageLength: 25,
      order: [[0, 'asc']],
      columnDefs: [
        { orderable: false, targets: [6] },
        { className: 'text-center', targets: [6] }
      ]
    });
    
    console.log('✅ DataTable inicializado correctamente');
  }

  /**
   * Refrescar DataTable
   */
  refreshDataTables() {
    console.log('🔄 refreshDataTables - categories.length:', this.categories.length);
    
    if (this.categoriesDataTable) {
      console.log('🗑️ Destruyendo DataTable existente...');
      this.categoriesDataTable.destroy();
    }
    
    setTimeout(() => {
      console.log('⏰ Timeout - Llamando initCategoriesDataTable...');
      this.initCategoriesDataTable();
    }, 100);
  }

  /**
   * Verificar si una cuenta es un objeto
   */
  isAccountObject(account: any): boolean {
    return account && typeof account === 'object' && account.account_number && account !== 'Sin asignación';
  }

  /**
   * Obtener el texto a mostrar para una cuenta
   */
  getAccountDisplay(account: any): string {
    if (this.isAccountObject(account)) {
      return `${account.account_number} - ${account.full_name}`;
    }
    return '';
  }

  /**
   * Abrir modal de edición de categoría
   */
  async openEditModal(category: Category) {
    // Cargar cuentas si aún no se han cargado
    if (this.accountsInventario.length === 0 || this.accountsGasto.length === 0) {
      await this.loadAccounts();
    }

    // Determinar el tipo de cuenta actual (verificando si es objeto)
    let currentType = 'none';
    let currentAccountId: number | null = null;
    
    if (this.isAccountObject(category.account_inventario)) {
      currentType = 'inventario';
      currentAccountId = (category.account_inventario as any).id;
      console.log('🔵 Cuenta INVENTARIO detectada:', currentAccountId, category.account_inventario);
    } else if (this.isAccountObject(category.account_gasto)) {
      currentType = 'gasto';
      currentAccountId = (category.account_gasto as any).id;
      console.log('🔵 Cuenta GASTO detectada:', currentAccountId, category.account_gasto);
    }
    
    console.log('📊 Tipo actual:', currentType, '| ID:', currentAccountId);

    // Crear opciones para inventario
    const inventarioOptions = this.accountsInventario.map(acc => 
      `<option value="${acc.id}">${acc.account_number} - ${acc.full_name}</option>`
    ).join('');

    // Crear opciones para gasto
    const gastoOptions = this.accountsGasto.map(acc => 
      `<option value="${acc.id}">${acc.account_number} - ${acc.full_name}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: `Editar Categoría: ${category.name}`,
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label class="form-label fw-bold">Tipo de Cuenta</label>
            <div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="accountType" id="typeNone" value="none" ${currentType === 'none' ? 'checked' : ''}>
                <label class="form-check-label" for="typeNone">Sin asignación</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="accountType" id="typeInventario" value="inventario" ${currentType === 'inventario' ? 'checked' : ''}>
                <label class="form-check-label" for="typeInventario">Cuenta de Inventario</label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="accountType" id="typeGasto" value="gasto" ${currentType === 'gasto' ? 'checked' : ''}>
                <label class="form-check-label" for="typeGasto">Cuenta de Gasto</label>
              </div>
            </div>
          </div>
          
          <div class="mb-3" id="accountSelectContainer" style="display: ${currentType !== 'none' ? 'block' : 'none'};">
            <label class="form-label fw-bold">Seleccionar Cuenta</label>
            <input type="text" id="account_search" class="form-control mb-2" placeholder="Buscar cuenta...">
            <select id="account_select" class="form-select" size="8" style="height: 250px;">
              <option value="">Seleccione una cuenta</option>
            </select>
          </div>
        </div>
      `,
      width: 600,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      didOpen: () => {
        const typeNone = document.getElementById('typeNone') as HTMLInputElement;
        const typeInventario = document.getElementById('typeInventario') as HTMLInputElement;
        const typeGasto = document.getElementById('typeGasto') as HTMLInputElement;
        const accountSelect = document.getElementById('account_select') as HTMLSelectElement;
        const accountSearch = document.getElementById('account_search') as HTMLInputElement;
        const accountContainer = document.getElementById('accountSelectContainer') as HTMLDivElement;

        let allOptions: { value: string; text: string }[] = [];

        const updateAccountSelect = (type: string, selectedId: number | null = null) => {
          if (type === 'none') {
            accountContainer.style.display = 'none';
            accountSelect.innerHTML = '<option value="">Seleccione una cuenta</option>';
            allOptions = [];
          } else {
            accountContainer.style.display = 'block';
            const accounts = type === 'inventario' ? this.accountsInventario : this.accountsGasto;
            
            // Guardar todas las opciones
            allOptions = accounts.map(acc => ({
              value: acc.id.toString(),
              text: `${acc.account_number} - ${acc.full_name}`
            }));

            // Renderizar opciones
            accountSelect.innerHTML = '<option value="">Seleccione una cuenta</option>' + 
              allOptions.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
            
            // Pre-seleccionar la cuenta actual si existe
            if (selectedId) {
              accountSelect.value = selectedId.toString();
            }
            
            // Limpiar búsqueda
            accountSearch.value = '';
          }
        };

        // Función de búsqueda
        accountSearch.addEventListener('input', (e) => {
          const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
          const currentValue = accountSelect.value;
          
          const filtered = allOptions.filter(opt => 
            opt.text.toLowerCase().includes(searchTerm)
          );
          
          accountSelect.innerHTML = '<option value="">Seleccione una cuenta</option>' +
            filtered.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
          
          // Restaurar selección si aún existe en los filtrados
          if (currentValue && filtered.some(opt => opt.value === currentValue)) {
            accountSelect.value = currentValue;
          }
        });

        // Inicializar select con tipo actual y cuenta seleccionada
        updateAccountSelect(currentType, currentAccountId);

        // Event listeners para cambio de tipo
        typeNone.addEventListener('change', () => updateAccountSelect('none'));
        typeInventario.addEventListener('change', () => updateAccountSelect('inventario'));
        typeGasto.addEventListener('change', () => updateAccountSelect('gasto'));
      },
      preConfirm: () => {
        const selectedType = (document.querySelector('input[name="accountType"]:checked') as HTMLInputElement)?.value;
        const accountSelect = document.getElementById('account_select') as HTMLSelectElement;
        
        if (selectedType === 'none') {
          return {
            account_type: null,
            account_id: null
          };
        }
        
        if (!accountSelect.value) {
          Swal.showValidationMessage('Por favor selecciona una cuenta');
          return false;
        }
        
        return {
          account_type: selectedType as 'inventario' | 'gasto',
          account_id: parseInt(accountSelect.value)
        };
      }
    });

    if (formValues) {
      this.updateCategory(category.id, formValues);
    }
  }

  /**
   * Cargar las cuentas disponibles
   */
  private async loadAccounts(): Promise<void> {
    return new Promise((resolve, reject) => {
      Swal.fire({
        title: 'Cargando cuentas...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.categoryService.getAccounts().subscribe({
        next: (response) => {
          if (response.success) {
            this.accountsInventario = response.data.inventario;
            this.accountsGasto = response.data.gasto;
          }
          Swal.close();
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar cuentas:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las cuentas disponibles'
          });
          reject(error);
        }
      });
    });
  }

  /**
   * Actualizar categoría
   */
  private updateCategory(categoryId: number, data: any) {
    console.log('🔵 updateCategory - ID:', categoryId, '| Data:', data);
    
    Swal.fire({
      title: 'Actualizando categoría...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.categoryService.updateCategory(categoryId, data).subscribe({
      next: (response) => {
        console.log('✅ Categoría actualizada - Response:', response);
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: response.message || 'Categoría actualizada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        
        console.log('📤 Emitiendo evento categoryUpdated...');
        // Emitir evento para que el padre recargue los datos
        this.categoryUpdated.emit();
      },
      error: (error) => {
        console.error('Error al actualizar categoría:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo actualizar la categoría'
        });
      }
    });
  }
}
