import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventFormStateService } from '../../services/event-form-state.service';

/**
 * Paso 7 — Documentos descargables del evento.
 * Replica el bloque "Documentos descargables" de `tplStep7()`, mapeado a la
 * columna real `documents` (JSON de {name, url}). Sin endpoint de subida de
 * archivos en el backend, se captura como URL directa (mismo criterio que
 * el paso 5). La sección "Post-Evento" del mockup (galería, logros, resumen)
 * no tiene columnas en el schema y se omite.
 */
@Component({
  selector: 'app-step-7-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './step-7-documents.html',
  styleUrl: './step-7-documents.scss',
})
export class Step7DocumentsComponent {
  nombreNuevo = '';
  urlNueva = '';

  constructor(public state: EventFormStateService) {}

  get documentos() { return this.state.documentsArray.controls; }

  agregar(): void {
    if (!this.nombreNuevo.trim() || !this.urlNueva.trim()) return;
    this.state.addDocument(this.nombreNuevo.trim(), this.urlNueva.trim());
    this.nombreNuevo = '';
    this.urlNueva = '';
  }

  eliminar(index: number): void {
    this.state.removeDocument(index);
  }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
