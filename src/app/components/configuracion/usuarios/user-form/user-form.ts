import { Component, OnInit, OnChanges, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../../../services/product.service';
import { UserService } from '../../../../services/user.service';
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
  location_id: string;
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
  allowed_permissions?: number[]; // Array de IDs de permisos permitidos para este submódulo
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
  @Input() userId: string | null = null;
  @Input() isEditMode = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  isLoadingProducts = true; // 🔥 Estado de carga de productos

  // Formulario de usuario
  userForm: UserForm = {
    username: '',
    nombre: '',
    departamento: '',
    location_id: '',
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
  availableDepartments: { id: string; name: string; }[] = [];

  // Locations disponibles
  availableLocations: { id: string; name: string; }[] = [
    { id: '0', name: 'Corporativo' }
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
  productCategories: string[] = ['Mantenimiento', 'Cafetería', 'Limpieza', 'Papelería', 'Obras de arte'];
  
  // Cache para categorías filtradas (evitar NG0100)
  private _cachedCategories: string[] | null = null;
  private _lastSelectedCategory: string | null = null;

  // ========================================
  // 🔥 DATOS DINÁMICOS DESDE EL BACKEND
  // ========================================
  // Estos datos se cargan desde GET /api/modules/structure
  modules: Module[] = [];
  submodules: Submodule[] = [];
  dbPermissions: DbPermission[] = [];
  private submodulePermissionsConfig: { [key: number]: number[] } = {};
  private permissionsStructureLoaded = false;

  /* ========================================
   * 📝 CÓDIGO COMENTADO - DATOS HARDCODED
   * ========================================
   * Este código fue reemplazado por carga dinámica desde el backend
   * Endpoint: GET /api/modules/structure
   * ========================================
   
  // Estructura de módulos y submódulos (igual que en role-form)
  // Estructura real de la base de datos (IGUAL QUE ROLE-FORM)
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

  // Configuración de permisos permitidos por submódulo (IGUAL QUE ROLE-FORM)
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
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 🔥 Cargar estructura de permisos desde el backend PRIMERO
    this.loadPermissionsStructure();
    
    // 🔥 Cargar datos del formulario (roles, departamentos, locations)
    this.loadFormData();
    
    // 🔥 NO cargar productos automáticamente
    // Solo cargar cuando el usuario vaya a la pestaña de productos
    
    // 🔥 NO cargar datos de usuario aquí
    // Los datos se cargan en ngOnChanges cuando userId está disponible
  }

  ngOnChanges(): void {
    if (this.userId) {
      this.loadUserData();
    } else {
      // Limpiar formulario para nuevo usuario
      this.clearForm();
    }
  }

  /**
   * 🔥 Cargar productos SOLO cuando el usuario hace click en la pestaña
   * Este método se llama desde el HTML cuando se activa la pestaña de productos
   */
  onProductsTabActivated(): void {
    // Si ya cargamos los productos, no volver a cargar
    if (this.availableProducts.length > 0) {
      this.isLoadingProducts = false; // 🔥 Asegurar que el spinner se apague
      this.cdr.detectChanges();
      return;
    }
    
    // 🔥 Siempre cargar productos con categorías desde getAllProducts
    this.loadProducts();
  }

  /**
   * 🔥 Cargar estructura de permisos desde el backend
   * Endpoint: GET /api/modules/structure
   * Usa RoleService porque es el mismo endpoint
   */
  private loadPermissionsStructure(): void {
    
    // Importar RoleService dinámicamente para evitar dependencia circular
    import('../../../../services/role.service').then(({ RoleService }) => {
      // Crear instancia temporal del servicio
      const roleService = new RoleService(this.productService['http']);
      
      roleService.getPermissionsStructure().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            
            // Cargar módulos
            this.modules = response.data.modules || [];
            
            // Cargar permisos
            this.dbPermissions = response.data.permissions || [];
            
            // Cargar submódulos Y construir la configuración de permisos
            this.submodules = response.data.submodules || [];
            this.submodulePermissionsConfig = {};
            
            // Construir el objeto submodulePermissionsConfig desde allowed_permissions
            this.submodules.forEach((submodule: any) => {
              if (submodule.allowed_permissions && Array.isArray(submodule.allowed_permissions)) {
                this.submodulePermissionsConfig[submodule.id] = submodule.allowed_permissions;
              }
            });
            
            // 🔥 Marcar estructura como cargada
            this.permissionsStructureLoaded = true;
            
            // 🔥 Forzar detección de cambios para renderizar la estructura
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('❌ [USER-FORM] Error al cargar estructura de permisos:', error);
        }
      });
    });
  }

  /**
   * 🔥 Cargar datos del formulario de usuarios (roles, departamentos, locations)
   * Endpoint: GET /api/users/form-data
   */
  private loadFormData(): void {
    this.userService.getUserFormData().subscribe({
      next: (data) => {
        // Cargar roles CON sus permisos y productos
        if (data.roles?.items) {
          
          this.availableRoles = data.roles.items.map((role: any) => {
            
            return {
              id: role.id,
              name: role.name,
              display_name: role.display_name,
              description: role.description,
              is_active: true,
              permissions: role.permissions || [],
              products: role.products || [] // 🔥 Agregar productos del rol
            };
          });

        // 🔥 Cargar productos de cada rol desde GET /api/roles/{id}
        this.availableRoles.forEach((role) => {
          this.loadRoleProductsFromApi(role.id);
        });
        }
        
        // Cargar departamentos
        if (data.departments?.items) {
          this.availableDepartments = data.departments.items.map((dept: any) => ({
            id: dept.id,
            name: dept.name
          }));
        }
        
        // Cargar locations
        if (data.locations?.items) {
          this.availableLocations = data.locations.items.map((loc: any) => ({
            id: loc.id,
            name: loc.name
          }));
        }
        
        // 🔥 Cargar productos disponibles desde form-data
        if (data.products?.items) {
          // Solo usar form-data como reference, cargar completos con categoría desde getAllProducts
          // NO cargar aquí, dejar que se carguen en loadProducts() cuando se active la pestaña
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ [USER-FORM] Error al cargar datos del formulario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos del formulario. Por favor, recarga la página.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  private loadUserData(): void {
    if (!this.userId) {
      this.clearForm();
      return;
    }

    
    // Mostrar loading
    Swal.fire({
      title: 'Cargando datos del usuario',
      text: 'Por favor espera...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.userService.getUserById(this.userId).subscribe({
      next: (userDetails) => {
        Swal.close();
        
        // Cargar datos del usuario desde userDetails
        const user = userDetails.user;
        
        this.userForm = {
          username: user.username || '',
          nombre: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          departamento: user.departmentId !== null && user.departmentId !== undefined ? String(user.departmentId) : '',
          location_id: user.locationId !== null && user.locationId !== undefined ? String(user.locationId) : '',
          status: user.isActive !== undefined ? user.isActive : true,
          id_netsuite: user.employeeNumber || '',
          rol_id: user.role?.id || ''
        };
        
        // 🔥 Cargar permisos del usuario DIRECTAMENTE desde la respuesta
        // El backend ya devuelve los permisos del usuario en userDetails.permissions
        this.userPermissions = userDetails.permissions || [];
        
        
        // 🔥 Si no hay permisos desde el backend pero hay rol_id, cargar permisos del rol (fallback)
        if (this.userPermissions.length === 0 && this.userForm.rol_id) {
          this.rolePermissions = [];
        } else {
          // Los permisos del rol son los mismos que los del usuario si no hay rol_id
          this.rolePermissions = JSON.parse(JSON.stringify(this.userPermissions));
        }
        
        // 🔥 Cargar productos asignados (asegurar que product_id sea string)
        if (userDetails.products && Array.isArray(userDetails.products)) {
          this.productAssignments = userDetails.products.map((p: any) => ({
            product_id: String(p.product_id),
            limit_per_requisition: p.limit_per_requisition || 0,
            is_assigned: p.is_assigned !== undefined ? p.is_assigned : true
          }));
        }
        
        // 🔥 Forzar detección de cambios para actualizar vista inmediatamente
        this.cdr.detectChanges();
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar usuario',
          text: error.message || 'No se pudieron cargar los datos del usuario',
          confirmButtonText: 'Entendido'
        });
        console.error('❌ Error al cargar usuario:', error);
      }
    });
  }

  private clearForm(): void {
    this.userForm = {
      username: '',
      nombre: '',
      departamento: '',
      location_id: '',
      status: true,
      id_netsuite: '',
      rol_id: ''
    };
    this.rolePermissions = [];
    this.userPermissions = [];
    this.productAssignments = [];
  }

  /**
   * Cargar TODOS los productos disponibles del sistema
   * Este método se ejecuta SOLO cuando el usuario hace click en la pestaña de productos
   */
  private loadProducts(): void {
    this.isLoadingProducts = true;
    
    this.productService.getAllProducts(5000, 1, undefined, true).subscribe({
      next: (products) => {
        this.availableProducts = products;
        this.filteredProducts = this.availableProducts;
        
        // 🔥 INVALIDAR EL CACHE
        this._cachedCategories = null;
        this._lastSelectedCategory = null;
        
        
        // 🔥 Ocultar spinner y forzar re-render
        this.isLoadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
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

  onRoleChange(): void {
    if (this.userForm.rol_id) {
      this.loadRolePermissions(this.userForm.rol_id);
      this.loadRoleProducts(this.userForm.rol_id); // 🔥 Cargar productos del rol
    } else {
      this.rolePermissions = [];
      this.userPermissions = [];
      this.productAssignments = []; // 🔥 Limpiar productos si no hay rol
    }
  }

  private loadRolePermissions(roleId: string): void {
    if (!roleId) {
      this.rolePermissions = [];
      this.userPermissions = [];
      return;
    }

    const selectedRole = this.availableRoles.find(r => String(r.id) === String(roleId));
    
    if (selectedRole && (selectedRole as any).permissions) {
      const permissions = (selectedRole as any).permissions;
      
      this.rolePermissions = permissions.map((perm: any) => ({
        submodule_id: perm.submodule_id,
        permission_id: perm.permission_id,
        is_granted: true
      }));
      
      this.userPermissions = [...this.rolePermissions];
      this.cdr.detectChanges();
    } else {
      this.rolePermissions = [];
      this.userPermissions = [];
    }
  }

  /**
   * 🔥 Cargar productos del rol directamente desde availableRoles (sincrónico)
   * Se usa cuando los datos ya están cargados en memoria
   */
  private loadRoleProductsDirectly(roleId: string): void {
    
    if (!roleId) {
      return;
    }

    const selectedRole = this.availableRoles.find(r => String(r.id) === String(roleId));
    
    if (selectedRole && (selectedRole as any).products && Array.isArray((selectedRole as any).products)) {
      const roleProducts = (selectedRole as any).products;
      
      
      // Auto-asignar productos del rol
      this.productAssignments = roleProducts.map((prod: any) => ({
        product_id: String(prod.product_id || prod.id),
        limit_per_requisition: prod.limit_per_requisition || 0,
        is_assigned: true
      }));
      
      this.cdr.detectChanges();
    } else {
      this.productAssignments = [];
    }
  }

  /**
   * 🔥 Cargar productos del rol desde el endpoint GET /api/roles/{roleId}
   * Este endpoint devuelve los productos asociados al rol
   */
  private loadRoleProductsFromApi(roleId: string): void {
    
    // Importar RoleService dinámicamente
    import('../../../../services/role.service').then(({ RoleService }) => {
      const roleService = new RoleService(this.productService['http']);
      
      roleService.getRoleById(roleId).subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.products) {
            
            // Actualizar el rol con sus productos
            const roleIndex = this.availableRoles.findIndex(r => r.id === roleId);
            if (roleIndex !== -1) {
              (this.availableRoles[roleIndex] as any).products = response.data.products;
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar productos del rol:', roleId, error);
        }
      });
    });
  }

  /**
   * 🔥 Cargar productos del rol seleccionado
   * Si el rol tiene productos asignados, auto-seleccionarlos en el formulario
   */
  private loadRoleProducts(roleId: string): void {
    
    if (!roleId) {
      this.productAssignments = [];
      return;
    }
    
    const selectedRole = this.availableRoles.find(r => String(r.id) === String(roleId));
    
    
    if (selectedRole && (selectedRole as any).products && Array.isArray((selectedRole as any).products)) {
      const roleProducts = (selectedRole as any).products;
      
      // Auto-asignar productos del rol
      this.productAssignments = roleProducts.map((prod: any) => {
        const assignment = {
          product_id: String(prod.product_id || prod.id),
          limit_per_requisition: prod.limit_per_requisition || 0,
          is_assigned: true
        };
        return assignment;
      });
      
      this.cdr.detectChanges();
    } else {
      this.productAssignments = [];
    }
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
      return products.filter(p => this.isProductAssigned(p.id));
    }
    
    return products;
  }

  getProductCategoriesWithProducts(): string[] {
    // Usar cache si el filtro no ha cambiado
    if (this._cachedCategories && this._lastSelectedCategory === this.selectedProductCategory) {
      return this._cachedCategories;
    }
    
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
    
    // Guardar en cache
    this._cachedCategories = categories;
    this._lastSelectedCategory = this.selectedProductCategory;
    
    return categories;
  }

  isProductAssigned(productId: string): boolean {
    const pId = String(productId);
    return this.productAssignments.some(pa => 
      String(pa.product_id) === pId && pa.is_assigned
    );
  }

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

  getSelectedRole(): Role | undefined {
    return this.availableRoles.find(r => r.id === this.userForm.rol_id);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    // Validaciones
    

    const userData = {
      ...this.userForm,
      permissions: this.userPermissions.filter(sp => sp.is_granted), // Los permisos personalizados del usuario
      products: this.productAssignments.filter(pa => pa.is_assigned) // Los productos asignados con límites
    };

    this.save.emit(userData);
  }
}
