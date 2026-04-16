import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AreaClubService,
  AreaConClubes,
  LayoutPorClub,
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
  openEditor = output<{ area: AreaConClubes; clubId: number; clubes: Club[] }>();

  areas   = signal<AreaConClubes[]>([]);
  clubes  = signal<Club[]>([]);
  loading = signal(true);
  error   = signal('');
  search  = signal('');
  saving  = signal<number | null>(null);

  constructor(private areaClubSvc: AreaClubService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAreas(); }

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
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('Error al cargar las áreas.');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  get filteredAreas(): AreaConClubes[] {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.areas();
    return this.areas().filter(a => a.name.toLowerCase().includes(q));
  }

  hasClub(area: AreaConClubes, clubId: number): boolean {
    return area.clubes.some(c => c.acceso_club_id === clubId);
  }

  isSaving(areaId: number): boolean {
    return this.saving() === areaId;
  }

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
              clubes.push({ area_club_id: res.data!.id!, acceso_club_id: clubId, club_name: clubName });
            } else {
              clubes = clubes.filter(c => c.acceso_club_id !== clubId);
            }
            return { ...a, clubes };
          });
          this.areas.set(updatedAreas);
          this.cdr.markForCheck();
        }
        this.saving.set(null);
        this.cdr.markForCheck();
      },
      error: () => {
        Swal.fire('Error', 'No se pudo actualizar la asignación', 'error');
        this.saving.set(null);
        this.cdr.markForCheck();
      }
    });
  }

  getLayoutForClub(area: AreaConClubes, clubId: number): LayoutPorClub | null {
    return area.layouts_por_club?.find(l => l.acceso_club_id === clubId) ?? null;
  }

  onOpenEditor(area: AreaConClubes, clubId: number): void {
    this.openEditor.emit({ area, clubId, clubes: this.clubes() });
  }

  trackByArea(_: number, area: AreaConClubes): number {
    return area.id;
  }
}
