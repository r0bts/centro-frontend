import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
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
  productCategories: string[] = ['Mantenimiento', 'Cafetería', 'Limpieza', 'Papelería'];

  // Estructura real de la base de datos
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
    { id: 13, module_id: 4, name: 'centro_costo', display_name: 'Centro de Costo', route: '/centro-costo', is_active: true },
    { id: 15, module_id: 4, name: 'departamento', display_name: 'Departamentos', route: '/departamento', is_active: true },
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
  ];

  // Configuración de permisos permitidos por submódulo
  private submodulePermissionsConfig: { [key: number]: number[] } = {
    1: [2], // Dashboard Overview - solo permite "Ver"
    2: [2], // Reportes: Historial - solo permite "Ver"
    5: [1, 5], // Requisiciones - permite "Crear" y "Eventos"
    6: [3, 4, 6], // Lista de Requisiciones - permite "Editar", "Eliminar" y "Surtir"
    7: [7, 9, 10, 11], // Confirmación de Requisiciones - permite "Autorizar", "Devolución", "Frecuentes" y "Cancelar"
    8: [2, 3], // Mi Perfil - permite "Ver" y "Editar"
    9: [2, 3, 8], // Usuarios - permite "Ver", "Editar" y "Sincronizar" (NO crear)
    10: [1, 2, 3, 4], // Roles y Permisos - permite "Crear", "Ver", "Editar" y "Eliminar"
    11: [2, 8], // Productos - permite "Ver" y "Sincronizar" (NO crear, editar, eliminar)
    13: [8], // Centro de Costo - solo permite "Sincronizar"
    14: [2, 3, 4, 12, 13], // Plantilla de Frecuentes - permite "Ver", "Editar", "Eliminar", "Compartir" y "Copiar"
    15: [8], // Departamento - solo permite "Sincronizar"
    16: [2, 8], // Sincronización NetSuite - permite "Ver" y "Sincronizar"
  };

  constructor(
    private productService: ProductService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
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

  private loadRoleData(): void {
    if (!this.roleId) return;
    
    this.isLoading = true;
    
    // 🔥 JSON HARDCODED PARA PRUEBAS - TODO: Reemplazar con API call
    const mockResponse = {
      success: true,
      message: "Rol obtenido exitosamente",
      data: {
        id: "1",
        name: "super_admin",
        display_name: "Super Administrador",
        description: "Acceso completo al sistema con todos los permisos",
        is_default: false,
        is_active: true,
        is_system: true,
        user_count: 5,
        created_at: "2024-01-15T10:30:00Z",
        permissions: [
          { submodule_id: 1, permission_id: 2, is_granted: true },  // Dashboard - Ver
          { submodule_id: 2, permission_id: 2, is_granted: true },  // Reportes - Ver
          { submodule_id: 5, permission_id: 1, is_granted: true },  // Requisiciones - Crear
          { submodule_id: 5, permission_id: 5, is_granted: true },  // Requisiciones - Eventos
          { submodule_id: 6, permission_id: 3, is_granted: true },  // Lista Requisiciones - Editar
          { submodule_id: 6, permission_id: 4, is_granted: true },  // Lista Requisiciones - Eliminar
          { submodule_id: 6, permission_id: 6, is_granted: true },  // Lista Requisiciones - Surtir
          { submodule_id: 7, permission_id: 7, is_granted: true },  // Confirmación - Autorizar
          { submodule_id: 8, permission_id: 2, is_granted: true },  // Mi Perfil - Ver
          { submodule_id: 8, permission_id: 3, is_granted: true },  // Mi Perfil - Editar
          { submodule_id: 9, permission_id: 2, is_granted: true },  // Usuarios - Ver
          { submodule_id: 9, permission_id: 3, is_granted: true },  // Usuarios - Editar
          { submodule_id: 10, permission_id: 1, is_granted: true }, // Roles - Crear
          { submodule_id: 10, permission_id: 2, is_granted: true }, // Roles - Ver
          { submodule_id: 10, permission_id: 3, is_granted: true }, // Roles - Editar
          { submodule_id: 10, permission_id: 4, is_granted: true }  // Roles - Eliminar
        ],
        products: []
      }
    };
    
    // Simular delay de red
    setTimeout(() => {
      const response = mockResponse;
      
      if (response.success && response.data) {
        const roleData = response.data;
        
        // Cargar datos básicos del rol
        this.roleForm = {
          name: roleData.name,
          display_name: roleData.display_name || roleData.name,
          description: roleData.description || '',
          is_default: roleData.is_default || false,
          is_active: roleData.is_active !== undefined ? roleData.is_active : true
        };
        
        // Cargar permisos si existen
        if (roleData.permissions && Array.isArray(roleData.permissions)) {
          this.selectedPermissions = roleData.permissions.map((perm: any) => ({
            submodule_id: perm.submodule_id,
            permission_id: perm.permission_id,
            is_granted: perm.is_granted !== undefined ? perm.is_granted : true
          }));
        }
        
        // Cargar productos asignados si existen
        if (roleData.products && Array.isArray(roleData.products)) {
          this.productAssignments = roleData.products.map((prod: any) => ({
            product_id: prod.product_id,
            limit_per_requisition: prod.limit_per_requisition || 0,
            is_assigned: true
          }));
        }
      }
      this.isLoading = false;
    }, 300);
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

  private loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.availableProducts = products.filter(p => p.isActive);
        this.filteredProducts = this.availableProducts;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
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
    let products = this.availableProducts.filter(p => p.category === category);
    
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
    return this.productAssignments.some(pa => pa.product_id === productId && pa.is_assigned);
  }

  toggleProductAssignment(productId: string): void {
    const existingIndex = this.productAssignments.findIndex(pa => pa.product_id === productId);
    
    if (existingIndex !== -1) {
      this.productAssignments[existingIndex].is_assigned = !this.productAssignments[existingIndex].is_assigned;
      
      // Si se desasigna, limpiar el límite
      if (!this.productAssignments[existingIndex].is_assigned) {
        this.productAssignments[existingIndex].limit_per_requisition = 0;
      }
    } else {
      this.productAssignments.push({
        product_id: productId,
        limit_per_requisition: 0,
        is_assigned: true
      });
    }
  }

  getProductLimit(productId: string): number {
    const assignment = this.productAssignments.find(pa => pa.product_id === productId);
    return assignment ? assignment.limit_per_requisition : 0;
  }

  updateProductLimit(productId: string, event: any): void {
    const value = parseInt(event.target.value) || 0;
    const existingIndex = this.productAssignments.findIndex(pa => pa.product_id === productId);
    
    if (existingIndex !== -1) {
      this.productAssignments[existingIndex].limit_per_requisition = value;
    } else {
      this.productAssignments.push({
        product_id: productId,
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
          categoriesWithProducts.add(product.category);
        }
      });
    
    return categoriesWithProducts.size;
  }

  getProductsWithLimitsCount(): number {
    return this.productAssignments.filter(pa => pa.is_assigned && pa.limit_per_requisition > 0).length;
  }
}