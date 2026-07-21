import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicioMedicoService } from '../../../../services/servicio-medico';
import { AuthService } from '../../../../services/auth.service';
import { ContentMenu } from '../../../content-menu/content-menu';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-servicio-medico-expediente',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './servicio-medico-expediente.html',
  styleUrl: './servicio-medico-expediente.scss'
})
export class ServicioMedicoExpediente implements OnInit {
  token: string = '';
  medicalProfile: any = null;
  consultas: any[] = [];
  locations: any[] = [];
  medicos: any[] = [];
  filteredMedicos: any[] = [];
  medicoSearchTerm: string = '';
  medicoDropdownOpen: boolean = false;
  
  enfermeras: any[] = [];
  filteredEnfermeras: any[] = [];
  enfermeraSearchTerm: string = '';
  enfermeraDropdownOpen: boolean = false;

  products: any[] = [];
  filteredProducts: any[] = [];
  productsLoading: boolean = false;
  productDropdownOpen: boolean = false;
  productSearchTerm: string = '';
  
  isLoadingProfile: boolean = true;
  isLoadingConsultas: boolean = true;
  isSavingProfile: boolean = false;
  isSavingConsulta: boolean = false;
  isNotifyingAdmin: boolean = false;
  
  errorProfile: string = '';
  
  // Tab control: 'expediente' o 'nueva_consulta'
  activeTab: string = 'expediente';

  nuevaConsultaData: any = {};
  
  // Materiales temporales
  nuevoMaterial: any = { product_id: null, product_name: '', cantidad: 0, descuenta_inventario: true };

  consultaSeleccionada: any = null;
  isEditingConsulta = false;
  consultaEditId: number | null = null;
  
  showValidationErrors = false;
  backButtonText: string = 'Regresar al Escáner';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private servicioMedico: ServicioMedicoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.nuevaConsultaData = this.getDefaultConsultaData();
    this.route.paramMap.subscribe(params => {
      const tokenParam = params.get('token');
      if (tokenParam) {
        this.token = tokenParam;
        this.loadProfile();
        this.loadConsultas();
        this.loadLocations();
        this.loadProducts();
        this.loadMedicos();
        this.loadEnfermeras();
      } else {
        this.errorProfile = 'Token no proporcionado';
        this.isLoadingProfile = false;
        this.isLoadingConsultas = false;
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const source = params.get('source');
      if (source === 'visitas') {
        this.backButtonText = 'Regresar a Visitas';
      } else {
        this.backButtonText = 'Regresar al Escáner';
      }
    });
  }

  loadLocations() {
    this.servicioMedico.getLocations().subscribe({
      next: (res: any) => {
        if (res.success) {
          const allLocs = res.data.locations || res.data;
          // Se cambió para obtener desde acceso_clubes. Ya no se filtra por "Servicio Médico"
          this.locations = allLocs;
        }
      },
      error: (err) => console.error('Error al cargar locations', err)
    });
  }

  loadMedicos() {
    this.servicioMedico.getMedicos().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.medicos = res.data.map((m: any) => ({...m, fullName: `${m.first_name} ${m.last_name}`}));
          this.filteredMedicos = [...this.medicos];
          if (this.nuevaConsultaData.medico_user_id) {
            this.medicoSearchTerm = this.getMedicoName(this.nuevaConsultaData.medico_user_id);
          }
        }
      },
      error: (err) => console.error('Error al cargar medicos', err)
    });
  }

  loadEnfermeras() {
    this.servicioMedico.getEnfermeras().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.enfermeras = res.data.map((e: any) => ({...e, fullName: `${e.first_name} ${e.last_name}`}));
          this.filteredEnfermeras = [...this.enfermeras];
          if (this.nuevaConsultaData.enfermera_user_id) {
            this.enfermeraSearchTerm = this.getEnfermeraName(this.nuevaConsultaData.enfermera_user_id);
          }
        }
      },
      error: (err) => console.error('Error al cargar enfermeras', err)
    });
  }

  loadProducts() {
    this.productsLoading = true;
    this.servicioMedico.getProducts('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.products = res.data.products || res.data;
          this.filteredProducts = [...this.products];
        }
        this.productsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.productsLoading = false;
      }
    });
  }

  onProductSearchInput(event: any) {
    if (!this.nuevaConsultaData.ubicacion_netsuite) {
      event.target.value = '';
      setTimeout(() => {
        this.productDropdownOpen = false;
        this.nuevoMaterial.product_name = '';
      });
      Swal.fire('Atención', 'Por favor selecciona la ubicación antes de buscar materiales.', 'warning');
      return;
    }

    const term = event.target.value.toLowerCase();
    this.nuevoMaterial.product_id = null; // reset if typing
    setTimeout(() => { this.productDropdownOpen = true; });
    
    // Búsqueda en servidor si hay al menos 3 caracteres
    if (term.length >= 3) {
      this.productsLoading = true;
      this.servicioMedico.getProducts(term).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.products = res.data.products || res.data;
            this.filteredProducts = [...this.products];
          }
          this.productsLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.productsLoading = false;
        }
      });
    } else {
      // Filtrado local si hay menos de 3 caracteres
      this.filteredProducts = this.products.filter(p => {
        const name = (p.name || p.displayname || '').toLowerCase();
        return name.includes(term);
      });
    }
  }

  selectProduct(prod: any) {
    this.nuevoMaterial.product_id = prod.id;
    this.nuevoMaterial.product_name = prod.name || prod.displayname;
    setTimeout(() => { this.productDropdownOpen = false; });
  }

  openProductDropdown() {
    setTimeout(() => { this.productDropdownOpen = true; });
  }

  onBlurProductDropdown() {
    // Timeout to allow mousedown on dropdown item to fire first
    setTimeout(() => {
      this.productDropdownOpen = false;
      // Revert if no valid selection was made
      if (!this.nuevoMaterial.product_id) {
        this.nuevoMaterial.product_name = '';
      }
    }, 200);
  }

  getMedicoName(id: number | null): string {
    if (!id) return '';
    const med = this.medicos.find(m => m.id === id);
    return med ? `${med.first_name} ${med.last_name}` : '';
  }

  getEnfermeraName(id: number | null): string {
    if (!id) return '';
    const enf = this.enfermeras.find(e => e.id === id);
    return enf ? `${enf.first_name} ${enf.last_name}` : '';
  }

  onMedicoSearchInput(event: any) {
    const term = event.target.value.toLowerCase();
    this.nuevaConsultaData.medico_user_id = null; // reset if typing
    setTimeout(() => { this.medicoDropdownOpen = true; });
    this.filteredMedicos = this.medicos.filter(m => 
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(term)
    );
  }

  selectMedico(med: any) {
    this.nuevaConsultaData.medico_user_id = med ? med.id : null;
    this.medicoSearchTerm = med ? `${med.first_name} ${med.last_name}` : '';
    setTimeout(() => { this.medicoDropdownOpen = false; });
  }

  openMedicoDropdown() {
    setTimeout(() => { 
      this.medicoDropdownOpen = true; 
      this.medicoSearchTerm = '';
      this.filteredMedicos = [...this.medicos];
    });
  }

  onBlurMedicoDropdown() {
    setTimeout(() => {
      this.medicoDropdownOpen = false;
      if (!this.nuevaConsultaData.medico_user_id) {
        this.medicoSearchTerm = '';
      } else {
        this.medicoSearchTerm = this.getMedicoName(this.nuevaConsultaData.medico_user_id);
      }
    }, 200);
  }

  onEnfermeraSearchInput(event: any) {
    const term = event.target.value.toLowerCase();
    this.nuevaConsultaData.enfermera_user_id = null;
    setTimeout(() => { this.enfermeraDropdownOpen = true; });
    this.filteredEnfermeras = this.enfermeras.filter(e => 
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(term)
    );
  }

  selectEnfermera(enf: any) {
    this.nuevaConsultaData.enfermera_user_id = enf ? enf.id : null;
    this.enfermeraSearchTerm = enf ? `${enf.first_name} ${enf.last_name}` : '';
    setTimeout(() => { this.enfermeraDropdownOpen = false; });
  }

  openEnfermeraDropdown() {
    setTimeout(() => { 
      this.enfermeraDropdownOpen = true; 
      this.enfermeraSearchTerm = '';
      this.filteredEnfermeras = [...this.enfermeras];
    });
  }

  onBlurEnfermeraDropdown() {
    setTimeout(() => {
      this.enfermeraDropdownOpen = false;
      if (!this.nuevaConsultaData.enfermera_user_id) {
        this.enfermeraSearchTerm = '';
      } else {
        this.enfermeraSearchTerm = this.getEnfermeraName(this.nuevaConsultaData.enfermera_user_id);
      }
    }, 200);
  }

  loadProfile() {
    this.isLoadingProfile = true;
    this.errorProfile = '';
    this.servicioMedico.getMedicalProfileByQr(this.token)
      .pipe(finalize(() => {
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.medicalProfile = res.data;
          } else {
            this.errorProfile = res.message || 'No se encontró el expediente.';
          }
        },
        error: (err: any) => {
          this.errorProfile = err?.error?.message || 'Error al cargar el expediente.';
        }
      });
  }

  loadConsultas() {
    this.isLoadingConsultas = true;
    this.servicioMedico.getConsultas(this.token)
      .pipe(finalize(() => {
        setTimeout(() => {
          this.isLoadingConsultas = false;
          
          // Auto-open consultation if query param is present
          const consultaId = this.route.snapshot.queryParamMap.get('consulta_id');
          if (consultaId && this.consultas.length > 0) {
            const cToEdit = this.consultas.find(c => String(c.id) === consultaId);
            if (cToEdit && !this.isEditingConsulta) {
              this.editarConsulta(cToEdit);
            }
          }
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.consultas = res.data;
          }
        },
        error: (err) => console.error('Error al cargar consultas', err)
      });
  }

  goBack() {
    const source = this.route.snapshot.queryParamMap.get('source');
    if (source === 'visitas') {
      this.router.navigate(['/servicio-medico/visitas']);
    } else {
      this.router.navigate(['/servicio-medico/escaner']);
    }
  }

  guardarDatosGenerales() {
    this.isSavingProfile = true;
    const payload = {
      token: this.token,
      blood_type: this.medicalProfile.blood_type,
      allergies: this.medicalProfile.allergies,
      chronic_conditions: this.medicalProfile.chronic_conditions,
      active_medications: this.medicalProfile.active_medications,
      family_history: this.medicalProfile.family_history,
      surgical_history: this.medicalProfile.surgical_history,
      general_notes: this.medicalProfile.general_notes
    };

    this.servicioMedico.updateMedicalProfile(payload)
      .pipe(finalize(() => {
        this.isSavingProfile = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire('Éxito', 'Datos generales guardados correctamente.', 'success');
          } else {
            Swal.fire('Error', 'Error: ' + res.message, 'error');
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Error al guardar datos generales.', 'error');
        }
      });
  }

  notifyAdmin() {
    if (!this.medicalProfile) return;
    
    this.isNotifyingAdmin = true;
    const fullName = `${this.medicalProfile.first_name || this.medicalProfile.firstName || ''} ${this.medicalProfile.last_name || this.medicalProfile.lastName || ''}`.trim();
    
    this.servicioMedico.notificarAdminCursos({ name: fullName })
      .pipe(finalize(() => {
        this.isNotifyingAdmin = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({
              icon: 'success',
              title: 'Notificación Enviada',
              text: 'Se ha notificado al administrador exitosamente.',
              timer: 2500,
              showConfirmButton: false
            });
          } else {
            Swal.fire('Error', res.message || 'No se pudo enviar la notificación.', 'error');
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Error de conexión al enviar WhatsApp.', 'error');
        }
      });
  }

  iniciarNuevaConsulta() {
    this.nuevaConsultaData = this.getDefaultConsultaData();
    this.isEditingConsulta = false;
    this.consultaEditId = null;
    this.medicoSearchTerm = this.getMedicoName(this.nuevaConsultaData.medico_user_id);
    this.enfermeraSearchTerm = '';
    this.activeTab = 'nueva_consulta';
  }

  eliminarConsulta(consulta: any, event: Event) {
    event.stopPropagation();
    Swal.fire({
      title: '¿Eliminar consulta?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicioMedico.deleteConsulta(consulta.id).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire('Eliminado', 'La consulta ha sido eliminada.', 'success');
              this.consultas = this.consultas.filter(c => c.id !== consulta.id);
            } else {
              Swal.fire('Error', res.message, 'error');
            }
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo eliminar la consulta.', 'error');
          }
        });
      }
    });
  }

  enviarANetsuite(consulta: any, event: Event) {
    event.stopPropagation();
    if (!consulta.motivo_consulta && !consulta.motivo) {
      Swal.fire('Atención', 'El motivo de la consulta es obligatorio antes de cerrar.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Enviar a NetSuite?',
      text: 'Esto cerrará la consulta y afectará inventario si hay materiales. Ya no podrás editarla.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = { ...consulta, status: 'cerrada' };
        // Parse materiales just in case for the backend
        if (typeof payload.materiales_json === 'string') {
          try { payload.materiales_json = JSON.parse(payload.materiales_json); } catch(e) {}
        }
        
        this.servicioMedico.updateConsulta(consulta.id, payload).subscribe({
          next: (res: any) => {
            if (res.success) {
              Swal.fire('Éxito', 'Consulta enviada a NetSuite y cerrada.', 'success');
              const index = this.consultas.findIndex(c => c.id === consulta.id);
              if (index !== -1) {
                this.consultas[index] = res.data;
              }
            } else {
              Swal.fire('Error', res.message, 'error');
            }
          },
          error: (err) => {
            Swal.fire('Error', 'No se pudo enviar la consulta.', 'error');
          }
        });
      }
    });
  }

  editarConsulta(consulta: any) {
    console.log('Editando consulta:', consulta);
    this.isEditingConsulta = true;
    this.consultaEditId = consulta.id;
    
    // Parse materials if they come as string
    let parsedMateriales = [];
    if (consulta.materiales_json) {
      if (typeof consulta.materiales_json === 'string') {
        try {
          parsedMateriales = JSON.parse(consulta.materiales_json);
        } catch(e) {
          console.error("Error parsing materiales_json", e);
        }
      } else if (Array.isArray(consulta.materiales_json)) {
        parsedMateriales = consulta.materiales_json;
      }
    }

    this.nuevaConsultaData = {
      ...this.getDefaultConsultaData(),
      ...consulta,
      ubicacion_netsuite: consulta.ubicacion_netsuite ? String(consulta.ubicacion_netsuite) : '',
      materiales_json: parsedMateriales
    };
    this.medicoSearchTerm = this.getMedicoName(this.nuevaConsultaData.medico_user_id);
    this.enfermeraSearchTerm = this.getEnfermeraName(this.nuevaConsultaData.enfermera_user_id);
    this.activeTab = 'editar_consulta';
  }

  cancelarConsulta() {
    this.activeTab = 'expediente';
  }

  getDefaultConsultaData() {
    const currentUser = this.authService.getCurrentUser();
    return {
      ubicacion_netsuite: '',
      medico_user_id: currentUser ? currentUser.id : null,
      enfermera_user_id: null,
      tipo_atencion_id: 1, // 1 = Rutina, 2 = Urgencia
      se_requirio_ambulancia: false,
      nivel_atencion: false,
      status: 'abierta',
      ta_sistolica: null,
      ta_diastolica: null,
      fc: null,
      fr: null,
      temperatura: null,
      peso: null,
      talla: null,
      imc: null,
      saturacion_o2: null,
      glucosa: null,
      notas_enfermeria: '',
      motivo_consulta: '',
      padecimiento_actual: '',
      exploracion_fisica: '',
      diagnostico: '',
      plan_tratamiento: '',
      materiales_json: []
    };
  }

  toggleTipoAtencion(event: any) {
    this.nuevaConsultaData.tipo_atencion_id = event.target.checked ? 2 : 1;
  }

  calcularIMC() {
    if (this.nuevaConsultaData.peso && this.nuevaConsultaData.talla) {
      const peso = parseFloat(this.nuevaConsultaData.peso);
      const tallaMetros = parseFloat(this.nuevaConsultaData.talla) / 100;
      if (tallaMetros > 0) {
        const imc = peso / (tallaMetros * tallaMetros);
        this.nuevaConsultaData.imc = imc.toFixed(2);
      }
    } else {
      this.nuevaConsultaData.imc = null;
    }
  }

  agregarMaterial() {
    if (!this.nuevoMaterial.product_id || this.nuevoMaterial.cantidad <= 0) {
      Swal.fire('Atención', 'Debe seleccionar un producto válido de NetSuite y una cantidad mayor a 0', 'warning');
      return;
    }
    this.nuevaConsultaData.materiales_json.push({ 
      ...this.nuevoMaterial,
      no_incluir: !this.nuevoMaterial.descuenta_inventario 
    });
    this.nuevoMaterial = { product_id: null, product_name: '', cantidad: 0, descuenta_inventario: true };
  }

  removerMaterial(index: number) {
    this.nuevaConsultaData.materiales_json.splice(index, 1);
  }

  guardarConsulta(cerrar: boolean) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    if (!this.nuevaConsultaData.motivo_consulta) {
      this.showValidationErrors = true;
      Swal.fire('Atención', 'El motivo de la consulta es obligatorio', 'warning');
      return;
    }

    this.showValidationErrors = false;
    this.isSavingConsulta = true;
    const payload = {
      ...this.nuevaConsultaData,
      status: cerrar ? 'cerrada' : 'abierta',
      patient_token: this.token,
      patient_type: this.medicalProfile?.patient_type
    };

    const request$ = this.isEditingConsulta && this.consultaEditId
      ? this.servicioMedico.updateConsulta(this.consultaEditId, payload)
      : this.servicioMedico.createConsulta(payload);

    request$
      .pipe(finalize(() => {
        this.isSavingConsulta = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire('Éxito', this.isEditingConsulta ? 'Consulta actualizada correctamente' : 'Consulta registrada correctamente', 'success');
            if (cerrar || !this.isEditingConsulta) {
              this.cancelarConsulta();
            } else {
              // Es una edición de borrador ("Solo Guardar"), nos quedamos en la pantalla.
              // No hacemos nada para que el usuario pueda seguir editando.
            }
            this.loadConsultas(); // Recargar historial
          } else {
            Swal.fire('Error', 'Error: ' + res.message, 'error');
          }
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Error al guardar la consulta', 'error');
        }
      });
  }

  hasRisk(value: string | null | undefined): boolean {
    if (!value) return false;
    const valLow = value.toLowerCase().trim();
    if (valLow === 'ninguna' || valLow === 'ninguno' || valLow === 'no' || valLow === 'na' || valLow === 'n/a') {
      return false;
    }
    return true;
  }
}
