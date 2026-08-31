import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { QuillModule } from 'ngx-quill';
import { EventFormStateService } from '../../services/event-form-state.service';
import { EventPlace } from '../../models/institutional-event.model';
import { EventPlaceModalComponent } from '../../components/event-place-modal/event-place-modal';

@Component({
  selector: 'app-step-1-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, EventPlaceModalComponent, QuillModule],
  templateUrl: './step-1-identity.html',
  styleUrl: './step-1-identity.scss',
})
export class Step1IdentityComponent {
  readonly state = inject(EventFormStateService);

  readonly quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'header': 3 }, { 'header': 4 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link']
    ]
  };

  readonly showPlaceModal = signal(false);
  readonly seleccionandoOtro = signal(false);
  placeToEdit: EventPlace | null = null;

  readonly coverPreviewUrl = signal<string | null>(null);

  constructor() {
    const initialCover = this.state.heroGroup.get('cover_image_url')?.value;
    if (initialCover) {
      this.coverPreviewUrl.set(initialCover);
    }
  }

  get group() { return this.state.identityGroup; }

  get modoOtro(): boolean {
    return this.seleccionandoOtro() || !!this.group.get('place_id')?.value;
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const prev = this.coverPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);

    const blobUrl = URL.createObjectURL(file);
    this.coverPreviewUrl.set(blobUrl);
    this.state.heroGroup.get('cover_image_url')?.setValue(blobUrl);
    
    this.state.pendingImageUploads.set('cover', file);
    this.state.unsavedChanges.set(true);
    input.value = '';
  }

  selectSede(id: number): void {
    this.group.get('location_id')!.setValue(id);
    this.group.get('place_id')!.setValue(null);
    this.seleccionandoOtro.set(false);
    const sin = this.state.camposInvalidos().filter((c: string) => c !== 'Sede o Lugar del evento');
    this.state.camposInvalidos.set(sin);
  }

  selectOtro(): void {
    this.group.get('location_id')!.setValue(null);
    this.group.get('place_id')!.setValue(null);
    this.seleccionandoOtro.set(true);
  }

  cancelarOtroSede(): void {
    this.seleccionandoOtro.set(false);
    this.group.get('place_id')!.setValue(null);
  }

  onSedeGuardada(): void {
    const sin = this.state.camposInvalidos().filter((c: string) => c !== 'Sede o Lugar del evento');
    this.state.camposInvalidos.set(sin);
    this.seleccionandoOtro.set(false);
    this.showPlaceModal.set(false);
    this.state.loadPlaces();
  }

  abrirNuevoLugar(): void {
    this.placeToEdit = null;
    this.showPlaceModal.set(true);
  }

  abrirEditarLugar(id: number): void {
    this.placeToEdit = this.state.places().find((p: any) => p.id === id) ?? null;
    this.showPlaceModal.set(true);
  }

  onPlaceChange(place: EventPlace | null): void {
    if (place) {
      this.group.get('location_id')!.setValue(null);
      // Quitar el error visual de sede/lugar al seleccionar
      const sin = this.state.camposInvalidos().filter(c => c !== 'Sede o Lugar del evento');
      this.state.camposInvalidos.set(sin);
    }
  }

  abrirModalNuevo(): void {
    this.placeToEdit = null;
    this.showPlaceModal.set(true);
  }

  abrirModalEditar(): void {
    const id = this.group.get('place_id')?.value;
    this.placeToEdit = this.state.places().find(p => p.id === id) ?? null;
    this.showPlaceModal.set(true);
  }

  onPlaceSaved(place: EventPlace): void {
    this.state.loadPlaces().then(() => {
      this.group.get('place_id')!.setValue(place.id);
    });
    this.showPlaceModal.set(false);
  }



  submitted = false;

  irSiguiente(): void {
    this.submitted = true;
    this.state.tryNext(this.group);
  }
}
