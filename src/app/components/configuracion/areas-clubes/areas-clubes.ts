import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreasClubesListComponent } from './areas-clubes-list/areas-clubes-list';
import { AreaLayoutEditorComponent } from './area-layout-editor/area-layout-editor';
import { AreaConClubes, Club } from '../../../services/area-club.service';

@Component({
  selector: 'app-areas-clubes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AreasClubesListComponent, AreaLayoutEditorComponent],
  templateUrl: './areas-clubes.html',
  styleUrls: ['./areas-clubes.scss']
})
export class AreasClubesComponent {
  /** null = mostrar lista | AreaConClubes = mostrar editor */
  editingArea   = signal<AreaConClubes | null>(null);
  editingClubes = signal<Club[]>([]);
  editingClubId = signal<number>(0);

  openEditor(ev: { area: AreaConClubes; clubId: number; clubes: Club[] }): void {
    this.editingClubes.set(ev.clubes);
    this.editingClubId.set(ev.clubId);
    this.editingArea.set(ev.area);
  }

  closeEditor(): void {
    this.editingArea.set(null);
  }

  onLayoutSaved(updatedArea: AreaConClubes): void {
    this.editingArea.set(null);
  }
}
