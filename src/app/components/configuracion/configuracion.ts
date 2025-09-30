import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  constructor() {}

  ngOnInit(): void {
    console.log('✅ ConfiguracionComponent initialized');
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
}