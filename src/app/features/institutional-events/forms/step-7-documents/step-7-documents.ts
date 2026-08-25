import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { EventFormStateService } from '../../services/event-form-state.service';

/**
 * Paso 7 — Documentos descargables del evento.
 * Guarda nombre + URL (enlace externo). Auto-guarda al agregar o quitar documentos.
 */
@Component({
  selector: 'app-step-7-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './step-7-documents.html',
  styleUrl: './step-7-documents.scss',
})
export class Step7DocumentsComponent implements OnInit, OnDestroy {
  nombreNuevo = '';
  urlNueva = '';
  private _sub?: Subscription;

  constructor(public state: EventFormStateService) {}

  get documentos() { return this.state.documentsArray.controls; }

  ngOnInit(): void {
    this._sub = this.state.documentsArray.valueChanges
      .pipe(debounceTime(600))
      .subscribe(() => this.state.saveDraft());
  }

  ngOnDestroy(): void { this._sub?.unsubscribe(); }

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
