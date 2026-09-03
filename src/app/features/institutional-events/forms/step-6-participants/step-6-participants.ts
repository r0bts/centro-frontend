import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventFormStateService } from '../../services/event-form-state.service';
import { ImageCropperComponent } from 'ngx-image-cropper';

/**
 * Paso 6 — Memoria Post-Evento.
 * Galería de fotos, métricas/logros alcanzados y resumen narrativo.
 * Almacenado en la columna JSON `post_event_data` de la tabla institutional_events.
 */
@Component({
  selector: 'app-step-6-participants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageCropperComponent],
  templateUrl: './step-6-participants.html',
  styleUrl: './step-6-participants.scss',
})
export class Step6ParticipantsComponent {
  nuevaFotoUrl = '';
  nuevaFotoCaption = '';
  nuevaMetricaValor = '';
  nuevaMetricaLabel = '';
  nuevaMetricaPrefijo = '';

  // Cropper variables
  readonly showCropper = signal(false);
  readonly cropUrl = signal<string | null>(null);
  private croppedBlob: Blob | null = null;
  private localPreviews = new Map<string, string>();

  constructor(public state: EventFormStateService) {}

  get group() { return this.state.postEventGroup; }
  get gallery() { return this.state.postGalleryArray.controls; }
  get metrics() { return this.state.postMetricsArray.controls; }

  // ── GALERÍA ─────────────────────────────────────────────────────────────

  onFileSelectGallery(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.cropUrl.set(URL.createObjectURL(file));
    this.showCropper.set(true);
    input.value = '';
  }

  onDropGallery(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    this.cropUrl.set(URL.createObjectURL(file));
    this.showCropper.set(true);
  }

  imageCropped(event: any): void {
    this.croppedBlob = event.blob;
  }

  applyCrop(): void {
    if (this.croppedBlob) {
      const uniqueId = `post_gallery_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const file = new File([this.croppedBlob], `${uniqueId}.jpg`, { type: this.croppedBlob.type || 'image/jpeg' });
      
      const blobUrl = URL.createObjectURL(file);
      this.state.pendingImageUploads.set(uniqueId, file);
      this.state.unsavedChanges.set(true);
      this.localPreviews.set(uniqueId, blobUrl);
      
      this.state.addGalleryItem(uniqueId, this.nuevaFotoCaption.trim());
      this.nuevaFotoCaption = '';
    }
    this.cancelCrop();
  }

  cancelCrop(): void {
    this.showCropper.set(false);
    
    const url = this.cropUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    
    this.cropUrl.set(null);
    this.croppedBlob = null;
  }

  getPreviewUrl(url: string): string {
    return this.localPreviews.get(url) || url;
  }

  getFileName(url: string): string {
    if (!url) return '';
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || url;
  }

  eliminarFoto(index: number): void {
    const itemUrl = this.gallery[index].value.url;
    if (itemUrl && itemUrl.startsWith('post_gallery_')) {
      this.state.pendingImageUploads.delete(itemUrl);
      this.state.unsavedChanges.set(true);
      const blobUrl = this.localPreviews.get(itemUrl);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      this.localPreviews.delete(itemUrl);
    }
    this.state.removeGalleryItem(index);
  }

  // ── MÉTRICAS ────────────────────────────────────────────────────────────

  agregarMetrica(): void {
    if (!this.nuevaMetricaValor.trim() || !this.nuevaMetricaLabel.trim()) return;
    this.state.addPostMetric(this.nuevaMetricaValor.trim(), this.nuevaMetricaLabel.trim(), this.nuevaMetricaPrefijo.trim());
    this.nuevaMetricaValor = '';
    this.nuevaMetricaLabel = '';
    this.nuevaMetricaPrefijo = '';
  }

  eliminarMetrica(index: number): void {
    this.state.removePostMetric(index);
  }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
