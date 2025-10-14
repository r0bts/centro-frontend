import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';

interface ConfigSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  active: boolean;
}

interface SystemConfig {
  siteName: string;
  adminEmail: string;
  maxFileSize: number;
  sessionTimeout: number;
  enableNotifications: boolean;
  enableTwoFactor: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupInterval: number;
  themeMode: 'light' | 'dark' | 'auto';
  language: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
}

interface RoleUser {
  userId: string;
  userName: string;
  email: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.scss']
})
export class ConfiguracionComponent implements OnInit {
  activeSection = 'general';
  
  configSections: ConfigSection[] = [
    {
      id: 'general',
      title: 'Configuración General',
      icon: 'bi-gear',
      description: 'Configuraciones básicas del sistema',
      active: true
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: 'bi-shield-check',
      description: 'Configuraciones de seguridad y autenticación',
      active: false
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'bi-bell',
      description: 'Configurar alertas y notificaciones',
      active: false
    },
    {
      id: 'backup',
      title: 'Respaldos',
      icon: 'bi-cloud-upload',
      description: 'Configuración de copias de seguridad',
      active: false
    },
    {
      id: 'users',
      title: 'Gestión de Usuarios',
      icon: 'bi-people',
      description: 'Configuraciones de usuarios y permisos',
      active: false
    },
    {
      id: 'roles',
      title: 'Roles y Permisos',
      icon: 'bi-shield-check',
      description: 'Administración de roles y permisos del sistema',
      active: false
    },
    {
      id: 'products',
      title: 'Productos',
      icon: 'bi-box',
      description: 'Configuración de productos y centros de consumo',
      active: false
    },
    {
      id: 'netsuite',
      title: 'Sincronización NetSuite',
      icon: 'bi-cloud-arrow-up',
      description: 'Configuración de integración con NetSuite',
      active: false
    },
    {
      id: 'system',
      title: 'Sistema',
      icon: 'bi-cpu',
      description: 'Configuraciones avanzadas del sistema',
      active: false
    }
  ];

  systemConfig: SystemConfig = {
    siteName: 'Centro de Control',
    adminEmail: 'admin@centro.com',
    maxFileSize: 10,
    sessionTimeout: 30,
    enableNotifications: true,
    enableTwoFactor: false,
    maintenanceMode: false,
    autoBackup: true,
    backupInterval: 24,
    themeMode: 'light',
    language: 'es'
  };

  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  // Datos para roles y permisos
  permissions: Permission[] = [
    // Dashboard
    { id: 'dashboard-view', name: 'Ver Dashboard', description: 'Acceso al panel principal', module: 'dashboard' },
    
    // Usuarios
    { id: 'users-view', name: 'Ver Usuarios', description: 'Ver lista de usuarios', module: 'usuarios' },
    { id: 'users-create', name: 'Crear Usuario', description: 'Crear nuevos usuarios', module: 'usuarios' },
    { id: 'users-edit', name: 'Editar Usuario', description: 'Modificar usuarios existentes', module: 'usuarios' },
    { id: 'users-delete', name: 'Eliminar Usuario', description: 'Eliminar usuarios del sistema', module: 'usuarios' },
    
    // Empleados
    { id: 'employees-view', name: 'Ver Empleados', description: 'Ver lista de empleados', module: 'empleados' },
    { id: 'employees-create', name: 'Crear Empleado', description: 'Crear nuevos empleados', module: 'empleados' },
    { id: 'employees-edit', name: 'Editar Empleado', description: 'Modificar empleados existentes', module: 'empleados' },
    { id: 'employees-delete', name: 'Eliminar Empleado', description: 'Eliminar empleados del sistema', module: 'empleados' },
    
    // Requisiciones
    { id: 'requisitions-view', name: 'Ver Requisiciones', description: 'Ver lista de requisiciones', module: 'requisiciones' },
    { id: 'requisitions-create', name: 'Crear Requisición', description: 'Crear nuevas requisiciones', module: 'requisiciones' },
    { id: 'requisitions-approve', name: 'Aprobar Requisición', description: 'Aprobar requisiciones pendientes', module: 'requisiciones' },
    { id: 'requisitions-supply', name: 'Surtir Requisición', description: 'Surtir requisiciones aprobadas', module: 'requisiciones' },
    { id: 'requisitions-receive', name: 'Recibir Requisición', description: 'Recibir requisiciones surtidas', module: 'requisiciones' },
    
    // Reportes
    { id: 'reports-view', name: 'Ver Reportes', description: 'Acceso a reportes del sistema', module: 'reportes' },
    { id: 'reports-export', name: 'Exportar Reportes', description: 'Exportar reportes en diferentes formatos', module: 'reportes' },
    
    // Documentos
    { id: 'documents-view', name: 'Ver Documentos', description: 'Ver lista de documentos', module: 'documentos' },
    { id: 'documents-upload', name: 'Subir Documentos', description: 'Subir nuevos documentos', module: 'documentos' },
    { id: 'documents-download', name: 'Descargar Documentos', description: 'Descargar documentos del sistema', module: 'documentos' },
    { id: 'documents-delete', name: 'Eliminar Documentos', description: 'Eliminar documentos del sistema', module: 'documentos' },
    
    // Configuración
    { id: 'config-view', name: 'Ver Configuración', description: 'Acceso a configuraciones del sistema', module: 'configuracion' },
    { id: 'config-edit', name: 'Editar Configuración', description: 'Modificar configuraciones del sistema', module: 'configuracion' },
    { id: 'config-roles', name: 'Gestionar Roles', description: 'Crear y modificar roles y permisos', module: 'configuracion' }
  ];

  roles: Role[] = [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      permissions: [
        'dashboard-view', 'users-view', 'users-create', 'users-edit', 'users-delete',
        'employees-view', 'employees-create', 'employees-edit', 'employees-delete',
        'requisitions-view', 'requisitions-create', 'requisitions-approve', 'requisitions-supply', 'requisitions-receive',
        'reports-view', 'reports-export', 'documents-view', 'documents-upload', 'documents-download', 'documents-delete',
        'config-view', 'config-edit', 'config-roles'
      ],
      isActive: true,
      isSystem: true,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Supervisión de operaciones y reportes',
      permissions: [
        'dashboard-view', 'employees-view', 'requisitions-view', 'requisitions-approve',
        'reports-view', 'reports-export', 'documents-view', 'documents-download'
      ],
      isActive: true,
      isSystem: false,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'empleado',
      name: 'Empleado',
      description: 'Operaciones básicas del sistema',
      permissions: [
        'dashboard-view', 'requisitions-view', 'requisitions-create',
        'documents-view', 'documents-download'
      ],
      isActive: true,
      isSystem: false,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'almacen',
      name: 'Almacén',
      description: 'Gestión de almacén y surtido',
      permissions: [
        'dashboard-view', 'requisitions-view', 'requisitions-supply', 'requisitions-receive',
        'reports-view', 'documents-view', 'documents-upload'
      ],
      isActive: true,
      isSystem: false,
      createdAt: new Date('2024-01-20')
    }
  ];

  roleUsers: RoleUser[] = [
    { userId: '1', userName: 'Roberto Admin', email: 'roberto@centro.com', role: 'admin', isActive: true },
    { userId: '2', userName: 'María Supervisor', email: 'maria@centro.com', role: 'supervisor', isActive: true },
    { userId: '3', userName: 'Juan Empleado', email: 'juan@centro.com', role: 'empleado', isActive: true },
    { userId: '4', userName: 'Ana Almacén', email: 'ana@centro.com', role: 'almacen', isActive: true }
  ];

  selectedRole: Role | null = null;
  newRole: Partial<Role> = {};
  showRoleModal = false;
  editingRole = false;
  activeRoleTab = 'roles'; // Para manejar las pestañas

  themeModes = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'auto', label: 'Automático' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('✅ ConfiguracionComponent initialized');
    
    // Detectar la sección desde la URL
    const urlPath = this.router.url;
    if (urlPath.includes('/configuracion/roles')) {
      this.setActiveSection('roles');
    } else if (urlPath.includes('/configuracion/usuarios')) {
      this.setActiveSection('users');
    } else if (urlPath.includes('/configuracion/productos')) {
      this.setActiveSection('products');
    } else if (urlPath.includes('/configuracion/netsuite')) {
      this.setActiveSection('netsuite');
    } else if (urlPath.includes('/configuracion/general')) {
      this.setActiveSection('general');
    }
  }

  setActiveSection(sectionId: string): void {
    this.configSections.forEach(section => {
      section.active = section.id === sectionId;
    });
    this.activeSection = sectionId;
  }

  saveConfiguration(): void {
    console.log('💾 Guardando configuración:', this.systemConfig);
    // Aquí implementarías la lógica para guardar en el backend
    alert('Configuración guardada exitosamente');
  }

  resetToDefaults(): void {
    if (confirm('¿Estás seguro de que deseas restaurar la configuración por defecto?')) {
      this.systemConfig = {
        siteName: 'Centro de Control',
        adminEmail: 'admin@centro.com',
        maxFileSize: 10,
        sessionTimeout: 30,
        enableNotifications: true,
        enableTwoFactor: false,
        maintenanceMode: false,
        autoBackup: true,
        backupInterval: 24,
        themeMode: 'light',
        language: 'es'
      };
      console.log('🔄 Configuración restaurada a valores por defecto');
    }
  }

  exportConfiguration(): void {
    const configJson = JSON.stringify(this.systemConfig, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'configuracion-sistema.json';
    link.click();
    window.URL.revokeObjectURL(url);
    console.log('📤 Configuración exportada');
  }

  testConnection(): void {
    console.log('🔗 Probando conexión...');
    // Simulación de prueba de conexión
    setTimeout(() => {
      alert('Conexión exitosa ✅');
    }, 1000);
  }

  createBackup(): void {
    console.log('💾 Creando respaldo manual...');
    // Simulación de creación de backup
    setTimeout(() => {
      alert('Respaldo creado exitosamente ✅');
    }, 2000);
  }

  testNotifications(): void {
    console.log('🔔 Enviando notificación de prueba...');
    // Simulación de envío de notificación
    setTimeout(() => {
      alert('Notificación de prueba enviada ✅');
    }, 500);
  }

  viewLogs(): void {
    console.log('📋 Abriendo logs del sistema...');
    // Aquí implementarías la visualización de logs
  }

  clearCache(): void {
    if (confirm('¿Estás seguro de que deseas limpiar la caché del sistema?')) {
      console.log('🧹 Limpiando caché...');
      setTimeout(() => {
        alert('Caché limpiada exitosamente ✅');
      }, 1000);
    }
  }

  restartSystem(): void {
    if (confirm('¿Estás seguro de que deseas reiniciar el sistema? Esto afectará a todos los usuarios conectados.')) {
      console.log('🔄 Reiniciando sistema...');
      alert('Comando de reinicio enviado. El sistema se reiniciará en 2 minutos.');
    }
  }

  // Métodos para gestión de roles y permisos
  getRoleById(roleId: string): Role | undefined {
    return this.roles.find(role => role.id === roleId);
  }

  getPermissionsByModule(module: string): Permission[] {
    return this.permissions.filter(permission => permission.module === module);
  }

  getModules(): string[] {
    return [...new Set(this.permissions.map(p => p.module))];
  }

  hasPermission(roleId: string, permissionId: string): boolean {
    const role = this.getRoleById(roleId);
    return role ? role.permissions.includes(permissionId) : false;
  }

  openRoleModal(role?: Role): void {
    this.editingRole = !!role;
    if (role) {
      this.selectedRole = role;
      this.newRole = { ...role };
    } else {
      this.selectedRole = null;
      this.newRole = {
        name: '',
        description: '',
        permissions: [],
        isActive: true,
        isSystem: false
      };
    }
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.selectedRole = null;
    this.newRole = {};
    this.editingRole = false;
  }

  saveRole(): void {
    if (!this.newRole.name || !this.newRole.description) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (this.editingRole && this.selectedRole) {
      // Editar rol existente
      const index = this.roles.findIndex(r => r.id === this.selectedRole!.id);
      if (index !== -1) {
        this.roles[index] = {
          ...this.selectedRole,
          ...this.newRole,
          id: this.selectedRole.id
        } as Role;
      }
      console.log('✅ Rol actualizado:', this.newRole.name);
    } else {
      // Crear nuevo rol
      const newRole: Role = {
        id: this.generateRoleId(),
        name: this.newRole.name!,
        description: this.newRole.description!,
        permissions: this.newRole.permissions || [],
        isActive: this.newRole.isActive !== false,
        isSystem: false,
        createdAt: new Date()
      };
      this.roles.push(newRole);
      console.log('✅ Nuevo rol creado:', newRole.name);
    }

    this.closeRoleModal();
  }

  deleteRole(roleId: string): void {
    const role = this.getRoleById(roleId);
    if (!role) return;

    if (role.isSystem) {
      alert('No se pueden eliminar roles del sistema');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"?`)) {
      this.roles = this.roles.filter(r => r.id !== roleId);
      // También remover usuarios con este rol
      this.roleUsers = this.roleUsers.filter(ru => ru.role !== roleId);
      console.log('🗑️ Rol eliminado:', role.name);
    }
  }

  toggleRoleStatus(roleId: string): void {
    const role = this.getRoleById(roleId);
    if (role && !role.isSystem) {
      role.isActive = !role.isActive;
      console.log(`🔄 Estado del rol "${role.name}" cambiado a:`, role.isActive ? 'Activo' : 'Inactivo');
    }
  }

  togglePermission(permissionId: string): void {
    if (!this.newRole.permissions) {
      this.newRole.permissions = [];
    }

    const index = this.newRole.permissions.indexOf(permissionId);
    if (index > -1) {
      this.newRole.permissions.splice(index, 1);
    } else {
      this.newRole.permissions.push(permissionId);
    }
  }

  hasNewRolePermission(permissionId: string): boolean {
    return this.newRole.permissions?.includes(permissionId) || false;
  }

  changeUserRole(userId: string, newRoleId: string): void {
    const userIndex = this.roleUsers.findIndex(ru => ru.userId === userId);
    if (userIndex !== -1) {
      this.roleUsers[userIndex].role = newRoleId;
      console.log('👤 Rol de usuario actualizado');
    }
  }

  private generateRoleId(): string {
    return 'role_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  setActiveRoleTab(tab: string): void {
    this.activeRoleTab = tab;
  }
}