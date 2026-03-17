import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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

export interface AreaMapEntry {
  originalAreaId: number | null;
  originalAreaName: string;
  newAreaId: string;
  newAreaName: string;
  productCount: number;
  products: any[];
  showProducts?: boolean;   // toggle lista de productos
  areaSearch?: string;      // texto de búsqueda del área
  showDropdown?: boolean;   // visibilidad del dropdown de búsqueda
}

@Component({
  selector: 'app-frequent-templates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './frequent-templates.html',
  styleUrls: ['./frequent-templates.scss']
})
export class FrequentTemplatesComponent implements OnInit {
  private templatesService = inject(FrequentTemplatesService);
  
  activeSection: string = 'requisicion';
  
  // Reactive state con signals
  templates = signal<Template[]>([]);
  filteredTemplates = signal<Template[]>([]);

  searchTerm: string = '';
  selectedTemplate = signal<TemplateDetail | null>(null);
  showDetails = signal(false);
  isLoading = signal(false);
  isProcessing = signal(false);
  showTemplatesList = signal(true);

  // Propiedades para mapeo de áreas al usar plantilla
  showAreaMapModal = signal(false);
  templateDetailToLoad = signal<TemplateDetail | null>(null);
  areaMapping = signal<AreaMapEntry[]>([]);
  availableAreas = signal<{ id: string; name: string }[]>([]);
  isLoadingAreas = signal(false);

  // Propiedades para compartir plantilla
  showShareModal = signal(false);
  templateToShare = signal<Template | null>(null);
  selectedBusinessUnit: string = '';
  availableUsers = signal<SharedUser[]>([]);
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
    this.isLoading.set(true);
    
    this.templatesService.getTemplates('all', this.searchTerm, 'recent').subscribe({
      next: (response) => {
        this.templates.set(response.data.templates);
        this.filteredTemplates.set(response.data.templates);
        this.showTemplatesList.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.showTemplatesList.set(true);
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
      this.isLoading.set(true);
      this.templatesService.getTemplates('all', this.searchTerm, 'recent').subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredTemplates.set(response.data.templates);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error en búsqueda:', error.error?.message || error.message);
          this.isLoading.set(false);
        }
      });
    } else {
      this.filteredTemplates.set(this.templates());
    }
  }

  viewTemplateDetails(template: Template, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.isLoading.set(true);

    this.templatesService.getTemplateDetails(template.id).subscribe({
      next: (response) => {
        this.selectedTemplate.set(response.data.template);
        this.showDetails.set(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error al obtener detalles:', error.error?.message || error.message);
        this.isLoading.set(false);
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
    this.selectedTemplate.set(null);
    this.showDetails.set(false);
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
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (this.isTemplateDetail(template)) {
        this.openAreaMappingModal(template);
        return;
      }

      this.templatesService.getTemplateDetails(template.id).subscribe({
        next: (response) => {
          this.openAreaMappingModal(response.data.template);
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.message || 'No se pudo cargar la plantilla',
            confirmButtonText: 'Entendido'
          });
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  // MÉTODOS: MAPEO DE ÁREAS AL USAR PLANTILLA
  // ─────────────────────────────────────────────

  private navigateWithTemplate(templateDetail: TemplateDetail, areasOverride?: AreaMapEntry[]): void {
    let mappedAreas: any[];

    if (areasOverride && areasOverride.length > 0) {
      // Usar el mapeo definido por el usuario
      mappedAreas = areasOverride.map(entry => ({
        area: entry.newAreaName,
        areaId: entry.newAreaId,
        products: entry.products.map(product => ({
          id: String(product.id),
          name: product.name,
          quantity: Number(product.quantity) || 0,
          unit: product.unit,
          actions: ''
        }))
      }));
    } else {
      // Usar áreas originales de la plantilla
      mappedAreas = templateDetail.areas.map(area => ({
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
    }

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
  }

  openAreaMappingModal(templateDetail: TemplateDetail): void {
    this.templateDetailToLoad.set(templateDetail);
    this.isLoadingAreas.set(true);
    this.areaMapping.set(templateDetail.areas.map(area => ({
      originalAreaId: area.id ?? null,
      originalAreaName: area.area,
      newAreaId: area.id ? String(area.id) : '',
      newAreaName: area.area,
      productCount: area.products.length,
      products: area.products
    })));
    // Abrir el modal DESPUÉS de construir el mapping (signal notifica el cambio)
    this.showAreaMapModal.set(true);

    this.templatesService.getAreas().subscribe({
      next: (areas) => {
        this.availableAreas.set(areas);
        // Corregir áreas que no existan en el catálogo
        this.areaMapping.set(this.areaMapping().map(entry => {
          const found = areas.find(a => a.id === entry.newAreaId);
          return (!found && areas.length > 0)
            ? { ...entry, newAreaId: areas[0].id, newAreaName: areas[0].name }
            : entry;
        }));
        this.isLoadingAreas.set(false);
      },
      error: () => {
        this.isLoadingAreas.set(false);
        this.showAreaMapModal.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las áreas disponibles.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  onAreaMappingChange(index: number, newAreaId: string): void {
    const area = this.availableAreas().find(a => a.id === newAreaId);
    if (area) {
      const updated = [...this.areaMapping()];
      updated[index] = { ...updated[index], newAreaId: area.id, newAreaName: area.name };
      this.areaMapping.set(updated);
    }
  }

  toggleProductsView(index: number): void {
    const updated = [...this.areaMapping()];
    updated[index] = { ...updated[index], showProducts: !updated[index].showProducts };
    this.areaMapping.set(updated);
  }

  getFilteredAreas(index: number): { id: string; name: string }[] {
    const term = (this.areaMapping()[index]?.areaSearch || '').toLowerCase().trim();
    if (!term) return this.availableAreas();
    return this.availableAreas().filter(a => a.name.toLowerCase().includes(term));
  }

  onAreaSearch(index: number, term: string): void {
    const updated = [...this.areaMapping()];
    updated[index] = { ...updated[index], areaSearch: term, showDropdown: true };
    this.areaMapping.set(updated);
  }

  selectArea(index: number, areaId: string): void {
    const area = this.availableAreas().find(a => a.id === areaId);
    if (area) {
      const updated = [...this.areaMapping()];
      updated[index] = {
        ...updated[index],
        newAreaId: area.id,
        newAreaName: area.name,
        areaSearch: '',
        showDropdown: false
      };
      this.areaMapping.set(updated);
    }
  }

  closeAreaDropdown(index: number): void {
    const updated = [...this.areaMapping()];
    updated[index] = { ...updated[index], showDropdown: false, areaSearch: '' };
    this.areaMapping.set(updated);
  }

  confirmLoadWithMapping(): void {
    const detail = this.templateDetailToLoad();
    if (!detail) return;
    this.showAreaMapModal.set(false);
    this.navigateWithTemplate(detail, this.areaMapping());
    this.templateDetailToLoad.set(null);
    this.areaMapping.set([]);
  }

  cancelAreaMapping(): void {
    this.showAreaMapModal.set(false);
    this.templateDetailToLoad.set(null);
    this.areaMapping.set([]);
  }

  editTemplate(template: Template): void {
    if (this.isProcessing()) {
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
        this.isProcessing.set(true);
        const newName = result.value.trim();
        const oldName = template.name;
        
        // OPTIMISTIC UPDATE - Actualizar inmutablemente
        const updatedTemplates = this.templates().map(t => 
          t.id === template.id ? { ...t, name: newName } : t
        );
        this.templates.set(updatedTemplates);
        this.filteredTemplates.set(updatedTemplates);
        
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
            this.isProcessing.set(false);
            
            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: 'El nombre de la plantilla ha sido actualizado.',
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            this.isProcessing.set(false);
            
            // REVERTIR - Restaurar nombre anterior
            const revertedTemplates = this.templates().map(t => 
              t.id === template.id ? { ...t, name: oldName } : t
            );
            this.templates.set(revertedTemplates);
            this.filteredTemplates.set(revertedTemplates);
            
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
    if (this.isProcessing()) {
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
        this.isProcessing.set(true);
        
        // OPTIMISTIC UPDATE - Eliminar inmediatamente
        const templatesCopy = [...this.templates()];
        const filteredCopy = [...this.filteredTemplates()];
        
        const updatedTemplates = this.templates().filter(t => t.id !== template.id);
        const updatedFiltered = this.filteredTemplates().filter(t => t.id !== template.id);
        
        this.templates.set(updatedTemplates);
        this.filteredTemplates.set(updatedFiltered);
        
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
            this.isProcessing.set(false);
            
            Swal.fire({
              icon: 'success',
              title: '¡Eliminada!',
              text: response.message,
              confirmButtonText: 'Entendido',
              timer: 2000
            });
          },
          error: (error) => {
            this.isProcessing.set(false);
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
              this.templates.set(templatesCopy);
              this.filteredTemplates.set(filteredCopy);
              
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
    if (this.isProcessing()) {
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
        this.isProcessing.set(true);
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
            this.isProcessing.set(false);
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
            this.isProcessing.set(false);
            
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
    this.templateToShare.set(template);
    this.canModify = false;
    this.availableUsers.set([]);
    
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
    
    this.showShareModal.set(true);
  }

  closeShareModal(): void {
    this.showShareModal.set(false);
    this.templateToShare.set(null);
    this.selectedBusinessUnit = '';
    this.availableUsers.set([]);
    this.searchUserTerm = '';
    this.canModify = false;
  }

  /**
   * Filtrar usuarios localmente por nombre o número de empleado
   */
  get filteredUsers(): SharedUser[] {
    if (!this.searchUserTerm.trim()) {
      return this.availableUsers();
    }
    
    const term = this.searchUserTerm.toLowerCase();
    return this.availableUsers().filter(user => 
      user.full_name.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term)
    );
  }

  onBusinessUnitChange(): void {
    this.availableUsers.set([]);
    
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
          this.availableUsers.set(users);
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
    this.availableUsers.update(users =>
      users.map(u => u.id === userId ? { ...u, selected: !u.selected } : u)
    );
  }

  getSelectedUsers(): SharedUser[] {
    return this.availableUsers().filter(u => u.selected);
  }

  confirmShare(): void {
    console.log('1️⃣ confirmShare() INICIADO');
    
    if (!this.templateToShare()) {
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
      template_id: this.templateToShare()!.id,
      user_ids: userIds,
      can_edit: this.canModify
    });

    this.templatesService.shareTemplate(this.templateToShare()!.id, shareRequest).subscribe({
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
