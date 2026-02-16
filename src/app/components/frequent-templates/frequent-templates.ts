import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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
  
  activeSection: string = 'requisicion';
  
  // Reactive state con BehaviorSubjects
  private templatesSubject = new BehaviorSubject<Template[]>([]);
  templates$ = this.templatesSubject.asObservable();
  
  private filteredTemplatesSubject = new BehaviorSubject<Template[]>([]);
  filteredTemplates$ = this.filteredTemplatesSubject.asObservable();
  
  searchTerm: string = '';
  selectedTemplate: TemplateDetail | null = null;
  showDetails: boolean = false;
  isLoading: boolean = false;
  isProcessing: boolean = false;
  showTemplatesList: boolean = true;

  // Propiedades para compartir plantilla
  showShareModal: boolean = false;
  templateToShare: Template | null = null;
  selectedBusinessUnit: string = '';
  availableUsers: SharedUser[] = [];
  canModify: boolean = false;
  businessUnits: string[] = ['Unidad Centro', 'Corporativo'];

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    
    this.templatesService.getTemplates('all', this.searchTerm, 'recent').subscribe({
      next: (response) => {
        this.templatesSubject.next(response.data.templates);
        this.filteredTemplatesSubject.next(response.data.templates);
        this.showTemplatesList = true;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showTemplatesList = true;
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
            this.filteredTemplatesSubject.next(response.data.templates);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error en búsqueda:', error.error?.message || error.message);
          this.isLoading = false;
        }
      });
    } else {
      this.filteredTemplatesSubject.next(this.templatesSubject.value);
    }
  }

  viewTemplateDetails(template: Template, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.isLoading = true;

    this.templatesService.getTemplateDetails(template.id).subscribe({
      next: (response) => {
        this.selectedTemplate = response.data.template;
        this.showDetails = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al obtener detalles:', error.error?.message || error.message);
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
        if (this.isTemplateDetail(template)) {
          const mappedAreas = template.areas.map(area => ({
            area: area.area,
            areaId: area.id ? String(area.id) : undefined,
            products: area.products.map(product => ({
              id: String(product.id),
              name: product.name,
              quantity: Number(product.quantity) || 0,
              unit: product.unit,
              actions: ''
            }))
          }));


          this.router.navigate(['/requisicion'], {
            state: {
              loadFromTemplate: true,
              templateData: mappedAreas,
              templateName: template.name,
              locationId: template.location?.id || null,
              locationName: template.location?.name || null,
              departmentId: template.department?.id || null,
              projectId: template.project?.id || null,
              awaitingReturn: template.awaiting_return || false
            }
          });
          return;
        }

        this.templatesService.getTemplateDetails(template.id).subscribe({
          next: (response) => {
            const templateDetail = response.data.template;
            const mappedAreas = templateDetail.areas.map(area => ({
              area: area.area,
              areaId: area.id ? String(area.id) : undefined,
              products: area.products.map(product => ({
                id: String(product.id),
                name: product.name,
                quantity: Number(product.quantity) || 0,
                unit: product.unit,
                actions: ''
              }))
            }));


            this.router.navigate(['/requisicion'], {
              state: {
                loadFromTemplate: true,
                templateData: mappedAreas,
                templateName: templateDetail.name,
                locationId: templateDetail.location?.id || null,
                locationName: templateDetail.location?.name || null,
                departmentId: templateDetail.department?.id || null,
                projectId: templateDetail.project?.id || null,
                awaitingReturn: templateDetail.awaiting_return || false
              }
            });
          },
          error: (error) => {
            console.error('❌ Error al cargar plantilla:', error.error?.message || error.message);
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
    if (this.isProcessing) {
      return;
    }

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
        this.isProcessing = true;
        const newName = result.value.trim();
        const oldName = template.name;
        
        // OPTIMISTIC UPDATE - Actualizar inmutablemente
        const updatedTemplates = this.templatesSubject.value.map(t => 
          t.id === template.id ? { ...t, name: newName } : t
        );
        this.templatesSubject.next(updatedTemplates);
        this.filteredTemplatesSubject.next(updatedTemplates);
        
        Swal.fire({
          title: 'Actualizando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.templatesService.updateTemplate(template.id, { name: newName }).subscribe({
          next: () => {
            this.isProcessing = false;
            
            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: 'El nombre de la plantilla ha sido actualizado.',
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            this.isProcessing = false;
            
            // REVERTIR - Restaurar nombre anterior
            const revertedTemplates = this.templatesSubject.value.map(t => 
              t.id === template.id ? { ...t, name: oldName } : t
            );
            this.templatesSubject.next(revertedTemplates);
            this.filteredTemplatesSubject.next(revertedTemplates);
            
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
    if (this.isProcessing) {
      return;
    }

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
        this.isProcessing = true;
        
        // OPTIMISTIC UPDATE - Eliminar inmediatamente
        const templatesCopy = [...this.templatesSubject.value];
        const filteredCopy = [...this.filteredTemplatesSubject.value];
        
        const updatedTemplates = this.templatesSubject.value.filter(t => t.id !== template.id);
        const updatedFiltered = this.filteredTemplatesSubject.value.filter(t => t.id !== template.id);
        
        this.templatesSubject.next(updatedTemplates);
        this.filteredTemplatesSubject.next(updatedFiltered);
        
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.templatesService.deleteTemplate(template.id).subscribe({
          next: (response) => {
            this.isProcessing = false;
            
            Swal.fire({
              icon: 'success',
              title: '¡Eliminada!',
              text: response.message,
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            this.isProcessing = false;
            const errorCode = error.status;
            const errorMsg = error.error?.message || error.message;
            
            if (errorCode === 410 || errorCode === 404) {
              // Ya fue eliminada, mantener update optimista
              Swal.fire({
                icon: 'info',
                title: 'Plantilla ya eliminada',
                text: 'La plantilla ya había sido eliminada anteriormente',
                confirmButtonText: 'Entendido',
                timer: 2000
              });
            } else {
              // Error real, REVERTIR cambios
              this.templatesSubject.next(templatesCopy);
              this.filteredTemplatesSubject.next(filteredCopy);
              
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMsg || 'No se pudo eliminar la plantilla',
                confirmButtonText: 'Entendido'
              });
            }
          }
        });
      }
    });
  }

  duplicateTemplate(template: Template): void {
    if (this.isProcessing) {
      return;
    }

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
        this.isProcessing = true;
        const newName = result.value.trim();
        
        Swal.fire({
          title: 'Duplicando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        this.templatesService.duplicateTemplate(template.id, newName).subscribe({
          next: (response) => {
            this.isProcessing = false;
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
            this.isProcessing = false;
            
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
        console.error('❌ Error al compartir:', error.error?.message || error.message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo compartir la plantilla',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * TrackBy function para optimizar ngFor y detectar cambios
   */
  trackByTemplateId(index: number, template: Template): number {
    return template.id;
  }
}
