import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TutorApiService } from '../../../services/tutor-portal/tutor-api.service';
import { TutorAuthService } from '../../../services/tutor-portal/tutor-auth.service';
import Swal from 'sweetalert2';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  children: any[] = [];
  pickups: any[] = [];
  isLoading = true;
  phone: string = '';

  showQrModal = false;
  qrData: any = null;

  showAddModal = false;
  newPickup = {
    participant_id: null as any,
    name: '',
    relationship: '',
    phone: '',
    photo_url: '' // simplified for now
  };

  constructor(
    private authService: TutorAuthService,
    private tutorApi: TutorApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/tutor-portal/login']);
    }
    this.phone = this.authService.getPhone() || '';
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.tutorApi.getChildren().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.children = res.data;
          this.loadPickups();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
      }
    });
  }

  loadPickups() {
    this.tutorApi.getPickups().subscribe({
      next: (res: any) => {
        this.pickups = res.success ? res.data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPickupsForChild(childId: number) {
    return this.pickups.filter(p => p.participant_id === childId);
  }

  openAddModal(childId: number) {
    this.newPickup.participant_id = childId;
    this.newPickup.name = '';
    this.newPickup.relationship = '';
    this.newPickup.phone = '';
    this.newPickup.photo_url = '';
    this.showAddModal = true;
    this.cdr.detectChanges();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.cdr.detectChanges();
  }

  onPhotoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newPickup.photo_url = e.target.result; // Using base64 for simplicity in MVP
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  addPickup() {
    if (!this.newPickup.name || !this.newPickup.photo_url) {
      Swal.fire('Error', 'Nombre y foto son obligatorios', 'warning');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.tutorApi.addPickup(this.newPickup).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire('Guardado', 'Persona autorizada agregada', 'success');
          this.closeAddModal();
          this.loadPickups();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', 'Error al guardar', 'error');
      }
    });
  }

  removePickup(id: number) {
    Swal.fire({
      title: '¿Eliminar autorización?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.cdr.detectChanges();
        this.tutorApi.deletePickup(id).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.loadPickups();
            } else {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          },
          error: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  generatePass(childId: number, pickupId: number) {
    Swal.fire({
      title: 'Generando QR...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.tutorApi.generatePass(childId, pickupId).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.close();
          this.qrData = res.data;
          this.showQrModal = true;
          this.cdr.detectChanges();
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => {
        Swal.fire('Error', 'Error al generar pase', 'error');
      }
    });
  }

  closeQrModal() {
    this.showQrModal = false;
    this.qrData = null;
    this.cdr.detectChanges();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/tutor-portal/login']);
  }
}
