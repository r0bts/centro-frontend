import { Component, OnInit, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AreaClubService,
  AreaConClubes,
  Club
} from '../../../../services/area-club.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-areas-clubes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './areas-clubes-list.html',
  styleUrls: ['./areas-clubes-list.scss']
})
export class AreasClubesListComponent implements OnInit {
  /** Emite cuando el usuario quiere abrir el editor de plano de un área */
  openEditor = output<AreaConClubes>();

  areas     = signal<AreaConClubes[]>([]);
  clubes    = signal<Club[]>([]);
  loading   = signal(true);
  error     = signal('');
  search    = signal('');
  saving    = signal<number | null>(null); // area_id que se está procesando

  constructor(private areaClubSvc: AreaClubService) {}

  ngOnInit(): void {
    this.loadAreas();
  }

  loadAreas(): void {
    this.loading.set(true);
    this.error.set('');
    this.areaClubSvc.getAreas().subscribe({
      next: res => {
        if (res.success) {
          this.areas.set(res.data.areas);
          this.clubes.set(res.data.clubes);
        } else {
          this.error.set(res.message);
        }
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Error al cargar las áreas. Verifica la conexión.');
        this.loading.set(false);
      }
    });
  }

  get filteredAreas(): AreaConClubes[] {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.areas();
    return this.areas().filter(a => a.name.toLowerCase().includes(q));
  }

  /** Verifica si un área tiene asignado un club específico */
  hasClub(area: AreaConClubes, clubId: number): boolean {
    return area.clubes.some(c => c.acceso_club_id === clubId);
  }

  /** Toggle asignación área ↔ club */
  toggleClub(area: AreaConClubes, clubId: number): void {
    if (this.saving() !== null) return;
    this.saving.set(area.id);

    this.areaClubSvc.assignClub(area.id, clubId).subscribe({
      next: res => {
        if (res.success && res.data) {
          const updatedAreas = this.areas().map(a => {
            if (a.id !== area.id) return a;
            let clubes = [...a.clubes];
            if (res.data!.action === 'assigned') {
              const clubName = this.clubes().find(c => c.id === clubId)?.name ?? '';
              clubes.push({
                area_club_id: res.data!.id!,
                acceso_club_id: clubId,
                club_name: clubName
              });
            } else {
              clubes = clubes.filter(c => c.acceso_club_id !== clubId);
            }
            return { ...a, clubes };
          });
          this.areas.set(updatedAreas);
        }
        this.saving.set(null);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo actualizar la asignación', 'error');
        this.saving.set(null);
      }
    });
  }

  /** Abre el editor de plano para el área */
  onOpenEditor(area: AreaConClubes): void {
    this.openEditor.emit(area);
  }

  /** Iconos de check / empty según asignación */
  clubIcon(area: AreaConClubes, clubId: number): string {
    return this.hasClub(area, clubId) ? 'bi-check-circle-fill' : 'bi-circle';
  }

  clubColor(area: AreaConClubes, clubId: number): string {
    return this.hasClub(area, clubId) ? 'text-success' : 'text-secondary';
  }

  isSaving(areaId: number): boolean {
    return this.saving() === areaId;
  }

  trackByArea(_: number, area: AreaConClubes): number {
    return area.id;
  }
}
