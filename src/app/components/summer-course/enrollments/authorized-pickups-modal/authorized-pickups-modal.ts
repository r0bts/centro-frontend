import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScAuthorizedPickupsService, ScAuthorizedPickup } from '../../../../services/summer-course/sc-authorized-pickups.service';
import { ScRegistrationsService } from '../../../../services/summer-course/sc-registrations.service';

@Component({
  selector: 'app-authorized-pickups-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './authorized-pickups-modal.html',
  styleUrls: ['./authorized-pickups-modal.scss']
})
export class AuthorizedPickupsModalComponent implements OnInit {
  @Input() participant!: any;
  @Output() close = new EventEmitter<void>();

  pickups: ScAuthorizedPickup[] = [];
  loading = true;
  saving = false;
  error: string | null = null;
  showForm = false;
  showFamilySelection = false;
  loadingFamily = false;
  familyMembers: any[] = [];
  pickupToDelete: ScAuthorizedPickup | null = null;
  deleting = false;
  editingPickupId: number | null = null;

  newPickup: Partial<ScAuthorizedPickup> = {
    name: '',
    relationship: '',
    phone: '',
    photo_base64: '',
    allowed_days: {
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false
    }
  };

  photoPreview: string | null = null;

  constructor(
    private api: ScAuthorizedPickupsService,
    private registrationsService: ScRegistrationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPickups();
  }

  loadPickups() {
    this.loading = true;
    this.api.getByParticipant(this.participant.id).subscribe({
      next: (res: any) => {
        this.pickups = res.data?.pickups || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar los terceros autorizados.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Formato no soportado. Sube un archivo JPG, PNG o WebP.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'La imagen es muy pesada (Máximo 5MB).';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.newPickup.photo_base64 = this.photoPreview || undefined;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  savePickup() {
    if (!this.newPickup.name || !this.newPickup.relationship || !this.newPickup.photo_base64) {
      this.error = 'Nombre, parentesco y fotografía son obligatorios.';
      return;
    }

    // Check if at least one day is selected
    const days = this.newPickup.allowed_days;
    if (!days?.lunes && !days?.martes && !days?.miercoles && !days?.jueves && !days?.viernes && !days?.sabado && !days?.domingo) {
      this.error = 'Debe seleccionar al menos un día permitido.';
      return;
    }

    this.saving = true;
    this.error = null;
    this.newPickup.participant_id = this.participant.id;

    if (this.editingPickupId) {
      this.api.edit(this.editingPickupId, this.newPickup).subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.resetForm();
          this.loadPickups();
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Error al actualizar el tercero autorizado.';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.api.add(this.newPickup).subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.resetForm();
          this.loadPickups();
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Error al guardar el tercero autorizado.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  startAddFlow() {
    this.error = null;
    const fetchId = this.participant.socio_id || this.participant.titular_id;
    if (fetchId) {
      this.showFamilySelection = true;
      this.loadingFamily = true;
      this.registrationsService.getFamily(fetchId).subscribe({
        next: (res) => {
          let members = res.data || [];
          // Filtrar miembros inactivos
          this.familyMembers = members.filter((m: any) => !m.isinactive);
          
          this.loadingFamily = false;
          // Si no hay familia, saltar directo al form
          if (this.familyMembers.length === 0) {
            this.showFamilySelection = false;
            this.showForm = true;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingFamily = false;
          this.showFamilySelection = false;
          this.showForm = true;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.showForm = true;
    }
  }

  skipFamilySelection() {
    this.showFamilySelection = false;
    this.showForm = true;
  }

  startEditFlow(pickup: ScAuthorizedPickup) {
    this.error = null;
    this.editingPickupId = pickup.id!;
    this.newPickup = {
      name: pickup.name,
      relationship: pickup.relationship,
      phone: pickup.phone || '',
      allowed_days: pickup.allowed_days ? { ...pickup.allowed_days } : {
        lunes: false, martes: false, miercoles: false, jueves: false,
        viernes: false, sabado: false, domingo: false
      }
    };
    this.photoPreview = pickup.photo_url || null;
    this.showForm = true;
  }

  selectFamilyMember(member: any) {
    this.newPickup.name = member.fullName;
    this.newPickup.relationship = member.memberType || '';
    this.newPickup.phone = member.phone || '';
    
    this.showFamilySelection = false;
    this.showForm = true;
  }

  confirmDelete(pickup: ScAuthorizedPickup) {
    this.pickupToDelete = pickup;
  }

  cancelDelete() {
    this.pickupToDelete = null;
  }

  executeDelete() {
    if (!this.pickupToDelete?.id) return;
    this.deleting = true;
    
    this.api.delete(this.pickupToDelete.id).subscribe({
      next: () => {
        this.deleting = false;
        this.pickupToDelete = null;
        this.loadPickups();
      },
      error: (err) => {
        this.deleting = false;
        this.pickupToDelete = null;
        this.error = err.error?.message || 'Error al eliminar.';
        this.cdr.markForCheck();
      }
    });
  }

  resetForm() {
    this.newPickup = {
      name: '',
      relationship: '',
      phone: '',
      photo_base64: '',
      allowed_days: {
        lunes: false,
        martes: false,
        miercoles: false,
        jueves: false,
        viernes: false,
        sabado: false,
        domingo: false
      }
    };
    this.photoPreview = null;
    this.error = null;
    this.editingPickupId = null;
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('sce-modal-overlay')) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
