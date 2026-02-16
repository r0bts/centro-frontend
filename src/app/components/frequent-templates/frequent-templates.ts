import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';
import { 
  FrequentTemplatesService, 
  Template,
  ShareTemplateRequest,
  TemplateDetail
} from '../../services/frequent-templates.service';

export interface FrequentTemplate {
  id: string;
  name: string;
  areas: any[];
  consolidatedProducts: any[];
  createdFrom?: string;
  createdDate: Date;
}

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  businessUnit: string;
  selected: boolean;
}

export interface ShareTemplateData {
  templateId: string;
  templateName: string;
  businessUnit: string;
  sharedWith: string[];
  canModify: boolean;
  sharedDate: Date;
}

@Component({
  selector: 'app-frequent-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './frequent-templates.html',
  styleUrls: ['./frequent-templates.scss']
})
export class FrequentTemplatesComponent implements OnInit {
  private templatesService = inject(FrequentTemplatesService);
  private cdr = inject(ChangeDetectorRef);
  
  activeSection: string = 'requisicion';
  templates: Template[] = [];
  filteredTemplates: Template[] = [];
  searchTerm: string = '';
  selectedTemplate: TemplateDetail | null = null;
  showDetails: boolean = false;
  isLoading: boolean = false;

  // Propiedades para compartir plantilla
  showShareModal: boolean = false;
  templateToShare: Template | null = null;
  selectedBusinessUnit: string = '';
  availableUsers: SharedUser[] = [];
  canModify: boolean = false;
  businessUnits: string[] = ['Unidad Centro', 'Corporativo'];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    
    console.log('🔍 [FrequentTemplates] Iniciando carga de plantillas...');
    console.log('🔍 [FrequentTemplates] Parámetros:', { filter: 'all', search: this.searchTerm, orderBy: 'recent' });
    
    this.templatesService.getTemplates('all', this.searchTerm, 'recent').subscribe({
      next: (response) => {
        console.log('✅ [FrequentTemplates] Respuesta recibida:', response);
        if (response.success) {
          this.templates = response.data.templates;
          this.filteredTemplates = [...this.templates];
          console.log('✅ [FrequentTemplates] Plantillas cargadas:', this.templates.length);
          this.cdr.detectChanges();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ [FrequentTemplates] Error al cargar plantillas:', error);
        console.error('❌ [FrequentTemplates] Status:', error.status);
        console.error('❌ [FrequentTemplates] Error completo:', error.error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudieron cargar las plantillas frecuentes.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.isLoading = true;
      this.templatesService.getTemplates('all', this.searchTerm, 'recent').subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredTemplates = response.data.templates;
            this.cdr.detectChanges();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.filteredTemplates = [...this.templates];
    }
  }

  viewTemplateDetails(template: Template, event?: MouseEvent): void {
    console.log('🔍 [viewTemplateDetails] Template seleccionada:', template);
    console.log('🖱️ [viewTemplateDetails] Event:', event);
    console.log('🎯 [viewTemplateDetails] Event target:', event?.target);
    console.log('🎯 [viewTemplateDetails] Event currentTarget:', event?.currentTarget);
    console.log('⏱️ [viewTemplateDetails] Timestamp:', Date.now());
    
    // Prevenir propagación y default
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.isLoading = true;

    this.templatesService.getTemplateDetails(template.id).subscribe({
      next: (response) => {
        console.log('✅ [viewTemplateDetails] Respuesta recibida:', response);
        console.log('📦 [viewTemplateDetails] Template detail:', response.data.template);
        this.selectedTemplate = response.data.template;
        this.showDetails = true;
        this.isLoading = false;
        this.cdr.detectChanges(); // ← FORZAR detección inmediata
        console.log('👁️ [viewTemplateDetails] Modal abierto, selectedTemplate:', this.selectedTemplate);
      },
      error: (error) => {
        console.error('❌ [viewTemplateDetails] Error al obtener detalles:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudieron obtener los detalles de la plantilla',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  closeDetails(): void {
    this.selectedTemplate = null;
    this.showDetails = false;
  }

  private isTemplateDetail(template: Template | TemplateDetail): template is TemplateDetail {
    return (template as TemplateDetail).consolidated_products !== undefined;
  }

  loadTemplate(template: Template | TemplateDetail): void {
    console.log('🚀 [loadTemplate] Iniciando carga de plantilla:', template);
    console.log('🔍 [loadTemplate] ¿Es TemplateDetail?', this.isTemplateDetail(template));
    
    Swal.fire({
      title: '¿Cargar plantilla?',
      text: `¿Deseas usar la plantilla "${template.name}" para crear una nueva requisición?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('✅ [loadTemplate] Usuario confirmó carga');
        if (this.isTemplateDetail(template)) {
          console.log('📦 [loadTemplate] Usando TemplateDetail directamente');
          const mappedAreas = template.areas.map(area => ({
            area: area.area,
            areaId: area.id ? String(area.id) : undefined,
            products: area.products.map(product => ({
              id: String(product.id),
              name: product.name,
              quantity: product.quantity,
              unit: product.unit,
              actions: ''
            }))
          }));

          console.log('🗺️ [loadTemplate] Áreas mapeadas:', mappedAreas);
          console.log('🧭 [loadTemplate] Navegando a /requisicion con state:', {
            loadFromTemplate: true,
            templateData: mappedAreas,
            templateName: template.name
          });

          this.router.navigate(['/requisicion'], {
            state: {
              loadFromTemplate: true,
              templateData: mappedAreas,
              templateName: template.name
            }
          });
          return;
        }

        console.log('📡 [loadTemplate] Solicitando detalle completo al backend...');
        // Obtener detalle completo antes de cargar
        this.templatesService.getTemplateDetails(template.id).subscribe({
          next: (response) => {
            console.log('✅ [loadTemplate] Detalle recibido:', response);
            const templateDetail = response.data.template;
            const mappedAreas = templateDetail.areas.map(area => ({
              area: area.area,
              areaId: area.id ? String(area.id) : undefined,
              products: area.products.map(product => ({
                id: String(product.id),
                name: product.name,
                quantity: product.quantity,
                unit: product.unit,
                actions: ''
              }))
            }));

            console.log('🗺️ [loadTemplate] Áreas mapeadas:', mappedAreas);
            console.log('🧭 [loadTemplate] Navegando a /requisicion con state:', {
              loadFromTemplate: true,
              templateData: mappedAreas,
              templateName: templateDetail.name
            });

            // Navegar al componente de requisición con los datos completos
            this.router.navigate(['/requisicion'], {
              state: {
                loadFromTemplate: true,
                templateData: mappedAreas,
                templateName: templateDetail.name
              }
            });
          },
          error: (error) => {
            console.error('❌ [loadTemplate] Error al cargar plantilla:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo cargar la plantilla',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  editTemplate(template: Template): void {
    Swal.fire({
      title: 'Editar nombre de plantilla',
      text: 'Ingrese el nuevo nombre para esta plantilla:',
      input: 'text',
      inputValue: template.name,
      inputPlaceholder: 'Nombre de la plantilla',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un nombre para la plantilla';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newName = result.value.trim();
        
        // Mostrar loading
        Swal.fire({
          title: 'Actualizando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al servicio
        this.templatesService.updateTemplate(template.id, { name: newName }).subscribe({
          next: () => {
            // Recargar plantillas
            this.loadTemplates();
            
            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: 'El nombre de la plantilla ha sido actualizado.',
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            console.error('Error al actualizar:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo actualizar la plantilla',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  deleteTemplate(template: Template): void {
    Swal.fire({
      title: '¿Eliminar plantilla?',
      text: `¿Estás seguro de que deseas eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al servicio
        this.templatesService.deleteTemplate(template.id).subscribe({
          next: (response) => {
            // Recargar plantillas
            this.loadTemplates();
            
            Swal.fire({
              icon: 'success',
              title: '¡Eliminada!',
              text: response.message,
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo eliminar la plantilla',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  duplicateTemplate(template: Template): void {
    Swal.fire({
      title: 'Duplicar plantilla',
      text: 'Ingrese un nombre para la copia de esta plantilla:',
      input: 'text',
      inputValue: `${template.name} (Copia)`,
      inputPlaceholder: 'Nombre de la nueva plantilla',
      showCancelButton: true,
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes ingresar un nombre para la plantilla';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newName = result.value.trim();
        
        // Mostrar loading
        Swal.fire({
          title: 'Duplicando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Llamar al servicio
        this.templatesService.duplicateTemplate(template.id, newName).subscribe({
          next: () => {
            // Recargar plantillas
            this.loadTemplates();
            
            Swal.fire({
              icon: 'success',
              title: '¡Duplicada!',
              text: 'La plantilla ha sido duplicada exitosamente.',
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            console.error('Error al duplicar:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'No se pudo duplicar la plantilla',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTotalProducts(template: Template): number {
    return template.total_products || 0;
  }

  getTotalAreas(template: Template): number {
    return template.total_areas || 0;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  goBack(): void {
    this.router.navigate(['/requisicion']);
  }

  // Métodos para compartir plantilla
  shareTemplate(template: Template): void {
    this.templateToShare = template;
    this.selectedBusinessUnit = '';
    this.canModify = false;
    this.availableUsers = []; // Limpiar usuarios hasta que se seleccione una unidad
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.templateToShare = null;
    this.selectedBusinessUnit = '';
    this.availableUsers = [];
    this.canModify = false;
  }

  onBusinessUnitChange(): void {
    // Limpiar selecciones previas
    this.availableUsers = [];
    
    if (this.selectedBusinessUnit) {
      this.loadUsersForUnit(this.selectedBusinessUnit);
    }
  }

  loadUsersForUnit(businessUnit: string): void {
    // Simular carga de usuarios desde el servicio filtrados por unidad
    // En producción, esto vendría de una API: /api/users?businessUnit=...
    
    // Base de datos simulada de usuarios con sus unidades
    const allUsers: SharedUser[] = [
      { id: '1', name: 'Juan Pérez', email: 'jperez@centro.com', businessUnit: 'Unidad Centro', selected: false },
      { id: '2', name: 'María García', email: 'mgarcia@centro.com', businessUnit: 'Unidad Centro', selected: false },
      { id: '3', name: 'Carlos López', email: 'clopez@centro.com', businessUnit: 'Unidad Centro', selected: false },
      { id: '4', name: 'Ana Martínez', email: 'amartinez@centro.com', businessUnit: 'Corporativo', selected: false },
      { id: '5', name: 'Roberto Rodríguez', email: 'rrodriguez@centro.com', businessUnit: 'Corporativo', selected: false },
      { id: '6', name: 'Laura Fernández', email: 'lfernandez@centro.com', businessUnit: 'Corporativo', selected: false },
      { id: '7', name: 'David Gómez', email: 'dgomez@centro.com', businessUnit: 'Unidad Centro', selected: false },
      { id: '8', name: 'Sandra Hernández', email: 'shernandez@centro.com', businessUnit: 'Corporativo', selected: false },
      { id: '9', name: 'Pedro Díaz', email: 'pdiaz@centro.com', businessUnit: 'Unidad Centro', selected: false },
      { id: '10', name: 'Isabel Torres', email: 'itorres@centro.com', businessUnit: 'Corporativo', selected: false }
    ];
    
    // Filtrar usuarios por la unidad seleccionada
    this.availableUsers = allUsers.filter(user => user.businessUnit === businessUnit);
  }

  toggleUserSelection(userId: string): void {
    const user = this.availableUsers.find(u => u.id === userId);
    if (user) {
      user.selected = !user.selected;
    }
  }

  getSelectedUsers(): SharedUser[] {
    return this.availableUsers.filter(u => u.selected);
  }

  confirmShare(): void {
    if (!this.templateToShare) {
      return;
    }

    const selectedUsers = this.getSelectedUsers();

    if (!this.selectedBusinessUnit) {
      Swal.fire({
        icon: 'warning',
        title: 'Unidad requerida',
        text: 'Debes seleccionar una unidad de negocio.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (selectedUsers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuarios requeridos',
        text: 'Debes seleccionar al menos un usuario para compartir.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Compartiendo plantilla...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio
    const userIds = selectedUsers.map(u => parseInt(u.id));
    const shareRequest: ShareTemplateRequest = {
      user_ids: userIds,
      can_edit: this.canModify
    };

    this.templatesService.shareTemplate(this.templateToShare.id, shareRequest).subscribe({
      next: (response) => {
        this.closeShareModal();
        
        Swal.fire({
          icon: 'success',
          title: '¡Compartida!',
          text: response.message,
          confirmButtonText: 'Entendido'
        });
      },
      error: (error) => {
        console.error('Error al compartir:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo compartir la plantilla',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
