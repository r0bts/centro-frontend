import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../../services/product.service';
import { RoleService } from '../../../../services/role.service';
import Swal from 'sweetalert2';

interface RoleForm {
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
}

interface SelectedPermission {
  submodule_id: number;
  permission_id: number;
  is_granted: boolean;
}

interface ProductAssignment {
  product_id: string;
  limit_per_requisition: number;
  is_assigned: boolean;
}

interface Module {
  id: number;
  name: string;
  display_name: string;
  icon?: string;
  route?: string;
  is_active: boolean;
}

interface Submodule {
  id: number;
  module_id: number;
  name: string;
  display_name: string;
  icon?: string;
  route?: string;
  is_active: boolean;
  allowed_permissions?: number[]; // Array de IDs de permisos permitidos para este submódulo
}

interface DbPermission {
  id: number;
  name: string;
  display_name: string;
  description: string;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.scss']
})
export class RoleFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() roleId: string | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  
  isLoading = false;
  isLoadingProducts = true; // 🔥 Estado de carga de productos

  // Formulario de rol
  roleForm: RoleForm = {
    name: '',
    display_name: '',
    description: '',
    is_default: false,
    is_active: true
  };

  // Permisos seleccionados para el formulario
  selectedPermissions: SelectedPermission[] = [];

  // Productos disponibles
  availableProducts: Product[] = [];
  filteredProducts: Product[] = [];
  
  // Filtros de productos
  productSearchTerm: string = '';
  selectedProductCategory: string = '';
  showOnlyAssignedProducts: boolean = false;
  
  // Asignación de productos
  productAssignments: ProductAssignment[] = [];
  
  // Categorías de productos
  productCategories: string[] = ['Mantenimiento', 'Cafetería', 'Limpieza', 'Papelería', 'Obras de arte'];

  // ========================================
  // 🔥 DATOS DINÁMICOS DESDE EL BACKEND
  // ========================================
  // Estos datos se cargan desde GET /api/modules/structure
  modules: Module[] = [];
  submodules: Submodule[] = [];
  dbPermissions: DbPermission[] = [];
  private submodulePermissionsConfig: { [key: number]: number[] } = {};

  /* ========================================
   * 📝 CÓDIGO COMENTADO - DATOS HARDCODED
   * ========================================
   * Este código fue reemplazado por carga dinámica desde el backend
   * Endpoint: GET /api/modules/structure
   * ========================================
   
  // Estructura real de la base de datos (HARDCODED - OBSOLETO)
  modules: Module[] = [
    { id: 1, name: 'dashboard', display_name: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard', is_active: true },
    { id: 2, name: 'reportes', display_name: 'Reportes', icon: 'bi-graph-up', route: '/reportes', is_active: true },
    { id: 3, name: 'almacen', display_name: 'Almacén', icon: 'bi-box-seam', route: '/almacen', is_active: true },
    { id: 4, name: 'configuracion', display_name: 'Configuración', icon: 'bi-gear-fill', route: '/configuracion', is_active: true }
  ];

  submodules: Submodule[] = [
    // Dashboard
    { id: 1, module_id: 1, name: 'dashboard_overview', display_name: 'Vista General', route: '/dashboard', is_active: true },
    
    // Reportes
    { id: 2, module_id: 2, name: 'reportes_historial', display_name: 'Historial de Requisiciones', route: '/reportes/historial', is_active: true },
    
    // Almacén
    { id: 5, module_id: 3, name: 'requisition', display_name: 'Requisiciones', route: '/requisition', is_active: true },
    { id: 6, module_id: 3, name: 'requisition_list', display_name: 'Lista de Requisiciones', route: '/requisition-list', is_active: true },
    { id: 7, module_id: 3, name: 'requisition_confirmation', display_name: 'Confirmación de Requisiciones', route: '/requisition-confirmation', is_active: true },
    { id: 14, module_id: 3, name: 'frequent_list', display_name: 'Plantilla de Frecuentes', route: '/frequent-templates', is_active: true },
    
    // Configuración
    { id: 8, module_id: 4, name: 'configuracion_general', display_name: 'Mi Perfil', route: '/configuracion/general', is_active: true },
    { id: 9, module_id: 4, name: 'usuarios', display_name: 'Usuarios', route: '/usuarios', is_active: true },
    { id: 10, module_id: 4, name: 'roles_permisos', display_name: 'Roles y Permisos', route: '/roles-permisos', is_active: true },
    { id: 11, module_id: 4, name: 'productos', display_name: 'Productos', route: '/productos', is_active: true },
    { id: 16, module_id: 4, name: 'netsuite_sync', display_name: 'Sincronización NetSuite', route: '/configuracion/netsuite', is_active: true },
  ];

  dbPermissions: DbPermission[] = [
    { id: 1, name: 'create', display_name: 'Crear', description: 'Permite crear nuevos registros' },
    { id: 2, name: 'view', display_name: 'Ver', description: 'Permite visualizar registros' },
    { id: 3, name: 'update', display_name: 'Editar', description: 'Permite modificar registros existentes' },
    { id: 4, name: 'delete', display_name: 'Eliminar', description: 'Permite eliminar registros' },
    { id: 5, name: 'events', display_name: 'Eventos', description: 'Permite gestionar eventos' },
    { id: 6, name: 'supply', display_name: 'Surtir', description: 'Permite gestionar almacén' },
    { id: 7, name: 'authorize', display_name: 'Autorizar', description: 'Permite autorizar requisiciones' },
    { id: 8, name: 'sync', display_name: 'Sincronizar', description: 'Permite sincronizar datos desde NetSuite' },
    { id: 9, name: 'return', display_name: 'Cerrar sin devolución', description: 'Permite cerrar requisiciones sin devolución' },
    { id: 10, name: 'frequent', display_name: 'Guardar como frecuente', description: 'Permite guardar requisiciones como plantillas frecuentes' },
    { id: 11, name: 'cancel', display_name: 'Cancelar', description: 'Permite cancelar requisiciones' },
    { id: 12, name: 'share', display_name: 'Compartir', description: 'Permite compartir registros' },
    { id: 13, name: 'copy', display_name: 'Copiar', description: 'Permite copiar/duplicar registros' },
    
    // Permisos específicos de sincronización NetSuite (cada uno independiente)
    { id: 14, name: 'sync_usuarios', display_name: 'Usuarios', description: 'Permite sincronizar usuarios desde NetSuite' },
    { id: 15, name: 'sync_productos', display_name: 'Productos', description: 'Permite sincronizar productos desde NetSuite' },
    { id: 16, name: 'sync_centros', display_name: 'Centros de Costo', description: 'Permite sincronizar centros de costo desde NetSuite' },
    { id: 17, name: 'sync_departamentos', display_name: 'Departamentos', description: 'Permite sincronizar departamentos desde NetSuite' },
    { id: 18, name: 'sync_categorias', display_name: 'Categorías', description: 'Permite sincronizar categorías desde NetSuite' },
    { id: 19, name: 'sync_subcategorias', display_name: 'Subcategorías', description: 'Permite sincronizar subcategorías desde NetSuite' },
  ];

  // Configuración de permisos permitidos por submódulo (HARDCODED - OBSOLETO)
  private submodulePermissionsConfig: { [key: number]: number[] } = {
    1: [2], // Dashboard Overview - solo permite "Ver"
    2: [2], // Reportes: Historial - solo permite "Ver"
    5: [1, 5], // Requisiciones - permite "Crear" y "Eventos"
    6: [3, 4, 6], // Lista de Requisiciones - permite "Editar", "Eliminar" y "Surtir"
    7: [7, 9, 10, 11], // Confirmación de Requisiciones - permite "Autorizar", "Devolución", "Frecuentes" y "Cancelar"
    8: [2, 3], // Mi Perfil - permite "Ver" y "Editar"
    9: [2, 3], // Usuarios - permite "Ver" y "Editar"
    10: [1, 2, 3, 4], // Roles y Permisos - permite "Crear", "Ver", "Editar" y "Eliminar"
    11: [2], // Productos - solo permite "Ver"
    14: [2, 3, 4, 12, 13], // Plantilla de Frecuentes - permite "Ver", "Editar", "Eliminar", "Compartir" y "Copiar"
    
    // NetSuite Sync - Un solo submódulo con múltiples permisos específicos
    16: [2, 14, 15, 16, 17, 18, 19], // Sincronización NetSuite - Ver + Sincronizar (Usuarios, Productos, Centros, Departamentos, Categorías, Subcategorías)
  };
  
  ======================================== */

  constructor(
    private productService: ProductService,
    private roleService: RoleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 🔥 Cargar estructura de permisos desde el backend PRIMERO
    this.loadPermissionsStructure();
    
    // 🔥 NO cargar productos automáticamente
    // Solo cargar cuando el usuario vaya a la pestaña de productos
    
    // Si es modo edición, cargar datos del rol (sin productos completos)
    if (this.isEditMode && this.roleId) {
      this.loadRoleData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roleId'] && !changes['roleId'].firstChange) {
      if (this.isEditMode && this.roleId) {
        this.loadRoleData();
      } else {
        this.resetForm();
      }
    }
  }

  /**
   * 🔥 Cargar productos SOLO cuando el usuario hace click en la pestaña
   * Este método se llama desde el HTML cuando se activa la pestaña de productos
   */
  onProductsTabActivated(): void {
    // Si ya cargamos los productos, no volver a cargar
    if (this.availableProducts.length > 0) {
      console.log('✅ Productos ya cargados, usando cache');
      return;
    }
    
    console.log('🔥 Pestaña de productos activada - cargando productos...');
    this.loadProducts();
  }

  /**
   * 🔥 Cargar estructura de permisos desde el backend
   * Endpoint: GET /api/modules/structure
   * Carga: modules, submodules, permissions y la configuración de permisos permitidos
   */
  private loadPermissionsStructure(): void {
    console.log('📡 Cargando estructura de permisos desde el backend...');
    
    this.roleService.getPermissionsStructure().subscribe({
      next: (response) => {
        // Aceptar tanto respuestas con { success, data } como respuestas directas { modules, submodules, permissions }
        const payload = response?.data ? response.data : response;

        this.modules = payload?.modules || [];
        this.dbPermissions = payload?.permissions || [];
        this.submodules = payload?.submodules || [];
        this.submodulePermissionsConfig = {};

        this.submodules.forEach((submodule: any) => {
          if (submodule.allowed_permissions && Array.isArray(submodule.allowed_permissions)) {
            this.submodulePermissionsConfig[submodule.id] = submodule.allowed_permissions;
          }
        });

        console.log('📋 Módulos cargados:', this.modules.length);
        console.log('📋 Submódulos cargados:', this.submodules.length);
        console.log('📋 Permisos cargados:', this.dbPermissions.length);
        console.log('🔐 Configuración de permisos:', this.submodulePermissionsConfig);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar estructura de permisos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la estructura de permisos. Por favor, recarga la página.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Cargar datos del rol para edición
   * Incluye: información básica, permisos asignados y productos asignados
   */
  private loadRoleData(): void {
    if (!this.roleId) return;
    
    this.isLoading = true;
    console.log(`🔄 Cargando datos del rol ID: ${this.roleId}...`);
    
    // Llamada real al API
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const roleData = response.data;
          
          // 1️⃣ Cargar datos básicos del rol
          this.roleForm = {
            name: roleData.name,
            display_name: roleData.display_name || roleData.name,
            description: roleData.description || '',
            is_default: roleData.is_default || false,
            is_active: roleData.is_active !== undefined ? roleData.is_active : true
          };
          
          // 2️⃣ Cargar permisos asignados
          if (roleData.permissions && Array.isArray(roleData.permissions)) {
            this.selectedPermissions = roleData.permissions.map((perm: any) => ({
              submodule_id: perm.submodule_id,
              permission_id: perm.permission_id,
              is_granted: perm.is_granted !== undefined ? perm.is_granted : true
            }));
            console.log(`✅ ${this.selectedPermissions.length} permisos cargados`);
          }
          
          // 3️⃣ Cargar SOLO productos asignados (no todos los productos)
          if (roleData.products && Array.isArray(roleData.products)) {
            this.productAssignments = roleData.products.map((prod: any) => ({
              product_id: String(prod.product_id),  // 🔥 Asegurar que sea string
              limit_per_requisition: prod.limit_per_requisition || 0,
              is_assigned: prod.is_assigned !== undefined ? prod.is_assigned : true
            }));
            console.log(`✅ ${this.productAssignments.length} productos asignados cargados`);
            console.log('📋 Productos asignados:', JSON.stringify(this.productAssignments, null, 2));
          }
          
          console.log('✅ Datos del rol cargados correctamente');
          
          // 🔥 Forzar la detección de cambios para actualizar la vista inmediatamente
          this.cdr.detectChanges();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar rol:', error);
        this.isLoading = false;
        
        // Manejar errores según el código de respuesta
        let errorTitle = 'Error al cargar rol';
        let errorMessage = 'No se pudieron cargar los datos del rol';
        
        if (error.status === 403) {
          errorTitle = 'Permiso Denegado';
          errorMessage = error.error?.message || 'No tienes permisos para realizar esta acción';
        } else if (error.status === 404) {
          errorTitle = 'Rol no encontrado';
          errorMessage = error.error?.message || 'El rol solicitado no existe';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonText: 'Entendido'
        }).then(() => {
          // Si es error de permisos o no encontrado, cerrar el formulario
          if (error.status === 403 || error.status === 404) {
            this.onCancel();
          }
        });
      }
    });
  }

  private resetForm(): void {
    this.roleForm = {
      name: '',
      display_name: '',
      description: '',
      is_default: false,
      is_active: true
    };
    this.selectedPermissions = [];
    this.productAssignments = [];
  }

  /**
   * Cargar TODOS los productos disponibles del sistema
   * Este método se ejecuta SOLO cuando el usuario hace click en la pestaña de productos
   */
  private loadProducts(): void {
    console.log('📦 Cargando TODOS los productos disponibles...');
    this.isLoadingProducts = true; // 🔥 Mostrar spinner
    
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.availableProducts = products.filter(p => p.isActive);
        this.filteredProducts = this.availableProducts;
        console.log(`✅ ${this.availableProducts.length} productos cargados desde la API`);
        
        // 🔥 Ocultar spinner y forzar re-render
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.isLoadingProducts = false; // 🔥 Ocultar spinner incluso en error
        this.cdr.detectChanges();
        
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar productos',
          text: error.message || 'No se pudieron cargar los productos del sistema',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  getSubmodulesByModule(moduleId: number) {
    return this.submodules.filter(sub => sub.module_id === moduleId);
  }

  // Obtiene los permisos disponibles para un submódulo específico
  getAvailablePermissions(submoduleId: number): DbPermission[] {
    const allowedPermissionIds = this.submodulePermissionsConfig[submoduleId];
    
    // Si el submódulo no tiene configuración especial, retorna todos los permisos
    if (!allowedPermissionIds) {
      return this.dbPermissions;
    }
    
    // Si tiene configuración, retorna solo los permisos permitidos
    return this.dbPermissions.filter(p => allowedPermissionIds.includes(p.id));
  }

  // Métodos para manejar permisos en el formulario
  hasPermission(submoduleId: number, permissionId: number): boolean {
    return this.selectedPermissions.some(sp => 
      sp.submodule_id === submoduleId && 
      sp.permission_id === permissionId && 
      sp.is_granted
    );
  }

  togglePermission(submoduleId: number, permissionId: number): void {
    const existingIndex = this.selectedPermissions.findIndex(sp => 
      sp.submodule_id === submoduleId && sp.permission_id === permissionId
    );

    if (existingIndex !== -1) {
      this.selectedPermissions[existingIndex].is_granted = !this.selectedPermissions[existingIndex].is_granted;
      if (!this.selectedPermissions[existingIndex].is_granted) {
        this.selectedPermissions.splice(existingIndex, 1);
      }
    } else {
      this.selectedPermissions.push({
        submodule_id: submoduleId,
        permission_id: permissionId,
        is_granted: true
      });
    }
  }

  toggleAllSubmodulePermissions(submoduleId: number): void {
    const availablePermissions = this.getAvailablePermissions(submoduleId);
    const submodulePermissions = this.selectedPermissions.filter(sp => sp.submodule_id === submoduleId);
    const allSelected = submodulePermissions.length === availablePermissions.length && 
                       submodulePermissions.every(sp => sp.is_granted);

    if (allSelected) {
      this.selectedPermissions = this.selectedPermissions.filter(sp => sp.submodule_id !== submoduleId);
    } else {
      availablePermissions.forEach(permission => {
        const existingIndex = this.selectedPermissions.findIndex(sp => 
          sp.submodule_id === submoduleId && sp.permission_id === permission.id
        );
        
        if (existingIndex !== -1) {
          this.selectedPermissions[existingIndex].is_granted = true;
        } else {
          this.selectedPermissions.push({
            submodule_id: submoduleId,
            permission_id: permission.id,
            is_granted: true
          });
        }
      });
    }
  }

  getSelectedPermissionsCount(submoduleId: number): number {
    return this.selectedPermissions.filter(sp => 
      sp.submodule_id === submoduleId && sp.is_granted
    ).length;
  }

  isSubmoduleIndeterminate(submoduleId: number): boolean {
    const selectedCount = this.getSelectedPermissionsCount(submoduleId);
    const availablePermissions = this.getAvailablePermissions(submoduleId);
    return selectedCount > 0 && selectedCount < availablePermissions.length;
  }

  isSubmoduleAllSelected(submoduleId: number): boolean {
    const availablePermissions = this.getAvailablePermissions(submoduleId);
    return this.getSelectedPermissionsCount(submoduleId) === availablePermissions.length;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    if (!this.roleForm.name || !this.roleForm.display_name || !this.roleForm.description) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: 'Por favor completa todos los campos obligatorios',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const roleData = {
      ...this.roleForm,
      permissions: this.selectedPermissions.filter(sp => sp.is_granted),
      products: this.productAssignments.filter(pa => pa.is_assigned)
    };

    this.save.emit(roleData);
  }

  // ==================== MÉTODOS PARA PRODUCTOS ====================
  
  getProductsByCategory(category: string): Product[] {
    let products = this.availableProducts.filter(p => p.category_name === category);
    
    // Aplicar filtro de búsqueda
    if (this.productSearchTerm.trim()) {
      const searchLower = this.productSearchTerm.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Aplicar filtro de solo asignados
    if (this.showOnlyAssignedProducts) {
      products = products.filter(p => this.isProductAssigned(p.id));
    }
    
    return products;
  }

  getProductCategoriesWithProducts(): string[] {
    const categories: string[] = [];
    
    for (const category of this.productCategories) {
      const productsInCategory = this.getProductsByCategory(category);
      
      // Aplicar filtro de categoría seleccionada
      if (this.selectedProductCategory && this.selectedProductCategory !== category) {
        continue;
      }
      
      if (productsInCategory.length > 0) {
        categories.push(category);
      }
    }
    
    return categories;
  }

  isProductAssigned(productId: string): boolean {
    // Debug: Ver todos los IDs disponibles (solo primeras 3 llamadas para no saturar)
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    
    if (this._debugCounter <= 3) {
      console.log(`🔍 Buscando producto ID: "${productId}" (tipo: ${typeof productId})`);
      console.log(`📦 ProductAssignments actuales:`, this.productAssignments.map(pa => 
        `ID:"${pa.product_id}" (tipo:${typeof pa.product_id}, assigned:${pa.is_assigned})`
      ));
    }
    
    const isAssigned = this.productAssignments.some(pa => {
      // Convertir ambos a string para comparación segura
      const paId = String(pa.product_id);
      const pId = String(productId);
      const match = paId === pId && pa.is_assigned;
      
      if (match && this._debugCounter <= 3) {
        console.log(`✅ MATCH ENCONTRADO! "${paId}" === "${pId}"`);
      }
      
      return match;
    });
    
    return isAssigned;
  }

  private _debugCounter = 0;

  toggleProductAssignment(productId: string): void {
    const existingIndex = this.productAssignments.findIndex(pa => String(pa.product_id) === String(productId));
    
    if (existingIndex !== -1) {
      this.productAssignments[existingIndex].is_assigned = !this.productAssignments[existingIndex].is_assigned;
      
      // Si se desasigna, limpiar el límite
      if (!this.productAssignments[existingIndex].is_assigned) {
        this.productAssignments[existingIndex].limit_per_requisition = 0;
      }
    } else {
      this.productAssignments.push({
        product_id: String(productId), // 🔥 Asegurar que sea string
        limit_per_requisition: 0,
        is_assigned: true
      });
    }
  }

  getProductLimit(productId: string): number {
    const assignment = this.productAssignments.find(pa => String(pa.product_id) === String(productId));
    return assignment ? assignment.limit_per_requisition : 0;
  }

  updateProductLimit(productId: string, event: any): void {
    const value = parseInt(event.target.value) || 0;
    const existingIndex = this.productAssignments.findIndex(pa => String(pa.product_id) === String(productId));
    
    if (existingIndex !== -1) {
      this.productAssignments[existingIndex].limit_per_requisition = value;
    } else {
      this.productAssignments.push({
        product_id: String(productId), // 🔥 Asegurar que sea string
        limit_per_requisition: value,
        is_assigned: true
      });
    }
  }

  isCategoryAllSelected(category: string): boolean {
    const productsInCategory = this.getProductsByCategory(category);
    if (productsInCategory.length === 0) return false;
    
    return productsInCategory.every(p => this.isProductAssigned(p.id));
  }

  isCategoryIndeterminate(category: string): boolean {
    const productsInCategory = this.getProductsByCategory(category);
    const assignedCount = productsInCategory.filter(p => this.isProductAssigned(p.id)).length;
    
    return assignedCount > 0 && assignedCount < productsInCategory.length;
  }

  toggleCategoryProducts(category: string): void {
    const productsInCategory = this.getProductsByCategory(category);
    const allSelected = this.isCategoryAllSelected(category);
    
    productsInCategory.forEach(product => {
      const existingIndex = this.productAssignments.findIndex(pa => pa.product_id === product.id);
      
      if (allSelected) {
        // Desasignar todos
        if (existingIndex !== -1) {
          this.productAssignments[existingIndex].is_assigned = false;
          this.productAssignments[existingIndex].limit_per_requisition = 0;
        }
      } else {
        // Asignar todos
        if (existingIndex !== -1) {
          this.productAssignments[existingIndex].is_assigned = true;
        } else {
          this.productAssignments.push({
            product_id: product.id,
            limit_per_requisition: 0,
            is_assigned: true
          });
        }
      }
    });
  }

  getAssignedProductsCountByCategory(category: string): number {
    return this.getProductsByCategory(category).filter(p => this.isProductAssigned(p.id)).length;
  }

  getTotalAssignedProducts(): number {
    return this.productAssignments.filter(pa => pa.is_assigned).length;
  }

  getCategoriesWithAssignedProducts(): number {
    const categoriesWithProducts = new Set<string>();
    
    this.productAssignments
      .filter(pa => pa.is_assigned)
      .forEach(pa => {
        const product = this.availableProducts.find(p => p.id === pa.product_id);
        if (product) {
          categoriesWithProducts.add(product.category_name);
        }
      });
    
    return categoriesWithProducts.size;
  }

  getProductsWithLimitsCount(): number {
    return this.productAssignments.filter(pa => pa.is_assigned && pa.limit_per_requisition > 0).length;
  }

  /**
   * Asignar TODOS los productos disponibles al rol
   * @param defaultLimit Límite por defecto para todos los productos (0 = sin límite)
   */
  assignAllProducts(defaultLimit: number = 0): void {
    this.productAssignments = this.availableProducts.map(product => ({
      product_id: product.id,
      limit_per_requisition: defaultLimit,
      is_assigned: true
    }));

    Swal.fire({
      icon: 'success',
      title: 'Productos Asignados',
      text: `Se han asignado ${this.availableProducts.length} productos al rol`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  /**
   * Desasignar TODOS los productos del rol
   */
  unassignAllProducts(): void {
    Swal.fire({
      title: '¿Desasignar todos los productos?',
      text: 'Esta acción quitará todos los productos asignados a este rol',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productAssignments = [];
        Swal.fire({
          icon: 'success',
          title: 'Productos Desasignados',
          text: 'Todos los productos han sido removidos',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }
}