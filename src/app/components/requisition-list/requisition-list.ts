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
import { AuthService } from '../../services/auth.service';
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
  
  // Filtros adicionales
  filterStatus = signal('');
  filterLocation = signal('');
  
  // Verificar si el usuario puede filtrar por ubicación (location_id = 0)
  canFilterLocation = signal(false);
  
  // Permisos de usuario
  canUpdate = signal(false);
  canSupply = signal(false);
  canDelete = signal(false);
  
  // Estados disponibles según permisos del usuario
  availableStatuses = signal<string[]>([]);
  
  // Paginación
  currentPage = signal(1);
  itemsPerPage = signal(20);
  totalItems = signal(0);
  
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
  totalPages = computed(() => 
    Math.max(1, Math.ceil(this.totalItems() / this.itemsPerPage()))
  );
  
  // Opciones de estado disponibles según permisos
  availableStatusOptions = computed(() => {
    const allStatuses = [
      { value: 'solicitado', label: 'Solicitado' },
      { value: 'autorizado', label: 'Autorizada' },
      { value: 'listo_recoger', label: 'Listo para Recoger' },
      { value: 'entrega_parcial', label: 'Parcialmente Entregado' },
      { value: 'entregado', label: 'Entregado' },
      { value: 'espera_devolucion', label: 'Espera Devolución' },
      { value: 'cancelado', label: 'Cancelado' }
    ];
    
    const allowed = this.availableStatuses();
    if (allowed.length === 0) {
      return allStatuses;
    }
    return allStatuses.filter(s => allowed.includes(s.value));
  });
  
  // Subscription para limpiar
  private navigationSubscription?: Subscription;

  constructor(
    private router: Router,
    private requisitionService: RequisitionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario puede filtrar por ubicación
    const locationId = localStorage.getItem('location_id');
    this.canFilterLocation.set(locationId === '0');
    
    // Inicializar permisos
    this.canUpdate.set(this.authService.hasPermission('requisition_list', 'update'));
    this.canSupply.set(this.authService.hasPermission('requisition_list', 'supply'));
    this.canDelete.set(this.authService.hasPermission('requisition_list', 'delete'));
    
    console.log('[Requisitions] Permisos inicializados:', {
      canUpdate: this.canUpdate(),
      canSupply: this.canSupply(),
      canDelete: this.canDelete(),
      canFilterLocation: this.canFilterLocation()
    });
    
    this.loadRequisitions();
    
    // Recargar datos cuando se navega de vuelta a este componente
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/requisicion/lista')) {
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
    this.isLoading.set(true);

    // Construir parámetros de consulta
    const params: any = {
      page: this.currentPage(),
      limit: this.itemsPerPage()
    };
    
    if (this.searchTerm()) params.search = this.searchTerm();
    if (this.filterStatus()) params.status = this.filterStatus();
    if (this.filterLocation()) params.location_id = this.filterLocation();
    if (this.filterStartDate()) params.start_date = this.filterStartDate();
    if (this.filterEndDate()) params.end_date = this.filterEndDate();

    this.requisitionService.getRequisitions(params).subscribe({
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
        
        // Extraer paginación
        const pagination = response.data.pagination || { total: apiItems.length };
        this.totalItems.set(pagination.total || 0);
        
        // Extraer estados permitidos del backend
        const allowedStatuses = response.data.allowedStatuses || [];
        this.availableStatuses.set(allowedStatuses);
        
        console.log('[Requisitions] Estados permitidos:', allowedStatuses);
        console.log('[Requisitions] Opciones de filtro disponibles:', allowedStatuses.length);
        
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
      },
      error: (error) => {
        console.error('[Requisitions] Error al cargar:', error.message || error);
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

  canDeleteReq(requisition: RequisitionItem): boolean {
    return requisition.status === 'Solicitado' || requisition.status === 'Cancelado';
  }

  canSupplyReq(requisition: RequisitionItem): boolean {
    return requisition.status === 'Autorizada';
  }

  canWarehouseSupplyReq(requisition: RequisitionItem): boolean {
    return requisition.status === 'Autorizada' || 
           requisition.status === 'En Proceso' || 
           requisition.status === 'Parcialmente Entregado';
  }

  warehouseSupply(requisition: RequisitionItem): void {
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
    // Resetear a página 1 cuando se busca
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  // Métodos para filtrado por fecha (ahora usa backend)
  applyDateFilter(): void {
    // Resetear a página 1 cuando se filtra
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  clearDateFilter(): void {
    this.filterStartDate.set('');
    this.filterEndDate.set('');
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  // Métodos para filtro de estado
  onStatusChange(status: string): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  // Métodos para filtro de ubicación
  onLocationChange(location: string): void {
    this.filterLocation.set(location);
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  // Métodos de paginación
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadRequisitions();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadRequisitions();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadRequisitions();
    }
  }

  // Método para limpiar TODOS los filtros
  clearAllFilters(): void {
    this.searchTerm.set('');
    this.filterStatus.set('');
    this.filterLocation.set('');
    this.filterStartDate.set('');
    this.filterEndDate.set('');
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  // Helper para Math en template
  Math = Math;
}