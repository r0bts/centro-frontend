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
  id: number;
  username: string;
  full_name: string;
  email?: string;
  location_id: number | null;
  selected?: boolean;
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
  searchUserTerm: string = '';
  canModify: boolean = false;
  businessUnits: string[] = ['HERMES', 'GLACIAR'];
  currentUserLocationId: number = 0;
  canSelectBusinessUnit: boolean = true;

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
    this.canModify = false;
    this.availableUsers = [];
    
    // Obtener location_id del usuario actual
    const userJson = localStorage.getItem('centro_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserLocationId = user.location_id || 0;
      } catch {
        this.currentUserLocationId = 0;
      }
    }
    
    // Configurar según location_id
    if (this.currentUserLocationId === 0) {
      // Admin puede elegir cualquier Business Unit
      this.canSelectBusinessUnit = true;
      this.selectedBusinessUnit = '';
    } else if (this.currentUserLocationId === 1) {
      // HERMES - Auto-seleccionar
      this.canSelectBusinessUnit = false;
      this.selectedBusinessUnit = 'HERMES';
      this.loadUsersFromApi();
    } else if (this.currentUserLocationId === 9) {
      // GLACIAR - Auto-seleccionar
      this.canSelectBusinessUnit = false;
      this.selectedBusinessUnit = 'GLACIAR';
      this.loadUsersFromApi();
    }
    
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
    this.templateToShare = null;
    this.selectedBusinessUnit = '';
    this.availableUsers = [];
    this.searchUserTerm = '';
    this.canModify = false;
  }

  /**
   * Filtrar usuarios localmente por nombre o número de empleado
   */
  get filteredUsers(): SharedUser[] {
    if (!this.searchUserTerm.trim()) {
      return this.availableUsers;
    }
    
    const term = this.searchUserTerm.toLowerCase();
    return this.availableUsers.filter(user => 
      user.full_name.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term)
    );
  }

  onBusinessUnitChange(): void {
    this.availableUsers = [];
    
    if (this.selectedBusinessUnit) {
      this.loadUsersFromApi();
    }
  }

  loadUsersFromApi(): void {
    const t0 = performance.now();

    this.templatesService.getUsersByLocation()
      .subscribe({
        next: (users: SharedUser[]) => {
          const t1 = performance.now();
          this.availableUsers = users;
          const t2 = performance.now();
          
          console.log(`⏱️ TIMING: API=${(t1-t0).toFixed(0)}ms | DOM=${(t2-t1).toFixed(0)}ms | Total=${(t2-t0).toFixed(0)}ms | Users=${users.length}`);
        },
        error: (error: any) => {
          console.error('❌ Error cargando usuarios:', error.status, error.message);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los usuarios disponibles.',
            confirmButtonText: 'Entendido'
          });
        }
      });
  }

  toggleUserSelection(userId: number): void {
    const user = this.availableUsers.find(u => u.id === userId);
    if (user) {
      user.selected = !user.selected;
    }
  }

  getSelectedUsers(): SharedUser[] {
    return this.availableUsers.filter(u => u.selected);
  }

  confirmShare(): void {
    console.log('1️⃣ confirmShare() INICIADO');
    
    if (!this.templateToShare) {
      console.log('❌ No hay templateToShare');
      return;
    }

    const selectedUsers = this.getSelectedUsers();
    console.log('2️⃣ Usuarios seleccionados:', selectedUsers.length, selectedUsers);

    if (selectedUsers.length === 0) {
      console.log('⚠️ Mostrando alerta: sin usuarios');
      Swal.fire({
        icon: 'warning',
        title: 'Usuarios requeridos',
        text: 'Debes seleccionar al menos un usuario para compartir.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    console.log('3️⃣ Mostrando loading...');
    Swal.fire({
      title: 'Compartiendo plantilla...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Llamar al servicio
    const userIds = selectedUsers.map(u => u.id);
    const shareRequest: ShareTemplateRequest = {
      user_ids: userIds,
      can_edit: this.canModify
    };

    console.log('4️⃣ Llamando API...', {
      template_id: this.templateToShare.id,
      user_ids: userIds,
      can_edit: this.canModify
    });

    this.templatesService.shareTemplate(this.templateToShare.id, shareRequest).subscribe({
      next: (response) => {
        console.log('5️⃣ ✅ Respuesta SUCCESS:', response);
        this.closeShareModal();
        
        // Construir mensaje detallado
        const sharedCount = response.data.shared_with?.length || 0;
        const alreadyCount = response.data.already_shared?.length || 0;
        
        let message = '';
        let icon: 'success' | 'info' = 'success';
        
        if (sharedCount > 0 && alreadyCount > 0) {
          message = `Se compartió con ${sharedCount} usuario(s) nuevo(s).\n${alreadyCount} usuario(s) ya tenían acceso.`;
        } else if (sharedCount > 0) {
          message = `Plantilla compartida con ${sharedCount} usuario(s).`;
        } else if (alreadyCount > 0) {
          message = `${alreadyCount === 1 ? 'Este usuario ya tiene' : 'Estos usuarios ya tienen'} acceso a la plantilla.`;
          icon = 'info';
        }
        
        Swal.fire({
          icon: icon,
          title: sharedCount > 0 ? '¡Compartida!' : 'Información',
          text: message,
          confirmButtonText: 'Entendido'
        });
      },
      error: (error) => {
        console.log('5️⃣ ❌ Respuesta ERROR:', error);
        console.error('❌ Error completo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo compartir la plantilla',
          confirmButtonText: 'Entendido'
        });
      }
    });
    
    console.log('6️⃣ Subscribe registrado, esperando respuesta...');
  }

  /**
   * TrackBy function para optimizar ngFor y detectar cambios
   */
  trackByTemplateId(index: number, template: Template): number {
    return template.id;
  }
}
