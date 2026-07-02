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
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  children: any[] = [];
  pickups: any[] = [];
  isLoading = false;
  isSavingPickup = false;
  phone: string = '';

  showQrModal = false;
  qrData: any = null;

  showAddModal = false;
  showDurationModal = false;
  showFamilySelection = false;
  loadingFamily = false;
  familyOptions: any[] = [];

  pendingQrChildId: number | null = null;
  pendingQrPickupId: number | null = null;
  selectedDuration: number = 15;

  newPickup = {
    participant_id: null as any,
    authorized_socio_id: null as any,
    name: '',
    relationship: '',
    phone: '',
    photo_url: '',
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

  showProfileModal = false;
  activeProfileTab: 'photo' | 'medical' = 'photo';
  showPhotoTab = true;
  showMedicalTab = true;
  selectedChildForProfile: any = null;
  medicalProfile = {
    blood_type: '',
    allergies: '',
    active_medications: '',
    chronic_conditions: '',
    profile_picture: ''
  };

  // Extraordinary Pass State
  showExtraordinaryModal = false;
  extraordinaryData = {
    participant_id: null as any,
    authorized_name: '',
    photo_base64: ''
  };

  // Camera state
  showCamera = false;
  currentFacingMode: 'user' | 'environment' = 'user';
  cameraTarget: 'medical' | 'pickup' | 'extraordinary' = 'medical';
  videoStream: MediaStream | null = null;

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
    this.checkTermsAndConditions();
  }

  checkTermsAndConditions() {
    this.isLoading = true;
    this.tutorApi.getActiveTerms('Curso de Verano').subscribe({
      next: (res: any) => {
        if (res.success && res.data && !res.user_accepted) {
          this.isLoading = false;
          Swal.fire({
            title: res.data.title,
            html: `<div style="text-align: left; max-height: 50vh; overflow-y: auto; font-size: 0.9em; padding: 10px; border: 1px solid #eee; border-radius: 5px;">${res.data.content}</div>`,
            showCancelButton: false,
            confirmButtonText: 'He leído y acepto los términos',
            confirmButtonColor: '#10b981',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            width: '600px'
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
              this.tutorApi.acceptTerms(res.data.id).subscribe({
                next: () => {
                  Swal.close();
                  this.loadData();
                },
                error: () => {
                  Swal.fire('Error', 'Hubo un problema al guardar tu respuesta. Por favor intenta de nuevo o recarga la página.', 'error');
                }
              });
            }
          });
        } else {
          this.loadData();
        }
      },
      error: () => {
        this.loadData();
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.tutorApi.getChildren().subscribe({
      next: (res: any) => {
        try {
          if (res.success) {
            this.children = res.data;
            this.loadPickups();
          } else {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        } catch (e: any) {
          this.isLoading = false;
          this.cdr.detectChanges();
          Swal.fire('Error JS en getChildren', e.message, 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error HTTP getChildren', err.message, 'error');
      }
    });
  }

  pickupsByChild: { [key: number]: any[] } = {};

  loadPickups() {
    this.tutorApi.getPickups().subscribe({
      next: (res: any) => {
        try {
          this.pickups = res.success ? res.data : [];
          this.pickupsByChild = {};
          
          if (this.pickups && typeof this.pickups[Symbol.iterator] === 'function') {
            for (let p of this.pickups) {
              if (!this.pickupsByChild[p.participant_id]) {
                this.pickupsByChild[p.participant_id] = [];
              }
              this.pickupsByChild[p.participant_id].push(p);
            }
          } else {
            console.warn('pickups no es iterable', this.pickups);
            this.pickups = [];
          }
          
          this.isLoading = false;
          this.cdr.detectChanges();
        } catch (e: any) {
          this.isLoading = false;
          this.cdr.detectChanges();
          Swal.fire('Error JS en getPickups', e.message, 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error HTTP getPickups', err.message, 'error');
      }
    });
  }

  getPickupsForChild(childId: number) {
    return this.pickupsByChild[childId] || [];
  }

  openAddModal(childId: number) {
    this.newPickup.participant_id = childId;
    this.newPickup.authorized_socio_id = null;
    this.newPickup.name = '';
    this.newPickup.relationship = '';
    this.newPickup.phone = '';
    this.newPickup.photo_url = '';
    this.newPickup.allowed_days = {
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false
    };
    this.showAddModal = true;
    this.showFamilySelection = true;
    this.loadingFamily = true;
    this.familyOptions = [];

    this.tutorApi.getFamilyOptions(childId).subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data.length > 0) {
          this.familyOptions = res.data;
        } else {
          this.showFamilySelection = false;
        }
        this.loadingFamily = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFamily = false;
        this.showFamilySelection = false;
        this.cdr.detectChanges();
      }
    });

    this.cdr.detectChanges();
  }

  skipFamilySelection() {
    this.showFamilySelection = false;
    this.cdr.detectChanges();
  }

  selectFamilyMember(member: any) {
    let cleanName = member.fullName || '';
    cleanName = cleanName.replace(/^\d+\s*/, '').trim();
    
    this.newPickup.name = cleanName;
    this.newPickup.authorized_socio_id = member.id || null;
    this.newPickup.relationship = member.memberType || '';
    this.newPickup.phone = member.phone || '';
    if (member.photo_base64) {
      this.newPickup.photo_url = member.photo_base64;
    }
    this.showFamilySelection = false;
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
    if (!this.newPickup.name || !this.newPickup.photo_url || !this.newPickup.phone) {
      Swal.fire('Error', 'Nombre, teléfono y foto son obligatorios', 'warning');
      return;
    }

    this.isSavingPickup = true;
    this.cdr.detectChanges();
    this.tutorApi.addPickup(this.newPickup).subscribe({
      next: (res: any) => {
        this.isSavingPickup = false;
        if (res.success) {
          Swal.fire('Guardado', 'Persona autorizada agregada', 'success');
          this.closeAddModal();
          this.loadPickups();
        } else {
          this.cdr.detectChanges();
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => {
        this.isSavingPickup = false;
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

  openDurationModal(childId: number, pickupId: number) {
    this.pendingQrChildId = childId;
    this.pendingQrPickupId = pickupId;
    this.selectedDuration = 60;
    this.showDurationModal = true;
  }

  closeDurationModal() {
    this.showDurationModal = false;
    this.pendingQrChildId = null;
    this.pendingQrPickupId = null;
  }

  generatePass() {
    if (!this.pendingQrChildId || !this.pendingQrPickupId) return;

    this.tutorApi.generatePass(this.pendingQrChildId, this.pendingQrPickupId, this.selectedDuration).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.qrData = res.data.url;
          this.closeDurationModal();
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

  closeOnOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('tp-modal-overlay')) {
      this.closeAddModal();
    }
  }

  closeOnQrOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('tp-modal-overlay')) {
      this.closeQrModal();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/tutor-portal/login']);
  }

  isPhotoComplete(child: any): boolean {
    return !!(child.profile_picture || child.photo_url);
  }

  isMedicalComplete(child: any): boolean {
    return !!(child.blood_type || child.allergies || child.active_medications || child.chronic_conditions);
  }

  getMissingProfileItems(child: any): string[] {
    const missing = [];
    if (!this.isPhotoComplete(child)) missing.push('photo');
    if (!this.isMedicalComplete(child)) missing.push('medical');
    return missing;
  }

  openProfileModal(child: any, mode: 'missing' | 'edit' = 'missing') {
    this.selectedChildForProfile = child;
    this.medicalProfile = {
      blood_type: child.blood_type || '',
      allergies: child.allergies || '',
      active_medications: child.active_medications || '',
      chronic_conditions: child.chronic_conditions || '',
      profile_picture: child.photo_url ? child.photo_url : (child.profile_picture ? `data:image/jpeg;base64,${child.profile_picture}` : '')
    };

    if (mode === 'edit') {
      this.showPhotoTab = true;
      this.showMedicalTab = true;
      this.activeProfileTab = 'photo';
    } else {
      const missing = this.getMissingProfileItems(child);
      this.showPhotoTab = missing.includes('photo');
      this.showMedicalTab = missing.includes('medical');
      
      if (!this.showPhotoTab && !this.showMedicalTab) {
        // Fallback en caso de error
        this.showPhotoTab = true;
        this.showMedicalTab = true;
      }
      this.activeProfileTab = this.showPhotoTab ? 'photo' : 'medical';
    }

    this.showProfileModal = true;
    this.cdr.detectChanges();
  }

  setProfileTab(tab: 'photo' | 'medical') {
    if (tab === 'medical' && this.activeProfileTab === 'photo') {
      return; // Do not allow advancing via tabs
    }
    this.activeProfileTab = tab;
    this.cdr.detectChanges();
  }

  closeProfileModal() {
    this.showProfileModal = false;
    this.selectedChildForProfile = null;
    this.stopCamera();
    this.cdr.detectChanges();
  }

  isSocioParticipant(child: any): boolean {
    return child && child.participant_type === 'member';
  }

  goToMedicalForm(child: any, variant: 'completo' | 'simplificado'): void {
    const navigateFn = () => {
      console.log('Navigating to form. Child object:', child);
      this.closeProfileModal();
      if (variant === 'completo') {
        const idToPass = child.socio_id || child.titular_socio_id || child.id;
        console.log('Completo idToPass:', idToPass);
        this.router.navigate(['/tutor-portal/expediente-medico/completo', idToPass]);
      } else {
        this.router.navigate(['/tutor-portal/expediente-medico/simplificado', child.id]);
      }
    };

    // Si hay una foto cargada, guardamos silenciosamente antes de ir al cuestionario
    if (this.medicalProfile && this.medicalProfile.profile_picture && this.medicalProfile.profile_picture.startsWith('data:image')) {
      this.isLoading = true;
      this.cdr.detectChanges();
      
      this.tutorApi.updateParticipantProfile(child.id, this.medicalProfile).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          navigateFn();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          Swal.fire('Error', 'No se pudo guardar la fotografía, pero puedes continuar.', 'warning').then(() => {
            navigateFn();
          });
        }
      });
    } else {
      navigateFn();
    }
  }

  continueToMedicalFlow() {
    if (!this.medicalProfile.profile_picture) {
      Swal.fire('Atención', 'La fotografía es obligatoria para continuar.', 'warning');
      return;
    }

    const switchToMedical = () => {
      this.activeProfileTab = 'medical';
      this.cdr.detectChanges();
    };

    if (this.medicalProfile.profile_picture.startsWith('data:image')) {
      this.isLoading = true;
      this.cdr.detectChanges();
      
      this.tutorApi.updateParticipantProfile(this.selectedChildForProfile.id, this.medicalProfile).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.data && res.data.profile_picture) {
            this.selectedChildForProfile.profile_picture = res.data.profile_picture;
          }
          switchToMedical();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          Swal.fire('Error', 'No se pudo guardar la fotografía, pero puedes continuar.', 'warning').then(() => {
            switchToMedical();
          });
        }
      });
    } else {
      switchToMedical();
    }
  }

  closeOnProfileOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('tp-modal-overlay')) {
      this.closeProfileModal();
    }
  }

  private compressAndSetImage(file: File, target: 'profile' | 'extraordinary') {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 800;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (target === 'profile') {
            this.medicalProfile.profile_picture = dataUrl;
            // Removed auto-advance per user request
          } else {
            this.extraordinaryData.photo_base64 = dataUrl;
          }
          this.showCamera = false;
          this.stopCamera();
          this.cdr.detectChanges();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onProfilePhotoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.compressAndSetImage(file, 'profile');
    }
  }

  onExtraordinaryPhotoUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.compressAndSetImage(file, 'extraordinary');
    }
  }

  // Camera Methods
  async startCamera(target: 'medical' | 'pickup' | 'extraordinary' = 'medical') {
    this.cameraTarget = target;
    this.showCamera = true;
    this.cdr.detectChanges();
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: this.currentFacingMode }, 
        audio: false 
      });
      const videoElement = document.getElementById('cameraVideo') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.videoStream;
      }
    } catch (err) {
      this.showCamera = false;
      this.cdr.detectChanges();
      Swal.fire('Error', 'No se pudo acceder a la cámara. Revisa los permisos de tu navegador.', 'error');
    }
  }

  async toggleCamera() {
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: this.currentFacingMode }, 
        audio: false 
      });
      const videoElement = document.getElementById('cameraVideo') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.videoStream;
      }
    } catch (err) {
      console.error('Error toggling camera', err);
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    this.showCamera = false;
  }

  takeSnapshot() {
    const video = document.getElementById('cameraVideo') as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      if (this.cameraTarget === 'pickup') {
        this.newPickup.photo_url = dataUrl;
      } else if (this.cameraTarget === 'extraordinary') {
        this.extraordinaryData.photo_base64 = dataUrl;
      } else {
        this.medicalProfile.profile_picture = dataUrl;
      }
      
      this.stopCamera();
      // Removed auto-advance per user request
      this.cdr.detectChanges();
    }
  }

  retakePhoto() {
    this.medicalProfile.profile_picture = '';
    this.startCamera('medical');
  }

  retakePickupPhoto() {
    this.newPickup.photo_url = '';
    this.startCamera('pickup');
  }

  retakeExtraordinaryPhoto() {
    this.extraordinaryData.photo_base64 = '';
    this.startCamera('extraordinary');
  }

  openExtraordinaryModal(child: any) {
    this.extraordinaryData = {
      participant_id: child.id,
      authorized_name: '',
      photo_base64: ''
    };
    this.showExtraordinaryModal = true;
  }

  closeExtraordinaryModal() {
    this.showExtraordinaryModal = false;
    this.stopCamera();
  }

  closeOnExtraordinaryOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('tp-modal-overlay')) {
      this.closeExtraordinaryModal();
    }
  }

  generateExtraordinaryPass() {
    if (!this.extraordinaryData.authorized_name.trim()) {
      Swal.fire('Atención', 'Ingresa el nombre de quien recogerá.', 'warning');
      return;
    }
    if (!this.extraordinaryData.photo_base64) {
      Swal.fire('Atención', 'La fotografía es obligatoria.', 'warning');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    this.tutorApi.generateExtraordinaryPass(this.extraordinaryData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.closeExtraordinaryModal();
          const pIndex = this.children.findIndex((p: any) => p.id === Number(this.extraordinaryData.participant_id));
          if (pIndex !== -1) {
              this.children[pIndex].extra_pass_url = res.data.url;
          }
          this.qrData = res.data.url;
          this.showQrModal = true;
          this.cdr.detectChanges();
        } else {
          this.cdr.detectChanges();
          Swal.fire('Error', res.message || 'No se pudo generar el pase.', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        let msg = 'Error al generar el pase.';
        if (err.error && err.error.message) {
            msg = err.error.message;
        }
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  saveProfile() {
    if (!this.medicalProfile.profile_picture) {
      Swal.fire('Atención', 'La fotografía es obligatoria para la credencialización.', 'warning');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.tutorApi.updateParticipantProfile(this.selectedChildForProfile.id, this.medicalProfile).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire('Guardado', 'Perfil actualizado correctamente', 'success');
          this.closeProfileModal();
          this.loadData(); // reload children to get updated profile
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', 'Error al guardar el perfil', 'error');
      }
    });
  }
}
