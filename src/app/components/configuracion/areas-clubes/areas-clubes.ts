import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreasClubesListComponent } from './areas-clubes-list/areas-clubes-list';
import { AreaLayoutEditorComponent } from './area-layout-editor/area-layout-editor';
import { AreaConClubes } from '../../../services/area-club.service';

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
  editingArea = signal<AreaConClubes | null>(null);

  openEditor(area: AreaConClubes): void {
    this.editingArea.set(area);
  }

  closeEditor(): void {
    this.editingArea.set(null);
  }

  onLayoutSaved(updatedArea: AreaConClubes): void {
    // El área se actualizó, volvemos a la lista
    this.editingArea.set(null);
  }
}
