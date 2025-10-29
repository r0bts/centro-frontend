import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../content-menu/content-menu';
import Swal from 'sweetalert2';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
  category: string;
  status: 'active' | 'archived' | 'pending';
  description?: string;
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './documentos.html',
  styleUrls: ['./documentos.scss']
})
export class DocumentosComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  searchTerm = '';
  selectedCategory = 'all';
  selectedStatus = 'all';
  
  categories = [
    { value: 'all', label: 'Todas las Categorías' },
    { value: 'contratos', label: 'Contratos' },
    { value: 'reportes', label: 'Reportes' },
    { value: 'requisiciones', label: 'Requisiciones' },
    { value: 'recursos-humanos', label: 'Recursos Humanos' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'operaciones', label: 'Operaciones' }
  ];

  statuses = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'active', label: 'Activo' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'archived', label: 'Archivado' }
  ];

  constructor() {}

  ngOnInit(): void {
    console.log('✅ DocumentosComponent initialized');
    this.loadDocuments();
  }

  loadDocuments(): void {
    // Datos de ejemplo
    this.documents = [
      {
        id: 1,
        name: 'Contrato_Empleado_001.pdf',
        type: 'PDF',
        size: '2.4 MB',
        uploadDate: new Date('2024-06-15'),
        category: 'contratos',
        status: 'active',
        description: 'Contrato de trabajo para empleado del área técnica'
      },
      {
        id: 2,
        name: 'Reporte_Mensual_Mayo.xlsx',
        type: 'Excel',
        size: '1.8 MB',
        uploadDate: new Date('2024-06-01'),
        category: 'reportes',
        status: 'active',
        description: 'Reporte financiero del mes de mayo 2024'
      },
      {
        id: 3,
        name: 'Requisicion_Equipos_TI.docx',
        type: 'Word',
        size: '560 KB',
        uploadDate: new Date('2024-06-10'),
        category: 'requisiciones',
        status: 'pending',
        description: 'Solicitud de nuevos equipos para el departamento de TI'
      },
      {
        id: 4,
        name: 'Manual_Procedimientos_RH.pdf',
        type: 'PDF',
        size: '5.2 MB',
        uploadDate: new Date('2024-05-20'),
        category: 'recursos-humanos',
        status: 'active',
        description: 'Manual de procedimientos de recursos humanos actualizado'
      },
      {
        id: 5,
        name: 'Presupuesto_Q2_2024.xlsx',
        type: 'Excel',
        size: '3.1 MB',
        uploadDate: new Date('2024-04-15'),
        category: 'finanzas',
        status: 'archived',
        description: 'Presupuesto para el segundo trimestre de 2024'
      },
      {
        id: 6,
        name: 'Plan_Operativo_2024.pptx',
        type: 'PowerPoint',
        size: '8.7 MB',
        uploadDate: new Date('2024-01-10'),
        category: 'operaciones',
        status: 'active',
        description: 'Plan operativo anual 2024'
      }
    ];
    
    this.filteredDocuments = [...this.documents];
  }

  onSearch(): void {
    this.filterDocuments();
  }

  onCategoryChange(): void {
    this.filterDocuments();
  }

  onStatusChange(): void {
    this.filterDocuments();
  }

  filterDocuments(): void {
    this.filteredDocuments = this.documents.filter(doc => {
      const matchesSearch = this.searchTerm === '' || 
        doc.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesCategory = this.selectedCategory === 'all' || doc.category === this.selectedCategory;
      const matchesStatus = this.selectedStatus === 'all' || doc.status === this.selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  getFileIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bi-file-earmark-pdf';
      case 'excel': return 'bi-file-earmark-excel';
      case 'word': return 'bi-file-earmark-word';
      case 'powerpoint': return 'bi-file-earmark-ppt';
      default: return 'bi-file-earmark';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'badge bg-success';
      case 'pending': return 'badge bg-warning';
      case 'archived': return 'badge bg-secondary';
      default: return 'badge bg-light';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending': return 'Pendiente';
      case 'archived': return 'Archivado';
      default: return status;
    }
  }

  getDocumentsByStatus(status: string): number {
    return this.documents.filter(doc => doc.status === status).length;
  }

  downloadDocument(doc: Document): void {
    console.log('📥 Descargando documento:', doc.name);
    // Aquí implementarías la lógica de descarga
  }

  viewDocument(doc: Document): void {
    console.log('👁️ Visualizando documento:', doc.name);
    // Aquí implementarías la lógica de visualización
  }

  editDocument(doc: Document): void {
    console.log('✏️ Editando documento:', doc.name);
    // Aquí implementarías la lógica de edición
  }

  deleteDocument(doc: Document): void {
    console.log('🗑️ Eliminando documento:', doc.name);
    Swal.fire({
      title: '¿Eliminar documento?',
      text: `¿Estás seguro de que deseas eliminar el documento "${doc.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.documents = this.documents.filter(d => d.id !== doc.id);
        this.filterDocuments();
        
        Swal.fire({
          icon: 'success',
          title: 'Documento eliminado',
          text: `El documento "${doc.name}" ha sido eliminado exitosamente`,
          confirmButtonText: 'Continuar',
          timer: 2000,
          timerProgressBar: true
        });
      }
    });
  }

  uploadDocument(): void {
    console.log('📤 Subir nuevo documento');
    // Aquí implementarías la lógica de subida de archivos
  }

  exportList(): void {
    console.log('📊 Exportando lista de documentos');
    // Aquí implementarías la lógica de exportación
  }
}