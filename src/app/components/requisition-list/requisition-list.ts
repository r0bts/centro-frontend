import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

// Definir interfaces para los datos
export interface RequisitionItem {
  id: string;
  creator: string;
  authorizer: string | null;
  status: 'Pendiente' | 'Autorizada' | 'En Proceso' | 'Surtida' | 'Entregada' | 'Cancelada';
  creationDate: Date;
  deliveryDate: Date;
  areas: string[];
  totalProducts: number;
}

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './requisition-list.html',
  styleUrls: ['./requisition-list.scss']
})
export class RequisitionListComponent implements OnInit {
  activeSection: string = 'requisicion-lista';
  
  // Datos agrupados por fecha
  groupedRequisitions: { [key: string]: RequisitionItem[] } = {};
  filteredGroupedRequisitions: { [key: string]: RequisitionItem[] } = {};
  dateGroups: string[] = [];
  filteredDateGroups: string[] = [];
  searchTerm: string = '';
  
  // Filtros de fecha
  filterStartDate: string = '';
  filterEndDate: string = '';
  originalGroupedRequisitions: { [key: string]: RequisitionItem[] } = {};
  originalDateGroups: string[] = [];
  
  // Datos de ejemplo para las requisiciones
  requisitions: RequisitionItem[] = [
    {
      id: 'REQ-001',
      creator: 'Juan Pérez López',
      authorizer: 'María González García',
      status: 'Autorizada',
      creationDate: new Date('2025-10-15T09:30:00'),
      deliveryDate: new Date('2025-10-18T10:00:00'), // Pasada
      areas: ['Cocina', 'Restaurante'],
      totalProducts: 15
    },
    {
      id: 'REQ-002',
      creator: 'Carlos Rodríguez Martín',
      authorizer: null,
      status: 'Pendiente',
      creationDate: new Date('2025-10-16T14:20:00'),
      deliveryDate: new Date('2025-10-21T08:00:00'), // Hoy
      areas: ['Almacén', 'Mantenimiento'],
      totalProducts: 8
    },
    {
      id: 'REQ-003',
      creator: 'Ana Fernández Ruiz',
      authorizer: 'Luis Martínez Sánchez',
      status: 'En Proceso',
      creationDate: new Date('2025-10-14T11:45:00'),
      deliveryDate: new Date('2025-10-21T15:30:00'), // Hoy
      areas: ['Limpieza'],
      totalProducts: 22
    },
    {
      id: 'REQ-004',
      creator: 'Carmen Jiménez Torres',
      authorizer: 'Patricia López Hernández',
      status: 'Surtida',
      creationDate: new Date('2025-10-12T16:10:00'),
      deliveryDate: new Date('2025-10-20T12:00:00'), // Ayer
      areas: ['Cocina', 'Bar', 'Restaurante'],
      totalProducts: 35
    },
    {
      id: 'REQ-005',
      creator: 'Roberto Silva Mendoza',
      authorizer: 'María González García',
      status: 'Entregada',
      creationDate: new Date('2025-10-10T08:15:00'),
      deliveryDate: new Date('2025-10-19T09:00:00'), // Hace 2 días
      areas: ['Oficina Administrativa'],
      totalProducts: 12
    },
    {
      id: 'REQ-006',
      creator: 'Luis Martínez Sánchez',
      authorizer: null,
      status: 'Cancelada',
      creationDate: new Date('2025-10-13T13:25:00'),
      deliveryDate: new Date('2025-10-22T10:30:00'), // Mañana
      areas: ['Mantenimiento', 'Seguridad'],
      totalProducts: 6
    },
    {
      id: 'REQ-007',
      creator: 'Sofía Ramírez Castro',
      authorizer: 'Carlos Herrera Vega',
      status: 'Autorizada',
      creationDate: new Date('2025-10-18T10:15:00'),
      deliveryDate: new Date('2025-10-25T14:00:00'), // En 4 días
      areas: ['Farmacia', 'Consultorios'],
      totalProducts: 28
    },
    {
      id: 'REQ-008',
      creator: 'Diego Morales Soto',
      authorizer: null,
      status: 'Pendiente',
      creationDate: new Date('2025-10-19T16:45:00'),
      deliveryDate: new Date('2025-10-23T08:30:00'), // En 2 días
      areas: ['Laboratorio'],
      totalProducts: 45
    },
    {
      id: 'REQ-009',
      creator: 'Elena Vargas Mendez',
      authorizer: 'Patricia López Hernández',
      status: 'En Proceso',
      creationDate: new Date('2025-10-17T09:20:00'),
      deliveryDate: new Date('2025-10-21T11:00:00'), // Hoy
      areas: ['Quirófano', 'Recuperación'],
      totalProducts: 67
    },
    {
      id: 'REQ-010',
      creator: 'Alejandro Torres Gil',
      authorizer: 'María González García',
      status: 'Surtida',
      creationDate: new Date('2025-10-11T14:30:00'),
      deliveryDate: new Date('2025-10-18T10:15:00'), // Hace 3 días
      areas: ['Emergencias'],
      totalProducts: 33
    },
    {
      id: 'REQ-011',
      creator: 'Natalia Cruz Flores',
      authorizer: 'Luis Martínez Sánchez',
      status: 'Entregada',
      creationDate: new Date('2025-10-08T11:00:00'),
      deliveryDate: new Date('2025-10-17T16:30:00'), // Hace 4 días
      areas: ['Pediatría', 'Neonatología'],
      totalProducts: 41
    },
    {
      id: 'REQ-012',
      creator: 'Fernando Aguilar Ramos',
      authorizer: null,
      status: 'Pendiente',
      creationDate: new Date('2025-10-20T08:45:00'),
      deliveryDate: new Date('2025-10-26T12:00:00'), // En 5 días
      areas: ['Radiología'],
      totalProducts: 19
    },
    {
      id: 'REQ-013',
      creator: 'Gabriela Ortiz Luna',
      authorizer: 'Carlos Herrera Vega',
      status: 'Autorizada',
      creationDate: new Date('2025-10-16T13:15:00'),
      deliveryDate: new Date('2025-10-24T09:45:00'), // En 3 días
      areas: ['Cardiología', 'UCI'],
      totalProducts: 52
    },
    {
      id: 'REQ-014',
      creator: 'Ricardo Peña Jiménez',
      authorizer: 'Patricia López Hernández',
      status: 'En Proceso',
      creationDate: new Date('2025-10-15T15:30:00'),
      deliveryDate: new Date('2025-10-21T14:20:00'), // Hoy
      areas: ['Ginecología'],
      totalProducts: 24
    },
    {
      id: 'REQ-015',
      creator: 'Valeria Campos Reyes',
      authorizer: null,
      status: 'Cancelada',
      creationDate: new Date('2025-10-14T12:40:00'),
      deliveryDate: new Date('2025-10-19T16:00:00'), // Hace 2 días
      areas: ['Dermatología'],
      totalProducts: 14
    },
    {
      id: 'REQ-016',
      creator: 'Andrés Ruiz Moreno',
      authorizer: 'María González García',
      status: 'Surtida',
      creationDate: new Date('2025-10-09T10:25:00'),
      deliveryDate: new Date('2025-10-16T08:45:00'), // Hace 5 días
      areas: ['Neurología', 'Neurocirugía'],
      totalProducts: 38
    },
    {
      id: 'REQ-017',
      creator: 'Claudia Espinoza Valle',
      authorizer: 'Luis Martínez Sánchez',
      status: 'Entregada',
      creationDate: new Date('2025-10-07T16:15:00'),
      deliveryDate: new Date('2025-10-15T12:30:00'), // Hace 6 días
      areas: ['Oftalmología'],
      totalProducts: 27
    },
    {
      id: 'REQ-018',
      creator: 'Miguel Santos Herrera',
      authorizer: null,
      status: 'Pendiente',
      creationDate: new Date('2025-10-21T09:10:00'),
      deliveryDate: new Date('2025-10-27T15:45:00'), // En 6 días
      areas: ['Traumatología'],
      totalProducts: 46
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('RequisitionListComponent initialized');
    this.groupRequisitionsByDate();
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  formatDate(date: Date): string {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateWithTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  formatDateSection(date: Date): string {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  groupRequisitionsByDate(): void {
    this.groupedRequisitions = {};
    this.dateGroups = [];
    
    // Obtener la fecha de hoy para comparaciones
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Obtener el nombre del día de la semana en español
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = dayNames[today.getDay()];
    
    // Separar requisiciones en grupos
    const pastAndTodayRequisitions: RequisitionItem[] = [];
    const futureGrouped: { [key: string]: RequisitionItem[] } = {};
    
    this.requisitions.forEach(requisition => {
      const deliveryDate = new Date(requisition.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      
      console.log(`Requisición ${requisition.id} - deliveryDate: ${requisition.deliveryDate} - es pasada/hoy: ${deliveryDate <= today}`);
      
      if (deliveryDate <= today) {
        // Si es hoy o anterior, agregar al grupo especial
        pastAndTodayRequisitions.push(requisition);
      } else {
        // Si es futura, agrupar por fecha individual
        const dateKey = this.formatDateSection(requisition.deliveryDate);
        if (!futureGrouped[dateKey]) {
          futureGrouped[dateKey] = [];
        }
        futureGrouped[dateKey].push(requisition);
      }
    });
    
    // Crear el grupo especial para hoy y anteriores
    if (pastAndTodayRequisitions.length > 0) {
      const todayAndPastKey = `Hoy - ${todayName} y anteriores`;
      this.groupedRequisitions[todayAndPastKey] = pastAndTodayRequisitions;
      this.dateGroups.push(todayAndPastKey);
    }
    
    // Agregar grupos futuros ordenados
    const futureDates = Object.keys(futureGrouped).map(dateStr => {
      // Convertir fecha string de vuelta a Date para poder ordenar correctamente
      const parts = dateStr.split('-');
      const day = parseInt(parts[0]);
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIndex = monthNames.indexOf(parts[1]);
      const year = parseInt(parts[2]);
      
      const dateObj = new Date(year, monthIndex, day);
      
      return {
        dateStr,
        date: dateObj
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime()); // Ordenar fechas futuras ascendente
    
    // Agregar grupos futuros
    futureDates.forEach(dateItem => {
      this.groupedRequisitions[dateItem.dateStr] = futureGrouped[dateItem.dateStr];
      this.dateGroups.push(dateItem.dateStr);
    });
    
    console.log('Fechas agrupadas:', this.dateGroups);
    console.log('Grupos de requisiciones:', this.groupedRequisitions);
    
    // Guardar los datos originales para filtrado
    this.originalGroupedRequisitions = { ...this.groupedRequisitions };
    this.originalDateGroups = [...this.dateGroups];
    
    // Inicializar datos filtrados
    this.filteredGroupedRequisitions = { ...this.groupedRequisitions };
    this.filteredDateGroups = [...this.dateGroups];
  }

  getStatusClass(status: string): string {
    // Usando solo clases de Bootstrap que corresponden a los colores globales
    const statusClasses: { [key: string]: string } = {
      'Pendiente': 'badge bg-warning text-dark',      // usa --bs-warning
      'Autorizada': 'badge bg-success text-white',    // usa --bs-success  
      'En Proceso': 'badge bg-primary text-white',    // usa --bs-primary
      'Completada': 'badge bg-secondary text-white',  // Bootstrap estándar
      'Cancelada': 'badge bg-danger text-white'       // usa --bs-danger
    };
    return statusClasses[status] || 'badge bg-secondary text-white';
  }

  // Acciones de la tabla
  viewRequisition(requisition: RequisitionItem): void {
    console.log('Ver requisición:', requisition);
    // Navegar a la vista de confirmación/detalle de la requisición
    this.router.navigate(['/requisicion/confirmacion'], {
      queryParams: {
        id: requisition.id,
        mode: 'view'
      }
    });
  }

  deleteRequisition(requisition: RequisitionItem): void {
    Swal.fire({
      title: '¿Eliminar requisición?',
      text: `¿Estás seguro de que deseas eliminar la requisición ${requisition.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Eliminar requisición:', requisition);
        // Aquí implementarías la lógica de eliminación
        this.requisitions = this.requisitions.filter(r => r.id !== requisition.id);
        
        // Reagrupar después de eliminar
        this.groupRequisitionsByDate();
        
        Swal.fire({
          icon: 'success',
          title: 'Requisición eliminada',
          text: `La requisición ${requisition.id} ha sido eliminada exitosamente`,
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  supplyRequisition(requisition: RequisitionItem): void {
    console.log('Editar/Surtir requisición:', requisition);
    // Navegar a la vista de confirmación en modo edición
    this.router.navigate(['/requisicion/confirmacion'], {
      queryParams: {
        id: requisition.id,
        mode: 'edit'
      }
    });
  }

  canDelete(requisition: RequisitionItem): boolean {
    return requisition.status === 'Pendiente' || requisition.status === 'Cancelada';
  }

  canSupply(requisition: RequisitionItem): boolean {
    return requisition.status === 'Autorizada';
  }

  canWarehouseSupply(requisition: RequisitionItem): boolean {
    return requisition.status === 'Autorizada' || requisition.status === 'En Proceso';
  }

  warehouseSupply(requisition: RequisitionItem): void {
    console.log('Gestionar en almacén:', requisition);
    // Navegar a la vista de almacén/surtido
    this.router.navigate(['/almacen/surtir'], {
      queryParams: {
        id: requisition.id,
        mode: 'supply'
      }
    });
  }

  // Función para ir al consolidado general del almacén
  goToWarehouseConsolidated(): void {
    console.log('Navegando al consolidado de almacén');
    // Navegar directamente al consolidado sin parámetros específicos
    this.router.navigate(['/almacen/surtir']);
  }

  // Función para verificar si hay requisiciones para consolidar
  hasAuthorizedRequisitions(): boolean {
    return this.requisitions.some((req: RequisitionItem) => req.status === 'Autorizada' || req.status === 'En Proceso');
  }

  // Métodos para exportar e imprimir
  exportData(): void {
    // Crear CSV con los datos filtrados agrupados por fecha
    let csvContent = 'Fecha de Entrega,Hora de Entrega,ID,Creador,Autorizador,Estatus,Fecha de Creación,Hora de Creación\n';
    
    this.filteredDateGroups.forEach(dateGroup => {
      this.filteredGroupedRequisitions[dateGroup].forEach(req => {
        const row = [
          this.formatDate(req.deliveryDate),
          this.formatTime(req.deliveryDate),
          req.id,
          req.creator,
          req.authorizer || 'Pendiente',
          req.status,
          this.formatDate(req.creationDate),
          this.formatTime(req.creationDate)
        ];
        csvContent += row.map(field => `"${field}"`).join(',') + '\n';
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Requisiciones_por_Fecha_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printTable(): void {
    // Crear una ventana de impresión con el contenido agrupado
    let printContent = `
      <html>
        <head>
          <title>Lista de Requisiciones por Fecha</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            h2 { color: #007bff; margin-top: 30px; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .badge { padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
            .bg-warning { background-color: #ffc107; }
            .bg-success { background-color: #28a745; color: white; }
            .bg-primary { background-color: #007bff; color: white; }
            .bg-danger { background-color: #dc3545; color: white; }
            .bg-secondary { background-color: #6c757d; color: white; }
          </style>
        </head>
        <body>
          <h1>Lista de Requisiciones por Fecha</h1>
    `;
    
    this.filteredDateGroups.forEach(dateGroup => {
      printContent += `
        <h2>${dateGroup} (${this.filteredGroupedRequisitions[dateGroup].length} requisiciones)</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Creador</th>
              <th>Autorizado por</th>
              <th>Estatus</th>
              <th>Fecha de Creación</th>
              <th>Hora de Entrega</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      this.filteredGroupedRequisitions[dateGroup].forEach(req => {
        printContent += `
          <tr>
            <td><strong>${req.id}</strong></td>
            <td>${req.creator}</td>
            <td>${req.authorizer || 'Pendiente'}</td>
            <td><span class="${this.getStatusClass(req.status)}">${req.status}</span></td>
            <td>${this.formatDate(req.creationDate)} ${this.formatTime(req.creationDate)}</td>
            <td><strong>${this.formatTime(req.deliveryDate)}</strong></td>
          </tr>
        `;
      });
      
      printContent += '</tbody></table>';
    });
    
    printContent += '</body></html>';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Método para buscar
  performSearch(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      // Si no hay búsqueda, mostrar todo
      this.filteredGroupedRequisitions = { ...this.groupedRequisitions };
      this.filteredDateGroups = [...this.dateGroups];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredGroupedRequisitions = {};
    this.filteredDateGroups = [];
    
    // Filtrar en cada grupo de fecha
    this.dateGroups.forEach(dateGroup => {
      const filteredRequisitions = this.groupedRequisitions[dateGroup].filter(requisition => {
        // Formatear la fecha de entrega para búsqueda
        const deliveryDateFormatted = this.formatDate(requisition.deliveryDate).toLowerCase();
        
        return (
          requisition.id.toLowerCase().includes(searchTermLower) ||
          requisition.creator.toLowerCase().includes(searchTermLower) ||
          (requisition.authorizer && requisition.authorizer.toLowerCase().includes(searchTermLower)) ||
          requisition.status.toLowerCase().includes(searchTermLower) ||
          deliveryDateFormatted.includes(searchTermLower) ||
          // Buscar también en partes de la fecha (día, mes, año por separado)
          requisition.deliveryDate.getDate().toString().includes(this.searchTerm) ||
          requisition.deliveryDate.getFullYear().toString().includes(this.searchTerm)
        );
      });
      
      // También verificar si el término de búsqueda coincide con el nombre del grupo de fecha
      const groupMatches = dateGroup.toLowerCase().includes(searchTermLower);
      
      // Solo incluir grupos de fecha que tengan requisiciones que coincidan O que el grupo mismo coincida
      if (filteredRequisitions.length > 0 || groupMatches) {
        // Si el grupo coincide pero no hay requisiciones filtradas, mostrar todas las del grupo
        this.filteredGroupedRequisitions[dateGroup] = filteredRequisitions.length > 0 ? filteredRequisitions : this.groupedRequisitions[dateGroup];
        this.filteredDateGroups.push(dateGroup);
      }
    });
  }

  // Métodos para filtrado por fecha
  applyDateFilter(): void {
    // Empezar con los datos originales
    let dataToFilter = { ...this.originalGroupedRequisitions };
    let groupsToFilter = [...this.originalDateGroups];
    
    // Aplicar filtro de fecha si está configurado
    if (this.filterStartDate || this.filterEndDate) {
      const startDate = this.filterStartDate ? new Date(this.filterStartDate) : null;
      const endDate = this.filterEndDate ? new Date(this.filterEndDate) : null;
      
      // Normalizar fechas para comparación (solo fecha, sin hora)
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      
      const filteredByDate: { [key: string]: RequisitionItem[] } = {};
      
      groupsToFilter.forEach(dateGroup => {
        const filteredRequisitions = dataToFilter[dateGroup].filter(requisition => {
          const deliveryDate = new Date(requisition.deliveryDate);
          deliveryDate.setHours(0, 0, 0, 0);
          
          let matchesDateRange = true;
          
          if (startDate && deliveryDate < startDate) {
            matchesDateRange = false;
          }
          
          if (endDate && deliveryDate > endDate) {
            matchesDateRange = false;
          }
          
          return matchesDateRange;
        });
        
        if (filteredRequisitions.length > 0) {
          filteredByDate[dateGroup] = filteredRequisitions;
        }
      });
      
      dataToFilter = filteredByDate;
      groupsToFilter = Object.keys(filteredByDate);
    }
    
    // Actualizar los datos que usará la búsqueda
    this.groupedRequisitions = dataToFilter;
    this.dateGroups = groupsToFilter;
    
    // Aplicar búsqueda de texto si existe
    this.performSearch();
  }

  clearDateFilter(): void {
    this.filterStartDate = '';
    this.filterEndDate = '';
    
    // Restaurar datos originales
    this.groupedRequisitions = { ...this.originalGroupedRequisitions };
    this.dateGroups = [...this.originalDateGroups];
    
    // Aplicar búsqueda de texto si existe
    this.performSearch();
  }
}