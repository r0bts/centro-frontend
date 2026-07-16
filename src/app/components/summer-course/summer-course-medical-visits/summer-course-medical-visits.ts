import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { ServicioMedicoService } from '../../../services/servicio-medico';

@Component({
  selector: 'app-summer-course-medical-visits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './summer-course-medical-visits.html',
  styleUrls: ['./summer-course-medical-visits.scss']
})
export class SummerCourseMedicalVisitsComponent implements OnInit {
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
    patient_type: 'CURSO_VERANO'
  };

  isMedicoDropdownOpen = false;
  medicoSearchText = '';

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
          const allLocs = res.data.locations || res.data;
          this.locations = allLocs.filter((l: any) => {
            const name = (l.name || '').toLowerCase();
            return name.includes('servicio médico') || name.includes('servicio medico');
          });
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
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Error al cargar consultas', err)
      });
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
      patient_type: 'CURSO_VERANO'
    };
    this.loadConsultas();
  }
}
