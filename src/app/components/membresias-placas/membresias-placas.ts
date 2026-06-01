import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../content-menu/content-menu';
import { VehiclesService } from '../../services/vehicles.service';
import { VehicleModalComponent } from './vehicle-modal/vehicle-modal';
import {
  PlacasEstado,
  MembresiaGroup,
  Vehicle,
  SocioInfo,
  VehicleFormData,
  VehiclesByMembresiaRaw,
  VehicleRaw,
} from '../../models/vehicle.model';

@Component({
  selector: 'app-membresias-placas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ContentMenu, VehicleModalComponent],
  templateUrl: './membresias-placas.html',
  styleUrls: ['./membresias-placas.scss'],
})
export class MembresiasPlacasComponent {
  // ── Servicios ───────────────────────────────────────────────────────────────
  private readonly svc = inject(VehiclesService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Estado de la UI ─────────────────────────────────────────────────────────
  estado: PlacasEstado = 'initial';
  query = '';

  // ── Datos actuales ──────────────────────────────────────────────────────────
  grupos: MembresiaGroup[] = [];

  // ── Filas expandidas por socio ──────────────────────────────────────────────
  expandedSocios: Record<number, boolean> = {};

  // ── Modal ───────────────────────────────────────────────────────────────────
  modalVisible = false;
  modalMode: 'add' | 'edit' = 'add';
  modalData: VehicleFormData | null = null;
  /** Socio al que aplica el modal (para add/edit) */
  modalSocio: SocioInfo | null = null;

  // ── Toast ───────────────────────────────────────────────────────────────────
  toastMsg = '';
  toastColor = '#16a34a';
  toastVisible = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Búsqueda
  // ─────────────────────────────────────────────────────────────────────────────

  onQueryChange(): void {
    if (!this.query.trim()) {
      this.estado = 'initial';
      this.grupos = [];
      this.expandedSocios = {};
      this.cdr.markForCheck();
    }
  }

  buscar(): void {
    const q = this.query.trim();
    if (!q) {
      this.showToast('Escribe una placa o nombre para buscar', '#d97706');
      return;
    }

    this.estado = 'loading';
    this.grupos = [];
    this.expandedSocios = {};
    this.cdr.markForCheck();

    this.svc.search(q).subscribe({
      next: (res) => {
        if (!res.success || !res.data || res.data.length === 0) {
          this.estado = 'empty';
        } else {
          this.grupos = res.data.map((g: VehiclesByMembresiaRaw) => ({
            membershipId: g.membership_id,
            socios: g.socios.map((s) => ({
              socio: {
                id: s.socio.id,
                entityid: s.socio.entityid,
                fullname: s.socio.fullname,
                membershipId: s.socio.membership_id,
                patrimonialConditionId: s.socio.patrimonial_condition_id,
                isSpecial: s.socio.is_special,
              },
              vehicles: s.vehicles.map(this.mapVehicle),
            })),
          }));
          this.estado = 'results';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.estado = 'empty';
        this.showToast('Error al buscar vehículos', '#dc2626');
        this.cdr.markForCheck();
      },
    });
  }

  /** Mapea VehicleRaw (snake_case) a Vehicle (camelCase) */
  private mapVehicle(v: VehicleRaw): Vehicle {
    return {
      id: v.id,
      plates: v.plates,
      make: v.make,
      model: v.model,
      color: v.color,
      isActive: v.is_active,
      isInParking: v.is_in_parking,
      accessNumber: v.access_number,
      created: v.created,
      modified: v.modified,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Expandir / colapsar filas de vehículos de un socio
  // ─────────────────────────────────────────────────────────────────────────────

  toggleSocio(socioId: number): void {
    this.expandedSocios[socioId] = !this.expandedSocios[socioId];
    this.cdr.markForCheck();
  }

  isExpanded(socioId: number): boolean {
    return !!this.expandedSocios[socioId];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Abrir modal para agregar un vehículo a un socio
  // ─────────────────────────────────────────────────────────────────────────────

  openAddModal(socio: SocioInfo): void {
    this.modalMode = 'add';
    this.modalSocio = socio;
    this.modalData = {
      socioId: socio.id,
      socioName: socio.fullname,
      plates: '',
      make: '',
      model: '',
      color: '',
      accessNumber: 1,
      isInParking: false,
    };
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Abrir modal para editar un vehículo existente
  // ─────────────────────────────────────────────────────────────────────────────

  openEditModal(socio: SocioInfo, vehicle: Vehicle): void {
    this.modalMode = 'edit';
    this.modalSocio = socio;
    this.modalData = {
      id: vehicle.id,
      socioId: socio.id,
      socioName: socio.fullname,
      plates: vehicle.plates,
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      color: vehicle.color ?? '',
      accessNumber: vehicle.accessNumber,
      isInParking: vehicle.isInParking,
    };
    this.modalVisible = true;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Manejar guardado desde el modal
  // ─────────────────────────────────────────────────────────────────────────────

  onModalSave(formData: VehicleFormData): void {
    if (this.modalMode === 'add') {
      this.svc.add({
        socio_id: formData.socioId!,
        plates: formData.plates,
        make: formData.make || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        access_number: formData.accessNumber,
        is_in_parking: formData.isInParking,
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.showToast('✅ Vehículo registrado correctamente.', '#16a34a');
            this.modalVisible = false;
            this.buscar(); // Recargar resultados
          } else {
            this.showToast('⚠️ ' + res.message, '#d97706');
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al registrar vehículo.';
          this.showToast('❌ ' + msg, '#dc2626');
          this.cdr.markForCheck();
        },
      });
    } else {
      this.svc.edit({
        id: formData.id!,
        plates: formData.plates || undefined,
        make: formData.make || undefined,
        model: formData.model || undefined,
        color: formData.color || undefined,
        access_number: formData.accessNumber,
        is_in_parking: formData.isInParking,
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.showToast('✅ Vehículo actualizado correctamente.', '#16a34a');
            this.modalVisible = false;
            this.buscar(); // Recargar resultados
          } else {
            this.showToast('⚠️ ' + res.message, '#d97706');
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al actualizar vehículo.';
          this.showToast('❌ ' + msg, '#dc2626');
          this.cdr.markForCheck();
        },
      });
    }
  }

  onModalCancel(): void {
    this.modalVisible = false;
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Deshabilitar vehículo
  // ─────────────────────────────────────────────────────────────────────────────

  disableVehicle(vehicle: Vehicle): void {
    if (!confirm(`¿Deshabilitar el vehículo con placa ${vehicle.plates}?`)) return;

    this.svc.disable(vehicle.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast('✅ Vehículo deshabilitado.', '#16a34a');
          this.buscar();
        } else {
          this.showToast('⚠️ ' + res.message, '#d97706');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al deshabilitar.';
        this.showToast('❌ ' + msg, '#dc2626');
        this.cdr.markForCheck();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers de UI
  // ─────────────────────────────────────────────────────────────────────────────

  vehiculosActivos(vehicles: Vehicle[]): number {
    return vehicles.filter(v => v.isActive).length;
  }

  showToast(msg: string, color = '#16a34a'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastColor = color;
    this.toastVisible = true;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.markForCheck();
    }, 4000);
  }
}
