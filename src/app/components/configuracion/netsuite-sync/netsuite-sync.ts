import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { NetsuiteSyncService, SyncResponse } from '../../../services/netsuite-sync.service';
import { AuthService } from '../../../services/auth.service';

interface SyncStatus {
  type: 'users' | 'products' | 'departments' | 'areas' | 'locations' | 'projects' | 'accounti' | 'accounte' | 'adjustment_reasons' | 'categories' | 'subcategories' | 'payment_frequencies' | 'condicion_patrimonial' | 'condicion_adm' | 'parentesco' | 'acceso_clubes' | 'genero' | 'estado_membresia' | 'cuotas_membresia' | 'socios' | 'membresias' | 'detalle_membresias' | 'medical_records' | 'socio_health' | 'evaluacion_batch' | 'summer_payments' | 'ns_services' | 'ns_discounts' | 'ns_markups' | 'ns_noninvt_parts' | 'ns_sales_tax_items' | 'sales_orders' | 'sale_types';
  isLoading: boolean;
  lastSync?: Date;
  recordCount?: number;
  created?: number;
  updated?: number;
  errors?: number;
}

interface CatalogPreviewState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  rows: any[];
  columns: string[];
  total: number;
  page: number;
  limit: number;
  loadedAt?: Date;
}

interface CatalogCardConfig {
  key: string;
  title: string;
  description: string;
  icon: string;
  permission: string;
  syncButtonClass: string;
  syncButtonLabel: string;
  syncAction: () => void;
  previewable?: boolean;
  note?: string;
}

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
      recordCount: 0
    },
    products: {
      type: 'products',
      isLoading: false,
      recordCount: 0
    },
    departments: {
      type: 'departments',
      isLoading: false,
      recordCount: 0
    },
    areas: {
      type: 'areas',
      isLoading: false,
      recordCount: 0
    },
    locations: {
      type: 'locations',
      isLoading: false,
      recordCount: 0
    },
    projects: {
      type: 'projects',
      isLoading: false,
      recordCount: 0
    },
    accounti: {
      type: 'accounti',
      isLoading: false,
      recordCount: 0
    },
    accounte: {
      type: 'accounte',
      isLoading: false,
      recordCount: 0
    },
    adjustment_reasons: {
      type: 'adjustment_reasons',
      isLoading: false,
      recordCount: 0
    },
    categories: {
      type: 'categories',
      isLoading: false,
      recordCount: 0
    },
    subcategories: {
      type: 'subcategories',
      isLoading: false,
      recordCount: 0
    },
    payment_frequencies: {
      type: 'payment_frequencies',
      isLoading: false,
      recordCount: 0
    },
    condicion_patrimonial: {
      type: 'condicion_patrimonial',
      isLoading: false,
      recordCount: 0
    },
    condicion_adm: {
      type: 'condicion_adm',
      isLoading: false,
      recordCount: 0
    },
    parentesco: {
      type: 'parentesco',
      isLoading: false,
      recordCount: 0
    },
    acceso_clubes: {
      type: 'acceso_clubes',
      isLoading: false,
      recordCount: 0
    },
    genero: {
      type: 'genero',
      isLoading: false,
      recordCount: 0
    },
    estado_membresia: {
      type: 'estado_membresia',
      isLoading: false,
      recordCount: 0
    },
    cuotas_membresia: {
      type: 'cuotas_membresia',
      isLoading: false,
      recordCount: 0
    },
    socios: {
      type: 'socios',
      isLoading: false,
      recordCount: 0
    },
    membresias: {
      type: 'membresias',
      isLoading: false,
      recordCount: 0
    },
    detalle_membresias: {
      type: 'detalle_membresias',
      isLoading: false,
      recordCount: 0
    },
    medical_records: {
      type: 'medical_records',
      isLoading: false,
      recordCount: 0
    },
    socio_health: {
      type: 'socio_health',
      isLoading: false,
      recordCount: 0
    },
    evaluacion_batch: {
      type: 'evaluacion_batch',
      isLoading: false,
      recordCount: 0
    },
    summer_payments: {
      type: 'summer_payments',
      isLoading: false,
      recordCount: 0
    },
    ns_services: {
      type: 'ns_services',
      isLoading: false,
      recordCount: 0
    },
    ns_discounts: {
      type: 'ns_discounts',
      isLoading: false,
      recordCount: 0
    },
    ns_markups: {
      type: 'ns_markups',
      isLoading: false,
      recordCount: 0
    },
    ns_noninvt_parts: {
      type: 'ns_noninvt_parts',
      isLoading: false,
      recordCount: 0
    },
    ns_sales_tax_items: {
      type: 'ns_sales_tax_items',
      isLoading: false,
      recordCount: 0
    },
    sales_orders: {
      type: 'sales_orders',
      isLoading: false,
      recordCount: 0
    },
    sale_types: {
      type: 'sale_types',
      isLoading: false,
      recordCount: 0
    },
  };

  readonly catalogPreviewLimit = 8;
  readonly catalogCards: CatalogCardConfig[] = [
    { key: 'users', title: 'Usuarios', description: 'Empleados sincronizados desde NetSuite', icon: 'bi-people-fill', permission: 'sync_usuarios', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncUsers() },
    { key: 'products', title: 'Productos', description: 'Catálogo de productos', icon: 'bi-box-seam', permission: 'sync_productos', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncProducts() },
    { key: 'departments', title: 'Departamentos', description: 'Estructura de departamentos', icon: 'bi-diagram-3', permission: 'sync_departamentos', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncDepartments() },
    { key: 'areas', title: 'Áreas', description: 'Áreas organizacionales', icon: 'bi-grid-3x3-gap', permission: 'sync_centros', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncAreas() },
    { key: 'locations', title: 'Centros de Costos', description: 'Centros de costos / ubicaciones', icon: 'bi-building', permission: 'sync_ubicaciones', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncLocations() },
    { key: 'projects', title: 'Eventos Centro Libanés', description: 'Eventos y proyectos sincronizados', icon: 'bi-calendar-event', permission: 'sync_proyectos', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncProjects() },
    { key: 'accounti', title: 'Cuentas de Inventario', description: 'Cuentas internas de inventario', icon: 'bi-box-seam', permission: 'sync_cuentas_inventario', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncAccountInternal() },
    { key: 'accounte', title: 'Cuentas de Pagos', description: 'Cuentas externas / gastos', icon: 'bi-credit-card', permission: 'sync_cuentas_gastos', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncAccountExternal() },
    { key: 'adjustment_reasons', title: 'Razones de Ajuste', description: 'Motivos de ajuste de inventario', icon: 'bi-sliders', permission: 'sync_motivos_ajuste', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncAdjustmentReasons() },
    { key: 'categories', title: 'Categorías', description: 'Categorías de productos', icon: 'bi-folder', permission: 'sync_categorias', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncCategories() },
    { key: 'subcategories', title: 'Subcategorías', description: 'Subcategorías de productos', icon: 'bi-tags', permission: 'sync_subcategorias', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncSubcategories() },
    { key: 'payment_frequencies', title: 'Frecuencias de Pago', description: 'Frecuencias de pago de membresías', icon: 'bi-cash-stack', permission: 'sync_payment_frequencies', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncPaymentFrequencies() },
    { key: 'condicion_patrimonial', title: 'Condición Patrimonial', description: 'Condiciones patrimoniales de socios', icon: 'bi-bank2', permission: 'sync_condicion_patrimonial', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncCondicionPatrimonial() },
    { key: 'condicion_adm', title: 'Condición Administrativa', description: 'Condiciones administrativas de socios', icon: 'bi-file-earmark-check', permission: 'sync_condicion_adm', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncCondicionAdm() },
    { key: 'parentesco', title: 'Parentesco', description: 'Tipos de parentesco de socios', icon: 'bi-diagram-2', permission: 'sync_parentesco', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncParentesco() },
    { key: 'acceso_clubes', title: 'Acceso Clubes', description: 'Tipos de acceso a clubes', icon: 'bi-key', permission: 'sync_acceso_clubes', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncAccesoClubes() },
    { key: 'genero', title: 'Género', description: 'Tipos de género de socios', icon: 'bi-person-badge', permission: 'sync_genero', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncGenero() },
    { key: 'estado_membresia', title: 'Estado Membresía', description: 'Estados de membresía de socios', icon: 'bi-card-checklist', permission: 'sync_estado_membresia', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncEstadoMembresia() },
    { key: 'cuotas_membresia', title: 'Cuotas Membresía', description: 'Tipos de cuotas de membresía', icon: 'bi-wallet2', permission: 'sync_cuotas_membresia', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncCuotasMembresia() },
    { key: 'socios', title: 'Socios', description: 'Miembros del club', icon: 'bi-person-vcard', permission: 'sync_socios', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncSocios(), note: 'Paso 1 del módulo de miembros' },
    { key: 'membresias', title: 'Membresías', description: 'Membresías de socios', icon: 'bi-person-badge', permission: 'sync_membresias', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncMembresias(), note: 'Requiere Socios' },
    { key: 'detalle_membresias', title: 'Detalle Membresías', description: 'Detalle de membresías', icon: 'bi-journal-text', permission: 'sync_detalle_membresias', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncDetalleMembresias(), note: 'Requiere Socios + Membresías' },
    { key: 'medical_records', title: 'Registros Médicos', description: 'Visitas médicas de socios', icon: 'bi-heart-pulse', permission: 'sync_medical_records', syncButtonClass: 'btn-info text-white', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncMedicalRecords(), note: 'Requiere Socios + Membresías + Detalle' },
    { key: 'ns_services', title: 'Servicios NS', description: "item WHERE itemtype='Service'", icon: 'bi-gear-wide-connected', permission: 'sync_ns_services', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncNsServices() },
    { key: 'ns_discounts', title: 'Descuentos NS', description: "item WHERE itemtype='Discount'", icon: 'bi-tag-fill', permission: 'sync_ns_discounts', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncNsDiscounts() },
    { key: 'ns_markups', title: 'Recargos NS', description: "item WHERE itemtype='Markup'", icon: 'bi-graph-up-arrow', permission: 'sync_ns_markups', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncNsMarkups() },
    { key: 'ns_noninvt_parts', title: 'Partes No Inventariables NS', description: "item WHERE itemtype='NonInvtPart'", icon: 'bi-boxes', permission: 'sync_ns_noninvt_parts', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncNsNoninvtParts() },
    { key: 'ns_sales_tax_items', title: 'Códigos de Impuesto NS', description: 'salestaxitem', icon: 'bi-receipt', permission: 'sync_ns_sales_tax_items', syncButtonClass: 'btn-primary', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncNsSalesTaxItems() },
    { key: 'sales_orders', title: 'Órdenes de Venta', description: 'Saldos y finanzas de ventas', icon: 'bi-wallet2', permission: 'sync', syncButtonClass: 'btn-info text-white', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncSalesOrders(), previewable: false },
    { key: 'sale_types', title: 'Tipos de Venta', description: 'Catálogo de tipos de venta', icon: 'bi-list-ul', permission: 'sync', syncButtonClass: 'btn-secondary text-white', syncButtonLabel: 'Sincronizar', syncAction: () => this.syncSaleTypes() },
  ];

  readonly processCards = [
    {
      key: 'summer_payments',
      title: 'Pagos Curso de Verano',
      description: 'Sincroniza el estado de pago contra Sales Orders',
      icon: 'bi-cash-coin',
      buttonClass: 'btn-success',
      buttonLabel: 'Sincronizar Pagos',
      action: () => this.syncSummerPayments(),
      permission: 'sync_summer_payments'
    },
    {
      key: 'socio_health',
      title: 'Perfil de Salud',
      description: 'Tipo de sangre, alergias, condiciones y contacto de emergencia',
      icon: 'bi-shield-heart',
      buttonClass: 'btn-danger',
      buttonLabel: 'Sincronizar Salud',
      action: () => this.syncSocioHealth(),
      permission: 'sync_medical_records'
    },
    {
      key: 'evaluacion_batch',
      title: 'Evaluación de Reglas',
      description: 'Evalúa todos los socios activos contra el motor de reglas',
      icon: 'bi-lightning-charge',
      buttonClass: 'btn-warning',
      buttonLabel: 'Evaluar Reglas',
      action: () => this.runEvaluacionBatch(),
      permission: 'evaluar_batch'
    }
  ];

  catalogPreviewState: { [key: string]: CatalogPreviewState } = {};
  selectedPreviewKey: string | null = null;

  constructor(
    private netsuiteSyncService: NetsuiteSyncService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  canPreview(permission: string): boolean {
    return this.authService.hasPermission('netsuite_sync', 'view') || this.canSync(permission);
  }

  getPreviewState(key: string): CatalogPreviewState {
    if (!this.catalogPreviewState[key]) {
      this.catalogPreviewState[key] = {
        isOpen: false,
        isLoading: false,
        error: null,
        rows: [],
        columns: [],
        total: 0,
        page: 1,
        limit: this.catalogPreviewLimit,
      };
    }

    return this.catalogPreviewState[key];
  }

  toggleCatalogPreview(key: string): void {
    const state = this.getPreviewState(key);
    const willOpen = this.selectedPreviewKey !== key;

    this.selectedPreviewKey = willOpen ? key : null;

    state.isOpen = willOpen;

    if (willOpen) {
      state.error = null;
      if (!state.loadedAt && !state.isLoading) {
        this.loadCatalogPreview(key);
      }
    }

    this.cdr.markForCheck();
  }

  loadCatalogPreview(key: string, force = false): void {
    const state = this.getPreviewState(key);

    if (state.isLoading) {
      return;
    }

    if (!force && state.loadedAt && state.rows.length > 0) {
      return;
    }

    state.isLoading = true;
    state.error = null;
    this.cdr.markForCheck();

    this.netsuiteSyncService.getCatalogPreview(key, state.page, state.limit).subscribe({
      next: (response: any) => {
        state.isLoading = false;
        if (response.success && response.data) {
          state.rows = response.data.rows || [];
          state.columns = response.data.columns || (state.rows[0] ? Object.keys(state.rows[0]) : []);
          state.total = response.data.total || state.rows.length;
          state.loadedAt = new Date();
          state.error = null;
        } else {
          state.error = response.message || 'No se pudo cargar el preview';
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        state.isLoading = false;
        state.error = error.error?.message || 'No se pudo cargar el preview';
        this.cdr.markForCheck();
      }
    });
  }

  reloadCatalogPreview(key: string): void {
    this.loadCatalogPreview(key, true);
  }

  previewValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  previewColumns(state: CatalogPreviewState): string[] {
    return state.columns.length > 0 ? state.columns : (state.rows[0] ? Object.keys(state.rows[0]) : []);
  }

  formatColumnLabel(column: string): string {
    return column
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  isPreviewExpanded(key: string): boolean {
    return this.selectedPreviewKey === key;
  }

  getCatalogTitle(key: string): string {
    return this.catalogCards.find((card) => card.key === key)?.title || 'Catálogo';
  }

  syncSalesOrders(): void {
    this.performSync('sales_orders', 'Órdenes de Venta', () => this.netsuiteSyncService.syncSalesOrders());
  }

  syncSaleTypes(): void {
    this.performSync('sale_types', 'Tipos de Venta', () => this.netsuiteSyncService.syncSaleTypes());
  }

  canSync(permission: string): boolean {
    return this.authService.hasPermission('netsuite_sync', permission);
  }

  ngOnInit(): void {
    console.log('✅ NetsuiteSyncComponent initialized');
    console.log('🔗 Conectado a endpoints reales de NetSuite');
    this.loadSyncStatus();
  }

  loadSyncStatus(): void {
    this.netsuiteSyncService.getSyncStatus().subscribe({
      next: (response: any) => {
        if (response.success && response.data?.status) {
          const status = response.data.status;
          
          const keyMap: { [key: string]: string } = {
            'account_i': 'accounti',
            'account_e': 'accounte',
            'membresia': 'membresias',
            'detalle_membresia': 'detalle_membresias'
          };

          Object.keys(status).forEach(backendKey => {
            const frontendKey = keyMap[backendKey] || backendKey;
            
            if (this.syncStatus[frontendKey]) {
              this.syncStatus[frontendKey].recordCount = status[backendKey].total_records || 0;
              if (status[backendKey].last_sync) {
                // Ensure date is parsed correctly across timezones
                this.syncStatus[frontendKey].lastSync = new Date(status[backendKey].last_sync + 'Z');
              }
            }
          });
        }
      },
      error: (error) => {
        console.error('❌ Error cargando estado de sincronización inicial', error);
      }
    });
  }

  syncUsers(): void {
    this.performSync('users', 'Usuarios', () => this.netsuiteSyncService.syncUsers());
  }

  syncProducts(): void {
    this.performSync('products', 'Productos', () => this.netsuiteSyncService.syncProducts());
  }

  syncDepartments(): void {
    this.performSync('departments', 'Departamentos', () => this.netsuiteSyncService.syncDepartments());
  }

  syncAreas(): void {
    this.performSync('areas', 'Áreas', () => this.netsuiteSyncService.syncAreas());
  }

  syncLocations(): void {
    this.performSync('locations', 'Centros de Costos', () => this.netsuiteSyncService.syncLocations());
  }

  syncProjects(): void {
    this.performSync('projects', 'Eventos Centro Libanés', () => this.netsuiteSyncService.syncProjects());
  }

  syncAccountInternal(): void {
    this.performSync('accounti', 'Cuentas de Inventario', () => this.netsuiteSyncService.syncAccountInternal());
  }

  syncAccountExternal(): void {
    this.performSync('accounte', 'Cuentas de Pagos', () => this.netsuiteSyncService.syncAccountExternal());
  }

  syncAdjustmentReasons(): void {
    this.performSync('adjustment_reasons', 'Razones de Ajuste', () => this.netsuiteSyncService.syncAdjustmentReasons());
  }

  syncCategories(): void {
    this.performSync('categories', 'Categorías', () => this.netsuiteSyncService.syncCategories());
  }

  syncSubcategories(): void {
    this.performSync('subcategories', 'Subcategorías', () => this.netsuiteSyncService.syncSubcategories());
  }

  syncPaymentFrequencies(): void {
    this.performSync('payment_frequencies', 'Frecuencias de Pago', () => this.netsuiteSyncService.syncPaymentFrequencies());
  }

  syncCondicionPatrimonial(): void {
    this.performSync('condicion_patrimonial', 'Condición Patrimonial', () => this.netsuiteSyncService.syncCondicionPatrimonial());
  }

  syncCondicionAdm(): void {
    this.performSync('condicion_adm', 'Condición Administrativa', () => this.netsuiteSyncService.syncCondicionAdm());
  }

  syncParentesco(): void {
    this.performSync('parentesco', 'Parentesco', () => this.netsuiteSyncService.syncParentesco());
  }

  syncAccesoClubes(): void {
    this.performSync('acceso_clubes', 'Acceso Clubes', () => this.netsuiteSyncService.syncAccesoClubes());
  }

  syncGenero(): void {
    this.performSync('genero', 'Género', () => this.netsuiteSyncService.syncGenero());
  }

  syncEstadoMembresia(): void {
    this.performSync('estado_membresia', 'Estado Membresía', () => this.netsuiteSyncService.syncEstadoMembresia());
  }

  syncCuotasMembresia(): void {
    this.performSync('cuotas_membresia', 'Cuotas Membresía', () => this.netsuiteSyncService.syncCuotasMembresia());
  }

  syncSocios(): void {
    this.performSync('socios', 'Socios (Miembros)', () => this.netsuiteSyncService.syncSocios());
  }

  syncMembresias(): void {
    this.performSync('membresias', 'Membresías', () => this.netsuiteSyncService.syncMembresias());
  }

  syncDetalleMembresias(): void {
    this.performSync('detalle_membresias', 'Detalle Membresías', () => this.netsuiteSyncService.syncDetalleMembresias());
  }

  syncMedicalRecords(): void {
    this.performSync('medical_records', 'Registros Médicos', () => this.netsuiteSyncService.syncMedicalRecords());
  }

  syncNsServices(): void {
    this.performSync('ns_services', 'Servicios NS', () => this.netsuiteSyncService.syncNsServices());
  }

  syncNsDiscounts(): void {
    this.performSync('ns_discounts', 'Descuentos NS', () => this.netsuiteSyncService.syncNsDiscounts());
  }

  syncNsMarkups(): void {
    this.performSync('ns_markups', 'Recargos NS', () => this.netsuiteSyncService.syncNsMarkups());
  }

  syncNsNoninvtParts(): void {
    this.performSync('ns_noninvt_parts', 'Partes No Inventariables NS', () => this.netsuiteSyncService.syncNsNoninvtParts());
  }

  syncNsSalesTaxItems(): void {
    this.performSync('ns_sales_tax_items', 'Códigos de Impuesto NS', () => this.netsuiteSyncService.syncNsSalesTaxItems());
  }

  syncSocioHealth(): void {
    const type = 'socio_health';

    Swal.fire({
      title: '¿Sincronizar Perfil de Salud?',
      html: `
        <div class="text-start">
          <p class="mb-2">Se llamará a NetSuite individualmente por cada socio activo.</p>
          <div class="alert alert-danger py-2 mb-2">
            <i class="bi bi-shield-exclamation me-1"></i>
            <strong>Datos sensibles — LFPDPPP</strong><br>
            <small>Tipo de sangre, alergias, condiciones, contacto de emergencia</small>
          </div>
          <div class="alert alert-warning py-2 mb-0">
            <i class="bi bi-clock me-1"></i>
            <strong>Proceso lento</strong> — ~13,000 llamadas individuales a NetSuite<br>
            <small>Tiempo estimado: 10–20 minutos</small>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      width: '500px'
    }).then((result) => {
      if (!result.isConfirmed) return;

      console.log('🔄 Iniciando sync de perfil de salud...');
      this.syncStatus[type].isLoading = true;

      Swal.fire({
        title: 'Sincronizando Perfil de Salud',
        html: 'Llamando a NetSuite por cada socio activo...<br><small class="text-muted">Este proceso puede tomar 10–20 minutos</small>',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      this.netsuiteSyncService.syncSocioHealth().subscribe({
        next: (response: any) => {
          console.log('✅ Sync salud completado:', response);
          this.syncStatus[type].isLoading  = false;
          this.syncStatus[type].lastSync   = new Date();
          this.syncStatus[type].recordCount = (response.data?.created ?? 0) + (response.data?.updated ?? 0);

          const d = response.data || {};
          Swal.fire({
            icon: d.errors > 0 ? 'warning' : 'success',
            title: 'Perfil de Salud sincronizado',
            html: `
              <div class="text-start">
                <table class="table table-sm table-borderless">
                  <tbody>
                    <tr><td class="text-muted">Socios activos:</td><td class="text-end"><strong>${d.total_socios_activos ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Creados:</td><td class="text-end"><strong class="text-success">${d.created ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Actualizados:</td><td class="text-end"><strong class="text-primary">${d.updated ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Sin datos médicos (omitidos):</td><td class="text-end"><strong>${d.skipped ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Errores:</td><td class="text-end"><strong class="text-danger">${d.errors ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Duración:</td><td class="text-end"><strong>${d.duration_seconds ?? 0}s</strong></td></tr>
                  </tbody>
                </table>
              </div>
            `,
            confirmButtonText: 'Aceptar',
            width: '500px'
          });
        },
        error: (error: any) => {
          console.error('❌ Error sync salud:', error);
          this.syncStatus[type].isLoading = false;

          let errorMessage = 'Error al sincronizar perfil de salud';
          let errorDetails = '';
          if (error.status === 403) {
            errorMessage = error.error?.message || 'No tienes permisos';
            if (error.error?.error?.required_permissions) {
              const perms = error.error.error.required_permissions;
              errorDetails = '<strong>Permisos requeridos:</strong><br>';
              perms.forEach((p: any) => { errorDetails += `• ${p.module} → ${p.submodule} → ${p.permission}<br>`; });
            }
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          Swal.fire({
            icon: 'error',
            title: 'Error en sincronización de salud',
            html: `<div class="text-start"><p class="mb-3">${errorMessage}</p>${errorDetails ? `<div class="alert alert-light mb-3"><small>${errorDetails}</small></div>` : ''}</div>`,
            confirmButtonText: 'Aceptar'
          });
        }
      });
    });
  }

  runEvaluacionBatch(): void {
    const type = 'evaluacion_batch';
    console.log('🔄 Iniciando evaluación masiva de reglas...');

    this.syncStatus[type].isLoading = true;

    Swal.fire({
      title: 'Evaluando reglas',
      html: 'Pasando todos los socios activos por el motor de reglas...<br><small class="text-muted">Esto puede tomar varios minutos</small>',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.netsuiteSyncService.runEvaluacionBatch().subscribe({
      next: (response: any) => {
        console.log('✅ Evaluación masiva completada:', response);
        this.syncStatus[type].isLoading = false;
        this.syncStatus[type].lastSync  = new Date();
        this.syncStatus[type].recordCount = response.data?.procesados || 0;

        const d = response.data || {};
        const breakdown = d.breakdown_por_regla || {};
        const breakdownRows = Object.entries(breakdown)
          .map(([regla, count]) => `<tr><td class="text-muted small">${regla}</td><td class="text-end"><strong>${count}</strong></td></tr>`)
          .join('');

        Swal.fire({
          icon: d.bloqueados > 0 ? 'warning' : 'success',
          title: 'Evaluación masiva completada',
          html: `
            <div class="text-start">
              <table class="table table-sm table-borderless">
                <tbody>
                  <tr><td class="text-muted">Total socios activos:</td><td class="text-end"><strong>${d.total_socios_activos ?? 0}</strong></td></tr>
                  <tr><td class="text-muted">Procesados:</td><td class="text-end"><strong>${d.procesados ?? 0}</strong></td></tr>
                  <tr><td class="text-muted">Permitidos:</td><td class="text-end"><strong class="text-success">${d.permitidos ?? 0}</strong></td></tr>
                  <tr><td class="text-muted">Bloqueados:</td><td class="text-end"><strong class="text-danger">${d.bloqueados ?? 0}</strong></td></tr>
                  <tr><td class="text-muted">Errores:</td><td class="text-end"><strong>${d.errores ?? 0}</strong></td></tr>
                  <tr><td class="text-muted">Duración:</td><td class="text-end"><strong>${d.duration_seconds ?? 0}s</strong></td></tr>
                </tbody>
              </table>
              ${breakdownRows ? `<p class="mb-1 fw-bold small">Bloqueos por regla:</p><table class="table table-sm table-borderless">${breakdownRows}</table>` : ''}
            </div>
          `,
          confirmButtonText: 'Aceptar',
          width: '500px'
        });
      },
      error: (error: any) => {
        console.error('❌ Error en evaluación masiva:', error);
        this.syncStatus[type].isLoading = false;

        let errorMessage = 'Error al ejecutar la evaluación masiva';
        let errorDetails = '';

        if (error.status === 403) {
          errorMessage = error.error?.message || 'No tienes permiso para ejecutar la evaluación masiva';
          if (error.error?.error?.required_permissions) {
            const perms = error.error.error.required_permissions;
            errorDetails = `<strong>Permisos requeridos:</strong><br>`;
            perms.forEach((p: any) => { errorDetails += `• ${p.module} → ${p.submodule} → ${p.permission}<br>`; });
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error en evaluación masiva',
          html: `<div class="text-start"><p class="mb-3">${errorMessage}</p>${errorDetails ? `<div class="alert alert-light mb-3"><small>${errorDetails}</small></div>` : ''}</div>`,
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  syncSummerPayments(): void {
    const type = 'summer_payments';
    console.log('🔄 Iniciando sincronización de pagos Curso de Verano...');

    Swal.fire({
      title: '¿Sincronizar pagos del Curso de Verano?',
      html: `
        <div class="text-start">
          <p class="mb-2">Se consultará el estado de cada Sales Order en NetSuite y se actualizarán las inscripciones con:</p>
          <ul class="small mb-0">
            <li><strong>fullyBilled</strong> → pagado</li>
            <li><strong>partiallyBilled</strong> → parcial</li>
            <li><strong>cancelled</strong> → cancelado</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.syncStatus[type].isLoading = true;

      Swal.fire({
        title: 'Sincronizando pagos',
        html: 'Consultando órdenes de venta en NetSuite...<br><small class="text-muted">Esto puede tomar unos segundos</small>',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      this.netsuiteSyncService.syncSummerPayments().subscribe({
        next: (response: any) => {
          console.log('✅ Sync pagos Curso de Verano completado:', response);
          this.syncStatus[type].isLoading  = false;
          this.syncStatus[type].lastSync   = new Date();
          this.syncStatus[type].recordCount = response.data?.processed || 0;

          const d = response.data || {};
          const errorRows = (d.error_details || [])
            .map((e: string) => `<li class="small text-danger">${e}</li>`)
            .join('');

          Swal.fire({
            icon: d.errors > 0 && d.updated === 0 ? 'warning' : 'success',
            title: 'Sincronización completada',
            html: `
              <div class="text-start">
                <table class="table table-sm table-borderless">
                  <tbody>
                    <tr><td class="text-muted">Total inscripciones:</td><td class="text-end"><strong>${d.total_enrollments ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Procesadas:</td><td class="text-end"><strong>${d.processed ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Actualizadas:</td><td class="text-end"><strong class="text-success">${d.updated ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Marcadas pagadas:</td><td class="text-end"><strong class="text-success">${d.paid ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Canceladas:</td><td class="text-end"><strong class="text-warning">${d.cancelled ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Errores NS:</td><td class="text-end"><strong class="text-danger">${d.errors ?? 0}</strong></td></tr>
                    <tr><td class="text-muted">Duración:</td><td class="text-end"><strong>${d.duration_seconds ?? 0}s</strong></td></tr>
                  </tbody>
                </table>
                ${errorRows ? `<p class="mb-1 fw-bold small text-danger">Detalle de errores:</p><ul class="ps-3">${errorRows}</ul>` : ''}
              </div>
            `,
            confirmButtonText: 'Aceptar',
            width: '480px'
          });
        },
        error: (error: any) => {
          console.error('❌ Error sync pagos Curso de Verano:', error);
          this.syncStatus[type].isLoading = false;

          let errorMessage = 'Error al sincronizar los pagos del Curso de Verano';
          if (error.status === 403) {
            errorMessage = error.error?.message || 'No tienes permiso para ejecutar esta sincronización';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          Swal.fire({
            icon: 'error',
            title: 'Error de sincronización',
            html: `<div class="text-start"><p class="mb-0">${errorMessage}</p></div>`,
            confirmButtonText: 'Aceptar'
          });
        }
      });
    });
  }

  syncAll(): void {
    console.log('🔄 Iniciando sincronización completa de todos los recursos...');
    
    // Confirmar con el usuario
    Swal.fire({
      title: '¿Sincronizar todos los recursos?',
      html: `
        <div class="text-start">
          <p class="mb-3">Se sincronizarán <strong>todos los recursos</strong> desde NetSuite:</p>
          <ul class="small">
            <li>Usuarios</li>
            <li>Categorías y Subcategorías</li>
            <li>Departamentos y Áreas</li>
            <li>Centros de Costos</li>
            <li>Eventos Centro Libanés</li>
            <li>Cuentas de Inventario y Pagos</li>
            <li>Razones de Ajuste</li>
            <li>Productos</li>
            <li>Frecuencias de Pago</li>
            <li>Condición Patrimonial</li>
            <li>Condición Administrativa</li>
            <li>Parentesco</li>
            <li>Acceso Clubes</li>
            <li>Género</li>
            <li>Estado Membresía</li>
            <li>Cuotas Membresía</li>
            <li>Socios (Miembros)</li>
            <li>Membresías</li>
            <li>Detalle Membresías</li>
            <li>Registros Médicos</li>
          </ul>
          <p class="mb-0 text-muted small">⏱️ Este proceso puede tomar entre 2-5 minutos</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        // Marcar todos como cargando
        Object.keys(this.syncStatus).forEach(key => {
          this.syncStatus[key].isLoading = true;
        });

        // Mostrar progreso
        Swal.fire({
          title: 'Sincronización en progreso',
          html: `
            <div class="text-center">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mb-2">Sincronizando todos los recursos desde NetSuite...</p>
              <p class="text-muted small">Por favor espera, esto puede tomar varios minutos</p>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false
        });

        // Llamar al servicio
        this.netsuiteSyncService.syncAll().subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta de sincronización completa:', response);

            // Actualizar estados de cada recurso
            Object.keys(this.syncStatus).forEach(key => {
              this.syncStatus[key].isLoading = false;
              this.syncStatus[key].lastSync = new Date();
            });

            // Actualizar contadores si vienen en la respuesta
            if (response.data?.results) {
              const results = response.data.results;
              
              if (results.users?.data) {
                this.syncStatus['users'].recordCount = results.users.data.synced || 0;
                this.syncStatus['users'].created = results.users.data.created || 0;
                this.syncStatus['users'].updated = results.users.data.updated || 0;
              }
              if (results.products?.data) {
                this.syncStatus['products'].recordCount = results.products.data.synced || 0;
              }
              if (results.categories?.data) {
                this.syncStatus['categories'].recordCount = results.categories.data.synced || 0;
              }
              if (results.subcategories?.data) {
                this.syncStatus['subcategories'].recordCount = results.subcategories.data.synced || 0;
              }
              if (results.departments?.data) {
                this.syncStatus['departments'].recordCount = results.departments.data.synced || 0;
              }
              if (results.areas?.data) {
                this.syncStatus['areas'].recordCount = results.areas.data.synced || 0;
              }
              if (results.locations?.data) {
                this.syncStatus['locations'].recordCount = results.locations.data.synced || 0;
              }
              if (results.projects?.data) {
                this.syncStatus['projects'].recordCount = results.projects.data.synced || 0;
              }
              if (results.account_i?.data) {
                this.syncStatus['accounti'].recordCount = results.account_i.data.synced || 0;
              }
              if (results.account_e?.data) {
                this.syncStatus['accounte'].recordCount = results.account_e.data.synced || 0;
              }
              if (results.adjustment_reasons?.data) {
                this.syncStatus['adjustment_reasons'].recordCount = results.adjustment_reasons.data.synced || 0;
              }
              if (results.payment_frequencies?.data) {
                this.syncStatus['payment_frequencies'].recordCount = results.payment_frequencies.data.synced || 0;
              }
              if (results.condicion_patrimonial?.data) {
                this.syncStatus['condicion_patrimonial'].recordCount = results.condicion_patrimonial.data.synced || 0;
              }
              if (results.condicion_adm?.data) {
                this.syncStatus['condicion_adm'].recordCount = results.condicion_adm.data.synced || 0;
              }
              if (results.parentesco?.data) {
                this.syncStatus['parentesco'].recordCount = results.parentesco.data.synced || 0;
              }
              if (results.acceso_clubes?.data) {
                this.syncStatus['acceso_clubes'].recordCount = results.acceso_clubes.data.synced || 0;
              }
              if (results.genero?.data) {
                this.syncStatus['genero'].recordCount = results.genero.data.synced || 0;
              }
              if (results.estado_membresia?.data) {
                this.syncStatus['estado_membresia'].recordCount = results.estado_membresia.data.synced || 0;
              }
              if (results.cuotas_membresia?.data) {
                this.syncStatus['cuotas_membresia'].recordCount = results.cuotas_membresia.data.synced || 0;
              }
              if (results.socios?.data) {
                this.syncStatus['socios'].recordCount = results.socios.data.synced || 0;
              }
              if (results.membresia?.data) {
                this.syncStatus['membresias'].recordCount = results.membresia.data.synced || 0;
              }
              if (results.detalle_membresia?.data) {
                this.syncStatus['detalle_membresias'].recordCount = results.detalle_membresia.data.synced || 0;
              }
              if (results.medical_records?.data) {
                this.syncStatus['medical_records'].recordCount = results.medical_records.data.synced || 0;
              }
            }

            // Mostrar resultado
            const summary = response.data?.summary || {};
            const wasFailed = summary.failed > 0;

            Swal.fire({
              icon: wasFailed ? 'warning' : 'success',
              title: wasFailed ? 'Sincronización completada con errores' : '¡Sincronización completa exitosa!',
              html: `
                <div class="text-start">
                  <p class="mb-3">${response.message || 'Todos los recursos han sido sincronizados'}</p>
                  <table class="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td class="text-muted">Total de recursos:</td>
                        <td class="text-end"><strong>${summary.total_resources || 22}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Sincronizados:</td>
                        <td class="text-end"><strong class="text-success">${summary.synced || 0}</strong></td>
                      </tr>
                      ${summary.failed > 0 ? `
                      <tr>
                        <td class="text-muted">Con errores:</td>
                        <td class="text-end"><strong class="text-danger">${summary.failed}</strong></td>
                      </tr>` : ''}
                      <tr>
                        <td class="text-muted">Duración:</td>
                        <td class="text-end"><strong>${summary.total_duration || 'N/A'}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Fecha y hora:</td>
                        <td class="text-end"><strong>${new Date().toLocaleString('es-ES')}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `,
              confirmButtonText: 'Aceptar',
              width: '500px'
            });
          },
          error: (error: any) => {
            console.error('❌ Error en sincronización completa:', error);
            
            // Marcar todos como no cargando
            Object.keys(this.syncStatus).forEach(key => {
              this.syncStatus[key].isLoading = false;
            });

            let errorMessage = 'Ocurrió un error durante la sincronización completa';
            let errorDetails = '';
            
            if (error.status === 403) {
              errorMessage = error.error?.message || 'No tienes todos los permisos necesarios';
              
              if (error.error?.error?.missing_permissions) {
                const perms = error.error.error.missing_permissions;
                errorDetails = `<strong>Permisos faltantes:</strong><br>• ${perms.join('<br>• ')}`;
              }
            } else if (error.status === 401) {
              errorMessage = 'Tu sesión ha expirado';
              errorDetails = 'Por favor inicia sesión nuevamente';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }

            Swal.fire({
              icon: 'error',
              title: 'Error en la sincronización',
              html: `
                <div class="text-start">
                  <p class="mb-3">${errorMessage}</p>
                  ${errorDetails ? `<div class="alert alert-light mb-3"><small>${errorDetails}</small></div>` : ''}
                  <table class="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td class="text-muted">Código de error:</td>
                        <td class="text-end"><strong>${error.status || 'Desconocido'}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              `,
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

  private performSync(type: string, title: string, syncFn: () => any): void {
    console.log(`🔄 Iniciando sincronización de ${title}...`);
    
    // Marcar como cargando
    this.syncStatus[type].isLoading = true;

    // Mostrar mensaje de inicio
    Swal.fire({
      title: `Sincronizando ${title}`,
      html: `Conectando con NetSuite y obteniendo datos...<br><small class="text-muted">Por favor espera</small>`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio real
    syncFn().subscribe({
      next: (response: SyncResponse) => {
        console.log(`✅ Respuesta de sincronización de ${title}:`, response);

        // Actualizar información de sincronización
        this.syncStatus[type].lastSync = new Date();
        this.syncStatus[type].recordCount = response.data.synced;
        this.syncStatus[type].created = response.data.created || 0;
        this.syncStatus[type].updated = response.data.updated || 0;
        this.syncStatus[type].errors = response.data.errors || 0;
        this.syncStatus[type].isLoading = false;

        // Mostrar resultado exitoso
        Swal.fire({
          icon: 'success',
          title: 'Sincronización completada',
          html: `
            <div class="text-start">
              <p class="mb-3">${title} sincronizados correctamente desde NetSuite</p>
              <table class="table table-sm table-borderless">
                <tbody>
                  ${response.data.total_from_netsuite !== undefined ? `
                  <tr>
                    <td class="text-muted">Total en NetSuite:</td>
                    <td class="text-end"><strong>${response.data.total_from_netsuite}</strong></td>
                  </tr>` : ''}
                  ${response.data.total !== undefined ? `
                  <tr>
                    <td class="text-muted">Total en NetSuite:</td>
                    <td class="text-end"><strong>${response.data.total}</strong></td>
                  </tr>` : ''}
                  <tr>
                    <td class="text-muted">Registros sincronizados:</td>
                    <td class="text-end"><strong>${response.data.synced}</strong></td>
                  </tr>
                  ${response.data.created !== undefined ? `
                  <tr>
                    <td class="text-muted">Creados:</td>
                    <td class="text-end"><strong>${response.data.created}</strong></td>
                  </tr>` : ''}
                  ${response.data.updated !== undefined ? `
                  <tr>
                    <td class="text-muted">Actualizados:</td>
                    <td class="text-end"><strong>${response.data.updated}</strong></td>
                  </tr>` : ''}
                  <tr>
                    <td class="text-muted">Errores:</td>
                    <td class="text-end"><strong>${response.data.errors || 0}</strong></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Fecha y hora:</td>
                    <td class="text-end"><strong>${new Date().toLocaleString('es-ES')}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `,
          confirmButtonText: 'Aceptar',
          width: '500px'
        });
      },
      error: (error: any) => {
        console.error(`❌ Error al sincronizar ${title}:`, error);
        
        this.syncStatus[type].isLoading = false;

        // Mensaje de error personalizado
        let errorMessage = 'Ocurrió un error al sincronizar con NetSuite';
        let errorDetails = '';
        
        if (error.status === 0) {
          // Error de CORS o red
          errorMessage = 'Error de conexión con el servidor';
          errorDetails = 'Verifica que el backend esté activo y el CORS configurado correctamente';
        } else if (error.status === 401) {
          errorMessage = 'Tu sesión ha expirado';
          errorDetails = 'Por favor inicia sesión nuevamente';
        } else if (error.status === 403) {
          // Usar el mensaje del backend si existe
          errorMessage = error.error?.message || 'No tienes permisos para realizar esta sincronización';
          
          // Mostrar permisos requeridos si están disponibles
          if (error.error?.error?.required_permissions) {
            const perms = error.error.error.required_permissions;
            errorDetails = `<strong>Permisos requeridos:</strong><br>`;
            perms.forEach((perm: any) => {
              errorDetails += `• ${perm.module} → ${perm.submodule} → ${perm.permission}<br>`;
            });
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error en la sincronización',
          html: `
            <div class="text-start">
              <p class="mb-3">${errorMessage}</p>
              ${errorDetails ? `<div class="alert alert-light mb-3"><small>${errorDetails}</small></div>` : ''}
              <table class="table table-sm table-borderless">
                <tbody>
                  <tr>
                    <td class="text-muted">Entidad:</td>
                    <td class="text-end"><strong>${title}</strong></td>
                  </tr>
                  <tr>
                    <td class="text-muted">Código de error:</td>
                    <td class="text-end"><strong>${error.status || 'Desconocido'}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `,
          confirmButtonText: 'Aceptar'
        });
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
