import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../../services/product.service';
import Swal from 'sweetalert2';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

interface UserForm {
  username: string;
  nombre: string;
  departamento: string;
  status: boolean;
  id_netsuite: string;
  rol_id: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
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

interface RolePermission {
  submodule_id: number;
  permission_id: number;
  is_granted: boolean;
}

interface ProductAssignment {
  product_id: string;
  limit_per_requisition: number;
  is_assigned: boolean;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss']
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() isEditMode = false;
  @Input() selectedUser: User | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  // Formulario de usuario
  userForm: UserForm = {
    username: '',
    nombre: '',
    departamento: '',
    status: true,
    id_netsuite: '',
    rol_id: ''
  };

  // Roles disponibles
  availableRoles: Role[] = [
    { id: '1', name: 'admin', display_name: 'Administrador', description: 'Acceso completo al sistema', is_active: true },
    { id: '2', name: 'manager', display_name: 'Gerente', description: 'Gestión de operaciones', is_active: true },
    { id: '3', name: 'supervisor', display_name: 'Supervisor', description: 'Supervisión de procesos', is_active: true },
    { id: '4', name: 'operator', display_name: 'Operador', description: 'Operaciones básicas', is_active: true },
    { id: '5', name: 'user', display_name: 'Usuario', description: 'Usuario estándar', is_active: true }
  ];

  // Departamentos disponibles
  availableDepartments: string[] = [
    'Administración',
    'Almacén',
    'Compras',
    'Recursos Humanos',
    'Sistemas',
    'Finanzas',
    'Operaciones',
    'Logística',
    'Calidad',
    'Producción'
  ];

  // Permisos del rol seleccionado (solo lectura)
  rolePermissions: RolePermission[] = [];

  // Permisos personalizados del usuario (editables)
  userPermissions: RolePermission[] = [];

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

  // Estructura de módulos y submódulos (igual que en role-form)
  modules: Module[] = [
    { id: 1, name: 'dashboard', display_name: 'Dashboard', icon: 'bi-speedometer2', route: '/dashboard', is_active: true },
    { id: 3, name: 'almacen', display_name: 'Almacén', icon: 'bi-box-seam', route: '/almacen', is_active: true },
    { id: 4, name: 'configuracion', display_name: 'Configuración', icon: 'bi-gear-fill', route: '/configuracion', is_active: true }
  ];

  submodules: Submodule[] = [
    // Dashboard
    { id: 1, module_id: 1, name: 'dashboard_overview', display_name: 'Vista General', route: '/dashboard', is_active: true },
    
    // Almacén
    { id: 5, module_id: 3, name: 'requisition', display_name: 'Requisiciones', route: '/requisition', is_active: true },
    { id: 6, module_id: 3, name: 'requisition_list', display_name: 'Lista de Requisiciones', route: '/requisition-list', is_active: true },
    { id: 7, module_id: 3, name: 'requisition_confirmation', display_name: 'Confirmación de Requisiciones', route: '/requisition-confirmation', is_active: true },
    { id: 14, module_id: 3, name: 'frequent_list', display_name: 'Plantilla de Frecuentes', route: '/frequent-templates', is_active: true },
    
    // Configuración
    { id: 8, module_id: 4, name: 'configuracion_general', display_name: 'Configuración General', route: '/configuracion', is_active: true },
    { id: 9, module_id: 4, name: 'usuarios', display_name: 'Usuarios', route: '/usuarios', is_active: true },
    { id: 10, module_id: 4, name: 'roles_permisos', display_name: 'Roles y Permisos', route: '/roles-permisos', is_active: true },
    { id: 11, module_id: 4, name: 'productos', display_name: 'Productos', route: '/productos', is_active: true },
    { id: 12, module_id: 4, name: 'reportes', display_name: 'Reportes', route: '/reportes', is_active: true },
    { id: 13, module_id: 4, name: 'centro_costo', display_name: 'Centro de Costo', route: '/centro-costo', is_active: true },
    { id: 15, module_id: 4, name: 'departamento', display_name: 'Departamentos', route: '/departamento', is_active: true },
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
    5: [1, 5], // Requisiciones - permite "Crear" y "Eventos"
    6: [3, 4, 6], // Lista de Requisiciones - permite "Editar", "Eliminar" y "Surtir"
    7: [7, 9, 10, 11], // Confirmación de Requisiciones - permite "Autorizar", "Devolución", "Frecuentes" y "Cancelar"
    8: [2, 3], // Configuración General - permite "Ver" y "Editar"
    9: [2, 3, 8], // Usuarios - permite "Ver", "Editar" y "Sincronizar" (NO crear)
    10: [1, 2, 3, 4], // Roles y Permisos - permite "Crear", "Ver", "Editar" y "Eliminar"
    11: [2, 8], // Productos - permite "Ver" y "Sincronizar" (NO crear, editar, eliminar)
    12: [2], // Reportes - solo permite "Ver"
    13: [8], // Centro de Costo - solo permite "Sincronizar"
    14: [2, 3, 4, 12, 13], // Plantilla de Frecuentes - permite "Ver", "Editar", "Eliminar", "Compartir" y "Copiar"
    15: [8], // Departamento - solo permite "Sincronizar"
  };

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProducts();
  }

  ngOnChanges(): void {
    this.loadUserData();
    this.loadProducts();
  }

  private loadUserData(): void {
    if (this.selectedUser && this.isEditMode) {
      // Cargar datos del usuario existente
      this.userForm = {
        username: this.selectedUser.username,
        nombre: `${this.selectedUser.firstName} ${this.selectedUser.lastName}`,
        departamento: '', // Aquí cargarías el departamento desde la BD
        status: this.selectedUser.isActive,
        id_netsuite: this.selectedUser.employeeNumber,
        rol_id: '' // Aquí cargarías el ID del rol desde la BD
      };
      // Cargar permisos del rol del usuario
      this.loadRolePermissions(this.userForm.rol_id);
    } else {
      // Limpiar formulario para nuevo usuario
      this.userForm = {
        username: '',
        nombre: '',
        departamento: '',
        status: true,
        id_netsuite: '',
        rol_id: ''
      };
      this.rolePermissions = [];
      this.userPermissions = [];
      this.productAssignments = [];
    }
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

  onRoleChange(): void {
    // Cargar permisos del rol seleccionado
    this.loadRolePermissions(this.userForm.rol_id);
  }

  private loadRolePermissions(roleId: string): void {
    if (!roleId) {
      this.rolePermissions = [];
      this.userPermissions = [];
      return;
    }

    // Aquí harías una llamada al backend para obtener los permisos del rol
    // Por ahora, simulamos permisos según el rol
    const rolePermissionsMap: { [key: string]: RolePermission[] } = {
      '1': [ // Administrador - todos los permisos
        { submodule_id: 1, permission_id: 2, is_granted: true },
        { submodule_id: 5, permission_id: 1, is_granted: true },
        { submodule_id: 5, permission_id: 5, is_granted: true },
        { submodule_id: 6, permission_id: 3, is_granted: true },
        { submodule_id: 6, permission_id: 4, is_granted: true },
        { submodule_id: 6, permission_id: 6, is_granted: true },
        { submodule_id: 7, permission_id: 7, is_granted: true },
        { submodule_id: 7, permission_id: 9, is_granted: true },
        { submodule_id: 7, permission_id: 10, is_granted: true },
        { submodule_id: 7, permission_id: 11, is_granted: true },
        { submodule_id: 8, permission_id: 2, is_granted: true },
        { submodule_id: 9, permission_id: 1, is_granted: true },
        { submodule_id: 9, permission_id: 2, is_granted: true },
        { submodule_id: 9, permission_id: 3, is_granted: true },
        { submodule_id: 9, permission_id: 4, is_granted: true },
        { submodule_id: 10, permission_id: 1, is_granted: true },
        { submodule_id: 10, permission_id: 2, is_granted: true },
        { submodule_id: 10, permission_id: 3, is_granted: true },
        { submodule_id: 10, permission_id: 4, is_granted: true },
        { submodule_id: 12, permission_id: 2, is_granted: true },
        { submodule_id: 13, permission_id: 2, is_granted: true },
        { submodule_id: 14, permission_id: 2, is_granted: true },
        { submodule_id: 14, permission_id: 3, is_granted: true },
        { submodule_id: 14, permission_id: 4, is_granted: true },
        { submodule_id: 14, permission_id: 12, is_granted: true }
      ],
      '2': [ // Gerente - permisos de gestión
        { submodule_id: 1, permission_id: 2, is_granted: true },
        { submodule_id: 5, permission_id: 1, is_granted: true },
        { submodule_id: 6, permission_id: 3, is_granted: true },
        { submodule_id: 7, permission_id: 7, is_granted: true },
        { submodule_id: 8, permission_id: 2, is_granted: true },
        { submodule_id: 12, permission_id: 2, is_granted: true }
      ],
      '3': [ // Supervisor - permisos intermedios
        { submodule_id: 1, permission_id: 2, is_granted: true },
        { submodule_id: 5, permission_id: 1, is_granted: true },
        { submodule_id: 6, permission_id: 3, is_granted: true },
        { submodule_id: 12, permission_id: 2, is_granted: true }
      ],
      '4': [ // Operador - permisos básicos
        { submodule_id: 1, permission_id: 2, is_granted: true },
        { submodule_id: 5, permission_id: 1, is_granted: true },
        { submodule_id: 6, permission_id: 3, is_granted: true }
      ],
      '5': [ // Usuario - solo lectura
        { submodule_id: 1, permission_id: 2, is_granted: true },
        { submodule_id: 8, permission_id: 2, is_granted: true }
      ]
    };

    this.rolePermissions = rolePermissionsMap[roleId] || [];
    // Copiar los permisos del rol a los permisos del usuario (personalizables)
    this.userPermissions = JSON.parse(JSON.stringify(this.rolePermissions));
  }

  getSubmodulesByModule(moduleId: number): Submodule[] {
    return this.submodules.filter(sub => sub.module_id === moduleId);
  }

  // Obtiene los permisos disponibles para un submódulo específico
  getAvailablePermissions(submoduleId: number): DbPermission[] {
    const allowedPermissionIds = this.submodulePermissionsConfig[submoduleId];
    
    if (!allowedPermissionIds) {
      return this.dbPermissions;
    }
    
    return this.dbPermissions.filter(p => allowedPermissionIds.includes(p.id));
  }

  // Verifica si el usuario tiene un permiso específico (heredado del rol)
  hasPermission(submoduleId: number, permissionId: number): boolean {
    return this.userPermissions.some(rp => 
      rp.submodule_id === submoduleId && 
      rp.permission_id === permissionId && 
      rp.is_granted
    );
  }

  // Métodos para manejar permisos en el formulario (editables)
  togglePermission(submoduleId: number, permissionId: number): void {
    const existingIndex = this.userPermissions.findIndex(sp => 
      sp.submodule_id === submoduleId && sp.permission_id === permissionId
    );

    if (existingIndex !== -1) {
      this.userPermissions[existingIndex].is_granted = !this.userPermissions[existingIndex].is_granted;
      if (!this.userPermissions[existingIndex].is_granted) {
        this.userPermissions.splice(existingIndex, 1);
      }
    } else {
      this.userPermissions.push({
        submodule_id: submoduleId,
        permission_id: permissionId,
        is_granted: true
      });
    }
  }

  toggleAllSubmodulePermissions(submoduleId: number): void {
    const availablePermissions = this.getAvailablePermissions(submoduleId);
    const submodulePermissions = this.userPermissions.filter(sp => sp.submodule_id === submoduleId);
    const allSelected = submodulePermissions.length === availablePermissions.length && 
                       submodulePermissions.every(sp => sp.is_granted);

    if (allSelected) {
      this.userPermissions = this.userPermissions.filter(sp => sp.submodule_id !== submoduleId);
    } else {
      availablePermissions.forEach(permission => {
        const existingIndex = this.userPermissions.findIndex(sp => 
          sp.submodule_id === submoduleId && sp.permission_id === permission.id
        );
        
        if (existingIndex !== -1) {
          this.userPermissions[existingIndex].is_granted = true;
        } else {
          this.userPermissions.push({
            submodule_id: submoduleId,
            permission_id: permission.id,
            is_granted: true
          });
        }
      });
    }
  }

  getSelectedPermissionsCount(submoduleId: number): number {
    return this.userPermissions.filter(sp => 
      sp.submodule_id === submoduleId && sp.is_granted
    ).length;
  }

  isSubmoduleAllSelected(submoduleId: number): boolean {
    const availablePermissions = this.getAvailablePermissions(submoduleId);
    return this.getSelectedPermissionsCount(submoduleId) === availablePermissions.length;
  }

  isSubmoduleIndeterminate(submoduleId: number): boolean {
    const selectedCount = this.getSelectedPermissionsCount(submoduleId);
    const availablePermissions = this.getAvailablePermissions(submoduleId);
    return selectedCount > 0 && selectedCount < availablePermissions.length;
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

  getSelectedRole(): Role | undefined {
    return this.availableRoles.find(r => r.id === this.userForm.rol_id);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    // Validaciones
    if (!this.userForm.username || !this.userForm.nombre || 
        !this.userForm.departamento || !this.userForm.rol_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: 'Por favor completa todos los campos obligatorios',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const userData = {
      ...this.userForm,
      permissions: this.userPermissions.filter(sp => sp.is_granted), // Los permisos personalizados del usuario
      products: this.productAssignments.filter(pa => pa.is_assigned) // Los productos asignados con límites
    };

    this.save.emit(userData);
  }
}
