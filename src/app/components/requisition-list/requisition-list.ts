import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ContentMenu } from '../content-menu/content-menu';
import { RequisitionService } from '../../services/requisition.service';
import { RequisitionGroupingHelper } from '../../helpers/requisition-grouping.helper';
import { RequisitionItem } from '../../models/requisition.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './requisition-list.html',
  styleUrls: ['./requisition-list.scss']
})
export class RequisitionListComponent implements OnInit, OnDestroy {
  activeSection: string = 'requisicion-lista';
  
  // Exponer Object para el template
  Object = Object;
  
  // Datos agrupados por fecha - usando signals
  dateGroups = signal<string[]>([]);
  groupedRequisitions = signal<{ [key: string]: RequisitionItem[] }>({});
  filteredDateGroups = signal<string[]>([]);
  filteredGroupedRequisitions = signal<{ [key: string]: RequisitionItem[] }>({});
  searchTerm = signal('');
  
  // Filtros de fecha
  filterStartDate = signal('');
  filterEndDate = signal('');
  
  // Datos cargados desde API
  requisitions = signal<RequisitionItem[]>([]);
  
  // Control de carga
  isLoading = signal(true);
  
  // Computed signals
  hasRequisitions = computed(() => this.filteredDateGroups().length > 0);
  totalCount = computed(() => 
    Object.values(this.filteredGroupedRequisitions())
      .reduce((sum, reqs) => sum + reqs.length, 0)
  );
  
  // Subscription para limpiar
  private navigationSubscription?: Subscription;

  constructor(
    private router: Router,
    private requisitionService: RequisitionService
  ) {}

  ngOnInit(): void {
    console.log('RequisitionListComponent initialized');
    this.loadRequisitions();
    
    // Recargar datos cuando se navega de vuelta a este componente
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/requisicion/lista')) {
        console.log('🔄 Recargando datos del listado...');
        this.loadRequisitions();
      }
    });
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }
  
  // TrackBy para ayudar a Angular a rastrear cambios
  trackByDateGroup(index: number, dateGroup: string): string {
    return dateGroup;
  }
  
  loadRequisitions(): void {
    console.log('🔄 Cargando requisiciones desde API...');
    this.isLoading.set(true);

    this.requisitionService.getRequisitions().subscribe({
      next: (response) => {
        // Detectar estructura del response automáticamente
        let apiItems: any[] = [];
        
        if (Array.isArray(response.data)) {
          apiItems = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          apiItems = response.data.items;
        } else if (response.data.requisitions && Array.isArray(response.data.requisitions)) {
          apiItems = response.data.requisitions;
        } else {
          console.error('❌ No se pudo encontrar el array de requisiciones');
        }
        
        // Usar Helper para transformar y agrupar
        const mappedRequisitions = RequisitionGroupingHelper.mapFromAPI(apiItems);
        this.requisitions.set(mappedRequisitions);
        
        const { grouped, dateKeys } = RequisitionGroupingHelper.groupByDeliveryDate(mappedRequisitions);
        
        // Actualizar signals
        this.groupedRequisitions.set(grouped);
        this.dateGroups.set(dateKeys);
        this.filteredGroupedRequisitions.set({ ...grouped });
        this.filteredDateGroups.set([...dateKeys]);
        
        this.isLoading.set(false);
        console.log('✅ Cargadas:', mappedRequisitions.length, 'requisiciones en', dateKeys.length, 'grupos de fechas');
      },
      error: (error) => {
        console.error('❌ Error al cargar requisiciones:', error);
        this.isLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las requisiciones'
        });
      }
    });
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  formatDate(date: Date): string {
    return RequisitionGroupingHelper.formatDate(date);
  }

  formatTime(date: Date): string {
    return RequisitionGroupingHelper.formatTime(date);
  }

  formatDateWithTime(date: Date): string {
    return RequisitionGroupingHelper.formatDateWithTime(date);
  }

  getStatusClass(status: string): string {
    // Mapeo de estados del API a clases Bootstrap
    const statusClasses: { [key: string]: string } = {
      'Solicitado': 'badge bg-warning text-dark',           // usa --bs-warning
      'Autorizada': 'badge bg-success text-white',          // usa --bs-success  
      'En Proceso': 'badge bg-primary text-white',          // usa --bs-primary
      'Listo para Recoger': 'badge bg-info text-white',     // usa --bs-info
      'Entregado': 'badge bg-secondary text-white',         // Bootstrap estándar
      'Espera Devolución': 'badge bg-cyan text-white',      // devolución pendiente
      'Cancelado': 'badge bg-danger text-white'             // usa --bs-danger
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
      },
      state: {
        businessUnit: requisition.businessUnit
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
        this.requisitions.update(reqs => reqs.filter(r => r.id !== requisition.id));
        
        // Reagrupar después de eliminar usando Helper
        const { grouped, dateKeys } = RequisitionGroupingHelper.groupByDeliveryDate(this.requisitions());
        this.groupedRequisitions.set(grouped);
        this.dateGroups.set(dateKeys);
        this.filteredGroupedRequisitions.set({ ...grouped });
        this.filteredDateGroups.set([...dateKeys]);
        
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
      },
      state: {
        businessUnit: requisition.businessUnit
      }
    });
  }

  canDelete(requisition: RequisitionItem): boolean {
    return requisition.status === 'Solicitado' || requisition.status === 'Cancelado';
  }

  canSupply(requisition: RequisitionItem): boolean {
    return requisition.status === 'Autorizada';
  }

  canWarehouseSupply(requisition: RequisitionItem): boolean {
    return requisition.status === 'Autorizada' || requisition.status === 'En Proceso';
  }

  warehouseSupply(requisition: RequisitionItem): void {
    console.log('Gestionar en almacén:', requisition);
    
    // Extraer el número del ID (REQ-0006 -> 6)
    const numericId = requisition.id.replace(/^REQ-0*/, '');
    
    // Navegar a la vista de almacén/surtido
    this.router.navigate(['/almacen/surtir'], {
      queryParams: {
        id: numericId
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
    const filtered = this.filteredGroupedRequisitions();
    return filtered && Object.keys(filtered).some(dateGroup =>
      filtered[dateGroup].some((req: RequisitionItem) => 
        req.status === 'Autorizada' || req.status === 'En Proceso'
      )
    );
  }

  // Métodos para exportar e imprimir
  exportData(): void {
    // Crear CSV con los datos filtrados agrupados por fecha
    let csvContent = 'Fecha de Entrega,Hora de Entrega,ID,Creador,Unidad de Negocio,Autorizador,Estatus,Fecha de Creación,Hora de Creación\n';
    
    const filteredGroups = this.filteredGroupedRequisitions();
    this.filteredDateGroups().forEach(dateGroup => {
      filteredGroups[dateGroup].forEach(req => {
        const row = [
          this.formatDate(req.deliveryDate),
          this.formatTime(req.deliveryDate),
          req.id,
          req.creator,
          req.businessUnit || 'Sin asignar',
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
            .bg-info { background-color: #17a2b8; color: white; }
          </style>
        </head>
        <body>
          <h1>Lista de Requisiciones por Fecha</h1>
    `;
    
    const filteredGroups = this.filteredGroupedRequisitions();
    this.filteredDateGroups().forEach(dateGroup => {
      printContent += `
        <h2>${dateGroup} (${filteredGroups[dateGroup].length} requisiciones)</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Creador</th>
              <th>Unidad de Negocio</th>
              <th>Autorizado por</th>
              <th>Estatus</th>
              <th>Fecha de Creación</th>
              <th>Hora de Entrega</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      filteredGroups[dateGroup].forEach(req => {
        printContent += `
          <tr>
            <td><strong>${req.id}</strong></td>
            <td>${req.creator}</td>
            <td><span class="badge bg-info">${req.businessUnit || 'Sin asignar'}</span></td>
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

  // Método para buscar - delegar al API
  performSearch(): void {
    // Recargar datos con el término de búsqueda actual
    this.loadRequisitions();
  }

  // Métodos para filtrado por fecha (del lado del cliente)
  applyDateFilter(): void {
    if (!this.filterStartDate() && !this.filterEndDate()) {
      // Si no hay filtros de fecha, usar datos completos
      this.filteredGroupedRequisitions.set({ ...this.groupedRequisitions() });
      this.filteredDateGroups.set([...this.dateGroups()]);
      return;
    }

    const startDate = this.filterStartDate() ? new Date(this.filterStartDate()) : undefined;
    const endDate = this.filterEndDate() ? new Date(this.filterEndDate()) : undefined;
    
    // Usar Helper para filtrar
    const { grouped, dateKeys } = RequisitionGroupingHelper.filterByDateRange(
      this.groupedRequisitions(),
      this.dateGroups(),
      startDate,
      endDate
    );
    
    this.filteredGroupedRequisitions.set(grouped);
    this.filteredDateGroups.set(dateKeys);
  }

  clearDateFilter(): void {
    this.filterStartDate.set('');
    this.filterEndDate.set('');
    
    // Restaurar datos completos sin filtro de fecha
    this.filteredGroupedRequisitions.set({ ...this.groupedRequisitions() });
    this.filteredDateGroups.set([...this.dateGroups()]);
  }
}