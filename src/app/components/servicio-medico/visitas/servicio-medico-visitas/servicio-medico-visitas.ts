import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../../../content-menu/content-menu';
import { ServicioMedicoService } from '../../../../services/servicio-medico';
import { Router, RouterModule } from '@angular/router';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-servicio-medico-visitas',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu, RouterModule],
  templateUrl: './servicio-medico-visitas.html',
  styleUrl: './servicio-medico-visitas.scss'
})
export class ServicioMedicoVisitas implements OnInit {
  consultas: any[] = [];
  locations: any[] = [];
  medicos: any[] = [];
  isLoadingConsultas: boolean = true;
  
  private searchSubject = new Subject<string>();

  filters = {
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    medico: '',
    medico_search: '',
    search: '',
    patient_type: '',
    numero_socio: ''
  };

  isMedicoDropdownOpen = false;
  medicoSearchText = '';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;

  get paginatedConsultas() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.consultas.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.consultas.length / this.itemsPerPage);
  }

  get pagesArray() {
    // Para simplificar, mostramos todas las páginas (o podríamos limitar si son muchas)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get filteredMedicos() {
    if (!this.medicoSearchText) return this.medicos;
    const search = this.medicoSearchText.toLowerCase();
    return this.medicos.filter(m => 
      (m.first_name + ' ' + m.last_name).toLowerCase().includes(search)
    );
  }

  toggleMedicoDropdown() {
    this.isMedicoDropdownOpen = !this.isMedicoDropdownOpen;
    if (this.isMedicoDropdownOpen) {
       this.medicoSearchText = '';
    }
  }

  selectMedico(med: any) {
    if (med) {
      this.filters.medico = med.id;
      this.filters.medico_search = med.first_name + ' ' + med.last_name;
    } else {
      this.filters.medico = '';
      this.filters.medico_search = '';
    }
    this.isMedicoDropdownOpen = false;
    this.aplicarFiltros();
  }

  constructor(
    private servicioMedico: ServicioMedicoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.aplicarFiltros();
    });

    this.loadLocations();
    this.loadMedicos();
    this.loadConsultas();
  }

  loadMedicos() {
    this.servicioMedico.getMedicos().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.medicos = res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar médicos', err)
    });
  }

  loadLocations() {
    this.servicioMedico.getLocations().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.locations = res.data.locations || res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cargar locations', err)
    });
  }

  getLocationName(id: string | number): string {
    if (!id) return 'Servicio Médico';
    const loc = this.locations.find(l => String(l.id) === String(id));
    return loc ? loc.name : String(id);
  }

  loadConsultas() {
    this.isLoadingConsultas = true;
    this.servicioMedico.getConsultas('', this.filters)
      .pipe(finalize(() => {
        this.isLoadingConsultas = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.consultas = res.data;
            this.currentPage = 1; // Reset to page 1 on new search
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error al cargar consultas', err)
      });
  }

  nuevaVisita() {
    this.router.navigate(['/servicio-medico/escaner']);
  }

  aplicarFiltros() {
    this.loadConsultas();
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }
  
  limpiarFiltros() {
    this.filters = {
      fecha_inicio: '',
      fecha_fin: '',
      ubicacion: '',
      medico: '',
      medico_search: '',
      search: '',
      patient_type: '',
      numero_socio: ''
    };
    this.loadConsultas();
  }

}

