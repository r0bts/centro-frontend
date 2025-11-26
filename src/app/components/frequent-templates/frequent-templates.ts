import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

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
  activeSection: string = 'requisicion';
  templates: FrequentTemplate[] = [];
  filteredTemplates: FrequentTemplate[] = [];
  searchTerm: string = '';
  selectedTemplate: FrequentTemplate | null = null;
  showDetails: boolean = false;

  // Propiedades para compartir plantilla
  showShareModal: boolean = false;
  templateToShare: FrequentTemplate | null = null;
  selectedBusinessUnit: string = '';
  availableUsers: SharedUser[] = [];
  canModify: boolean = false;
  businessUnits: string[] = ['Unidad Centro', 'Corporativo'];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    try {
      const templatesData = localStorage.getItem('requisitionTemplates');
      if (templatesData) {
        this.templates = JSON.parse(templatesData);
        // Convertir strings de fecha a objetos Date
        this.templates = this.templates.map(template => ({
          ...template,
          createdDate: new Date(template.createdDate)
        }));
        // Ordenar por fecha de creación (más reciente primero)
        this.templates.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
      }
      this.filteredTemplates = [...this.templates];
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las plantillas frecuentes.',
        confirmButtonText: 'Entendido'
      });
    }
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.filteredTemplates = this.templates.filter(template =>
        template.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredTemplates = [...this.templates];
    }
  }

  viewTemplateDetails(template: FrequentTemplate): void {
    this.selectedTemplate = template;
    this.showDetails = true;
  }

  closeDetails(): void {
    this.selectedTemplate = null;
    this.showDetails = false;
  }

  loadTemplate(template: FrequentTemplate): void {
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
        // Navegar al componente de requisición con los datos de la plantilla
        this.router.navigate(['/requisicion'], {
          state: {
            loadFromTemplate: true,
            templateData: template.areas,
            templateName: template.name
          }
        });
      }
    });
  }

  editTemplate(template: FrequentTemplate): void {
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
        
        // Actualizar el nombre de la plantilla
        const templateIndex = this.templates.findIndex(t => t.id === template.id);
        if (templateIndex !== -1) {
          this.templates[templateIndex].name = newName;
          
          // Guardar en localStorage
          localStorage.setItem('requisitionTemplates', JSON.stringify(this.templates));
          
          // Actualizar la vista
          this.loadTemplates();
          
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'El nombre de la plantilla ha sido actualizado.',
            confirmButtonText: 'Entendido',
            timer: 2000
          });
        }
      }
    });
  }

  deleteTemplate(template: FrequentTemplate): void {
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
        // Eliminar la plantilla del array
        this.templates = this.templates.filter(t => t.id !== template.id);
        
        // Guardar en localStorage
        localStorage.setItem('requisitionTemplates', JSON.stringify(this.templates));
        
        // Actualizar la vista
        this.loadTemplates();
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminada!',
          text: 'La plantilla ha sido eliminada exitosamente.',
          confirmButtonText: 'Entendido',
          timer: 2000
        });
      }
    });
  }

  duplicateTemplate(template: FrequentTemplate): void {
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
        
        // Crear una copia de la plantilla
        const newTemplate: FrequentTemplate = {
          id: `TEMPLATE-${Date.now()}`,
          name: newName,
          areas: JSON.parse(JSON.stringify(template.areas)),
          consolidatedProducts: JSON.parse(JSON.stringify(template.consolidatedProducts)),
          createdFrom: template.id,
          createdDate: new Date()
        };
        
        // Agregar al array
        this.templates.unshift(newTemplate);
        
        // Guardar en localStorage
        localStorage.setItem('requisitionTemplates', JSON.stringify(this.templates));
        
        // Actualizar la vista
        this.loadTemplates();
        
        Swal.fire({
          icon: 'success',
          title: '¡Duplicada!',
          text: 'La plantilla ha sido duplicada exitosamente.',
          confirmButtonText: 'Entendido',
          timer: 2000
        });
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTotalProducts(template: FrequentTemplate): number {
    return template.consolidatedProducts?.length || 0;
  }

  getTotalAreas(template: FrequentTemplate): number {
    return template.areas?.length || 0;
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
  }

  goBack(): void {
    this.router.navigate(['/requisicion']);
  }

  // Métodos para compartir plantilla
  shareTemplate(template: FrequentTemplate): void {
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

    // Crear objeto de datos compartidos
    const shareData: ShareTemplateData = {
      templateId: this.templateToShare.id,
      templateName: this.templateToShare.name,
      businessUnit: this.selectedBusinessUnit,
      sharedWith: selectedUsers.map(u => u.id),
      canModify: this.canModify,
      sharedDate: new Date()
    };

    // Guardar en localStorage (en producción, esto iría a una API)
    const existingShares = localStorage.getItem('sharedTemplates');
    const shares = existingShares ? JSON.parse(existingShares) : [];
    shares.push(shareData);
    localStorage.setItem('sharedTemplates', JSON.stringify(shares));

    // Mostrar confirmación
    const userNames = selectedUsers.map(u => u.name).join(', ');
    Swal.fire({
      icon: 'success',
      title: '¡Plantilla compartida!',
      html: `
        <p><strong>${this.templateToShare.name}</strong> ha sido compartida con:</p>
        <p>${userNames}</p>
        <p><strong>Unidad:</strong> ${this.selectedBusinessUnit}</p>
        <p><strong>Permisos:</strong> ${this.canModify ? 'Puede modificar' : 'Solo lectura'}</p>
      `,
      confirmButtonText: 'Entendido',
      timer: 3000
    });

    this.closeShareModal();
  }
}
