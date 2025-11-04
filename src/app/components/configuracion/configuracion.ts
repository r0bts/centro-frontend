import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import { RolesPermisosComponent } from './roles-permisos/roles-permisos';
import Swal from 'sweetalert2';

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

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu, RolesPermisosComponent],
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
    Swal.fire({
      icon: 'success',
      title: '¡Configuración guardada!',
      text: 'La configuración ha sido guardada exitosamente',
      confirmButtonText: 'Continuar',
      timer: 2000,
      timerProgressBar: true
    });
  }

  resetToDefaults(): void {
    Swal.fire({
      title: '¿Restaurar configuración?',
      text: '¿Estás seguro de que deseas restaurar la configuración por defecto?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
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
        
        Swal.fire({
          icon: 'success',
          title: '¡Configuración restaurada!',
          text: 'La configuración ha sido restaurada a los valores por defecto',
          confirmButtonText: 'Continuar'
        });
      }
    });
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

  // Métodos específicos de configuración general
  testConnection(): void {
    console.log('🔗 Probando conexión...');
    // Simulación de prueba de conexión
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Conexión exitosa ✅',
        text: 'La conexión se ha establecido correctamente',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true
      });
    }, 1000);
  }

  createBackup(): void {
    console.log('💾 Creando respaldo manual...');
    // Simulación de creación de backup
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Respaldo creado exitosamente ✅',
        text: 'El respaldo del sistema se ha creado correctamente',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true
      });
    }, 2000);
  }

  testNotifications(): void {
    console.log('🔔 Enviando notificación de prueba...');
    // Simulación de envío de notificación
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: 'Notificación de prueba enviada ✅',
        text: 'La notificación de prueba se ha enviado correctamente',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true
      });
    }, 500);
  }

  viewLogs(): void {
    console.log('📋 Abriendo logs del sistema...');
    // Aquí implementarías la visualización de logs
  }

  clearCache(): void {
    Swal.fire({
      title: '¿Limpiar caché del sistema?',
      text: '¿Estás seguro de que deseas limpiar la caché del sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('🧹 Limpiando caché...');
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Caché limpiada exitosamente ✅',
            text: 'La caché del sistema ha sido limpiada correctamente',
            confirmButtonText: 'Continuar',
            timer: 3000,
            timerProgressBar: true
          });
        }, 1000);
      }
    });
  }

  restartSystem(): void {
    Swal.fire({
      title: '¿Reiniciar el sistema?',
      text: '¿Estás seguro de que deseas reiniciar el sistema? Esto afectará a todos los usuarios conectados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('🔄 Reiniciando sistema...');
        Swal.fire({
          icon: 'info',
          title: 'Comando de reinicio enviado',
          text: 'El sistema se reiniciará en 2 minutos.',
          confirmButtonText: 'Entendido',
          timer: 5000,
          timerProgressBar: true
        });
      }
    });
  }
}