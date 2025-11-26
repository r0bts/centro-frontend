import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

interface SyncStatus {
  type: 'users' | 'products' | 'costcenters' | 'departments';
  isLoading: boolean;
  lastSync?: Date;
  recordCount?: number;
}

// Interfaces para datos simulados
interface MockUser {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  department: string;
  position: string;
}

interface MockProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  description: string;
}

interface MockCostCenter {
  id: string;
  code: string;
  name: string;
  manager: string;
  budget: number;
}

interface MockDepartment {
  id: string;
  code: string;
  name: string;
  headCount: number;
  manager: string;
}

// Datos simulados
const MOCK_USERS: MockUser[] = [
  { id: '1', employeeNumber: 'EMP001', name: 'Juan Pérez', email: 'juan.perez@empresa.com', department: 'Sistemas', position: 'Desarrollador' },
  { id: '2', employeeNumber: 'EMP002', name: 'María García', email: 'maria.garcia@empresa.com', department: 'Administración', position: 'Gerente' },
  { id: '3', employeeNumber: 'EMP003', name: 'Carlos López', email: 'carlos.lopez@empresa.com', department: 'Ventas', position: 'Vendedor' },
  { id: '4', employeeNumber: 'EMP004', name: 'Ana Martínez', email: 'ana.martinez@empresa.com', department: 'RRHH', position: 'Analista' },
  { id: '5', employeeNumber: 'EMP005', name: 'Luis Rodríguez', email: 'luis.rodriguez@empresa.com', department: 'Sistemas', position: 'Líder Técnico' },
  { id: '6', employeeNumber: 'EMP006', name: 'Patricia Sánchez', email: 'patricia.sanchez@empresa.com', department: 'Ventas', position: 'Ejecutiva de Ventas' },
  { id: '7', employeeNumber: 'EMP007', name: 'Roberto Silva', email: 'roberto.silva@empresa.com', department: 'Sistemas', position: 'Director de TI' },
  { id: '8', employeeNumber: 'EMP008', name: 'Laura Gómez', email: 'laura.gomez@empresa.com', department: 'RRHH', position: 'Gerente de RRHH' },
];

const MOCK_PRODUCTS: MockProduct[] = [
  { id: '1', code: 'PROD-001', name: 'Laptop Dell Latitude 5420', category: 'Tecnología', unit: 'Pieza', description: 'Laptop empresarial' },
  { id: '2', code: 'PROD-002', name: 'Mouse Logitech MX Master', category: 'Tecnología', unit: 'Pieza', description: 'Mouse inalámbrico' },
  { id: '3', code: 'PROD-003', name: 'Papel Bond Carta', category: 'Papelería', unit: 'Resma', description: 'Resma 500 hojas' },
  { id: '4', code: 'PROD-004', name: 'Tóner HP LaserJet', category: 'Suministros', unit: 'Pieza', description: 'Tóner negro' },
  { id: '5', code: 'PROD-005', name: 'Silla Ergonómica', category: 'Mobiliario', unit: 'Pieza', description: 'Silla de oficina' },
  { id: '6', code: 'PROD-006', name: 'Monitor LG 27 pulgadas', category: 'Tecnología', unit: 'Pieza', description: 'Monitor Full HD' },
  { id: '7', code: 'PROD-007', name: 'Teclado Mecánico', category: 'Tecnología', unit: 'Pieza', description: 'Teclado RGB' },
  { id: '8', code: 'PROD-008', name: 'Bolígrafos Azules', category: 'Papelería', unit: 'Caja', description: 'Caja 50 unidades' },
  { id: '9', code: 'PROD-009', name: 'Escritorio Ejecutivo', category: 'Mobiliario', unit: 'Pieza', description: 'Escritorio L-shape' },
  { id: '10', code: 'PROD-010', name: 'Impresora Multifuncional', category: 'Tecnología', unit: 'Pieza', description: 'Impresora laser color' },
];

const MOCK_COST_CENTERS: MockCostCenter[] = [
  { id: '1', code: 'CC-001', name: 'Tecnología e Innovación', manager: 'Roberto Silva', budget: 500000 },
  { id: '2', code: 'CC-002', name: 'Recursos Humanos', manager: 'Laura Gómez', budget: 250000 },
  { id: '3', code: 'CC-003', name: 'Ventas y Marketing', manager: 'Pedro Ramírez', budget: 750000 },
  { id: '4', code: 'CC-004', name: 'Administración', manager: 'Sandra Torres', budget: 300000 },
  { id: '5', code: 'CC-005', name: 'Operaciones', manager: 'Miguel Ángel Hernández', budget: 450000 },
  { id: '6', code: 'CC-006', name: 'Finanzas', manager: 'Carmen Ramírez', budget: 350000 },
];

const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: '1', code: 'DEPT-001', name: 'Sistemas', headCount: 15, manager: 'Roberto Silva' },
  { id: '2', code: 'DEPT-002', name: 'Recursos Humanos', headCount: 8, manager: 'Laura Gómez' },
  { id: '3', code: 'DEPT-003', name: 'Ventas', headCount: 25, manager: 'Pedro Ramírez' },
  { id: '4', code: 'DEPT-004', name: 'Administración', headCount: 12, manager: 'Sandra Torres' },
  { id: '5', code: 'DEPT-005', name: 'Logística', headCount: 10, manager: 'Miguel Ángel Hernández' },
  { id: '6', code: 'DEPT-006', name: 'Finanzas', headCount: 7, manager: 'Carmen Ramírez' },
  { id: '7', code: 'DEPT-007', name: 'Marketing', headCount: 9, manager: 'Jorge Luis Méndez' },
];

@Component({
  selector: 'app-netsuite-sync',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './netsuite-sync.html',
  styleUrls: ['./netsuite-sync.scss']
})
export class NetsuiteSyncComponent implements OnInit {
  syncStatus: { [key: string]: SyncStatus } = {
    users: {
      type: 'users',
      isLoading: false,
      lastSync: new Date('2024-11-25T10:30:00'),
      recordCount: 45
    },
    products: {
      type: 'products',
      isLoading: false,
      lastSync: new Date('2024-11-25T11:15:00'),
      recordCount: 235
    },
    costcenters: {
      type: 'costcenters',
      isLoading: false,
      lastSync: new Date('2024-11-24T16:45:00'),
      recordCount: 18
    },
    departments: {
      type: 'departments',
      isLoading: false,
      lastSync: new Date('2024-11-24T16:50:00'),
      recordCount: 12
    }
  };

  // Datos simulados almacenados
  private mockUsers: MockUser[] = [...MOCK_USERS];
  private mockProducts: MockProduct[] = [...MOCK_PRODUCTS];
  private mockCostCenters: MockCostCenter[] = [...MOCK_COST_CENTERS];
  private mockDepartments: MockDepartment[] = [...MOCK_DEPARTMENTS];

  constructor() {}

  ngOnInit(): void {
    console.log('✅ NetsuiteSyncComponent initialized');
    console.log('📊 Datos simulados cargados:');
    console.log(`   - ${this.mockUsers.length} usuarios`);
    console.log(`   - ${this.mockProducts.length} productos`);
    console.log(`   - ${this.mockCostCenters.length} centros de costos`);
    console.log(`   - ${this.mockDepartments.length} departamentos`);
  }

  syncUsers(): void {
    this.performSync('users', 'Usuarios', 'usuarios');
  }

  syncProducts(): void {
    this.performSync('products', 'Productos', 'productos');
  }

  syncCostCenters(): void {
    this.performSync('costcenters', 'Centros de Costos', 'centros de costos');
  }

  syncDepartments(): void {
    this.performSync('departments', 'Departamentos', 'departamentos');
  }

  private performSync(type: string, title: string, label: string): void {
    console.log(`🔄 Iniciando sincronización de ${label}...`);
    
    // Marcar como cargando
    this.syncStatus[type].isLoading = true;

    // Mostrar mensaje de inicio
    Swal.fire({
      title: `Sincronizando ${title}`,
      html: `Conectando con NetSuite y obteniendo ${label}...<br><small class="text-muted">Por favor espera</small>`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular sincronización con backend
    setTimeout(() => {
      // Obtener datos simulados según el tipo
      let syncedData: any[] = [];
      let dataDetails: string = '';
      
      switch(type) {
        case 'users':
          syncedData = this.mockUsers;
          dataDetails = this.generateUserDetails(syncedData as MockUser[]);
          break;
        case 'products':
          syncedData = this.mockProducts;
          dataDetails = this.generateProductDetails(syncedData as MockProduct[]);
          break;
        case 'costcenters':
          syncedData = this.mockCostCenters;
          dataDetails = this.generateCostCenterDetails(syncedData as MockCostCenter[]);
          break;
        case 'departments':
          syncedData = this.mockDepartments;
          dataDetails = this.generateDepartmentDetails(syncedData as MockDepartment[]);
          break;
      }

      // Actualizar información de sincronización
      this.syncStatus[type].lastSync = new Date();
      this.syncStatus[type].recordCount = syncedData.length;
      this.syncStatus[type].isLoading = false;

      // Mostrar resultado exitoso con detalles
      Swal.fire({
        icon: 'success',
        title: '¡Sincronización completada!',
        html: `
          <div class="text-start">
            <p><strong>${title}</strong> sincronizados exitosamente desde NetSuite</p>
            <hr>
            <p class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Registros sincronizados: <strong>${syncedData.length}</strong></p>
            <p class="mb-2"><i class="bi bi-clock-fill text-primary me-2"></i>Hora: <strong>${new Date().toLocaleTimeString('es-ES')}</strong></p>
            <p class="mb-3"><i class="bi bi-calendar-check-fill text-info me-2"></i>Fecha: <strong>${new Date().toLocaleDateString('es-ES')}</strong></p>
            <div class="alert alert-light text-start p-2 mb-0" style="max-height: 200px; overflow-y: auto; font-size: 0.85rem;">
              <strong>Datos sincronizados:</strong>
              ${dataDetails}
            </div>
          </div>
        `,
        confirmButtonText: 'Continuar',
        width: '600px',
        customClass: {
          popup: 'sync-result-popup'
        }
      });

      console.log(`✅ Sincronización de ${label} completada: ${syncedData.length} registros`);
      console.table(syncedData);
    }, 2500);
  }

  private generateUserDetails(users: MockUser[]): string {
    return '<ul class="mb-0" style="padding-left: 1.2rem;">' + 
      users.map(u => `<li><strong>${u.name}</strong> (${u.employeeNumber}) - ${u.position}</li>`).join('') +
      '</ul>';
  }

  private generateProductDetails(products: MockProduct[]): string {
    return '<ul class="mb-0" style="padding-left: 1.2rem;">' + 
      products.map(p => `<li><strong>${p.name}</strong> (${p.code}) - ${p.category}</li>`).join('') +
      '</ul>';
  }

  private generateCostCenterDetails(costCenters: MockCostCenter[]): string {
    return '<ul class="mb-0" style="padding-left: 1.2rem;">' + 
      costCenters.map(cc => `<li><strong>${cc.name}</strong> (${cc.code}) - Responsable: ${cc.manager}</li>`).join('') +
      '</ul>';
  }

  private generateDepartmentDetails(departments: MockDepartment[]): string {
    return '<ul class="mb-0" style="padding-left: 1.2rem;">' + 
      departments.map(d => `<li><strong>${d.name}</strong> (${d.code}) - ${d.headCount} empleados - Gerente: ${d.manager}</li>`).join('') +
      '</ul>';
  }

  syncAll(): void {
    console.log('🔄 Iniciando sincronización completa...');
    
    Swal.fire({
      title: '¿Sincronizar todos los datos?',
      html: 'Se sincronizarán <strong>usuarios, productos, centros de costos y departamentos</strong> desde NetSuite.<br><small class="text-muted">Este proceso puede tomar varios minutos</small>',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Marcar todos como cargando
        Object.keys(this.syncStatus).forEach(key => {
          this.syncStatus[key].isLoading = true;
        });

        // Mostrar progreso
        Swal.fire({
          title: 'Sincronización Completa en Progreso',
          html: `
            <div class="sync-progress">
              <p class="mb-3">Sincronizando todos los datos desde NetSuite...</p>
              <div class="progress mb-2" style="height: 25px;">
                <div id="syncProgress" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                     role="progressbar" style="width: 0%">0%</div>
              </div>
              <p id="syncMessage" class="text-muted">Iniciando...</p>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Simular progreso
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 25;
          const progressBar = document.getElementById('syncProgress');
          const progressMessage = document.getElementById('syncMessage');
          
          if (progressBar && progressMessage) {
            progressBar.style.width = progress + '%';
            progressBar.textContent = progress + '%';
            
            if (progress === 25) {
              progressMessage.textContent = 'Sincronizando usuarios...';
            } else if (progress === 50) {
              progressMessage.textContent = 'Sincronizando productos...';
            } else if (progress === 75) {
              progressMessage.textContent = 'Sincronizando centros de costos...';
            } else if (progress === 100) {
              progressMessage.textContent = 'Sincronizando departamentos...';
            }
          }

          if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Actualizar todos los estados
            Object.keys(this.syncStatus).forEach(key => {
              this.syncStatus[key].lastSync = new Date();
              this.syncStatus[key].isLoading = false;
            });
            
            // Actualizar contadores con datos reales
            this.syncStatus['users'].recordCount = this.mockUsers.length;
            this.syncStatus['products'].recordCount = this.mockProducts.length;
            this.syncStatus['costcenters'].recordCount = this.mockCostCenters.length;
            this.syncStatus['departments'].recordCount = this.mockDepartments.length;

            // Mostrar resultado final
            setTimeout(() => {
              Swal.fire({
                icon: 'success',
                title: '¡Sincronización Completa Exitosa!',
                html: `
                  <div class="text-start">
                    <p class="mb-3">Todos los datos han sido sincronizados desde NetSuite</p>
                    <hr>
                    <div class="row text-center">
                      <div class="col-6 mb-2">
                        <i class="bi bi-people-fill text-primary" style="font-size: 1.5rem;"></i>
                        <p class="mb-0"><strong>${this.syncStatus['users'].recordCount}</strong> Usuarios</p>
                      </div>
                      <div class="col-6 mb-2">
                        <i class="bi bi-box-seam text-success" style="font-size: 1.5rem;"></i>
                        <p class="mb-0"><strong>${this.syncStatus['products'].recordCount}</strong> Productos</p>
                      </div>
                      <div class="col-6 mb-2">
                        <i class="bi bi-building text-warning" style="font-size: 1.5rem;"></i>
                        <p class="mb-0"><strong>${this.syncStatus['costcenters'].recordCount}</strong> C. Costos</p>
                      </div>
                      <div class="col-6 mb-2">
                        <i class="bi bi-diagram-3 text-info" style="font-size: 1.5rem;"></i>
                        <p class="mb-0"><strong>${this.syncStatus['departments'].recordCount}</strong> Departamentos</p>
                      </div>
                    </div>
                    <hr>
                    <div class="alert alert-light text-start p-2 mb-0" style="max-height: 150px; overflow-y: auto; font-size: 0.8rem;">
                      <strong class="d-block mb-2">📋 Resumen de sincronización:</strong>
                      <p class="mb-1">✅ Total de registros: <strong>${this.mockUsers.length + this.mockProducts.length + this.mockCostCenters.length + this.mockDepartments.length}</strong></p>
                      <p class="mb-0">🕐 Tiempo de sincronización: <strong>3.5 segundos</strong></p>
                    </div>
                  </div>
                `,
                confirmButtonText: 'Continuar',
                width: '650px',
                timer: 6000,
                timerProgressBar: true
              });
              
              console.log('✅ Sincronización completa finalizada');
              console.log('📊 Resumen:');
              console.log(`   - Usuarios: ${this.mockUsers.length}`);
              console.log(`   - Productos: ${this.mockProducts.length}`);
              console.log(`   - Centros de Costos: ${this.mockCostCenters.length}`);
              console.log(`   - Departamentos: ${this.mockDepartments.length}`);
            }, 500);
          }
        }, 750);
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeSinceLastSync(date: Date | undefined): string {
    if (!date) return 'Nunca sincronizado';
    
    const now = new Date();
    const lastSync = new Date(date);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
}
