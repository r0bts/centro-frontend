import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventFormStateService } from '../../services/event-form-state.service';
import { EVENT_TYPE_META } from '../../models/institutional-event.model';

type ImageField = 'banner' | 'mobile' | 'cover';

@Component({
  selector: 'app-step-5-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './step-5-hero.html',
  styleUrl: './step-5-hero.scss',
})
export class Step5HeroComponent {
  readonly state = inject(EventFormStateService);

  /** Cuando es true, muestra únicamente la sección de Banner Mobile (paso 1 Básico). */
  readonly mobileOnly = input(false);

  nuevoAliado = '';
  mostrarAgregarAliado = false;

  /** URLs blob locales para preview inmediato (no persisten, solo para UI). */
  readonly bannerPreviewUrl = signal<string | null>(null);
  readonly mobilePreviewUrl = signal<string | null>(null);
  readonly coverPreviewUrl  = signal<string | null>(null);

  private readonly identityVal = toSignal(
    this.state.identityGroup.valueChanges,
    { initialValue: this.state.identityGroup.value }
  );
  private readonly datetimeVal = toSignal(
    this.state.datetimeGroup.valueChanges,
    { initialValue: this.state.datetimeGroup.value }
  );
  private readonly accessVal = toSignal(
    this.state.accessGroup.valueChanges,
    { initialValue: this.state.accessGroup.value }
  );
  private readonly heroVal = toSignal(
    this.state.heroGroup.valueChanges,
    { initialValue: this.state.heroGroup.value }
  );

  readonly nombreEvento = computed(() => this.identityVal()?.name ?? '');
  readonly kickerEvento = computed(() => this.identityVal()?.kicker ?? '');
  readonly sedeLabel = computed(() => {
    const locId = this.identityVal()?.location_id;
    return this.state.locations().find(l => l.id === locId)?.name ?? 'Sede';
  });
  readonly tipoLabel = computed(() => {
    const tipo = this.identityVal()?.event_type;
    return tipo ? (EVENT_TYPE_META[tipo as keyof typeof EVENT_TYPE_META]?.label ?? tipo) : 'Tipo';
  });
  readonly fechaInicio = computed(() => {
    const raw = this.datetimeVal()?.start_date;
    if (!raw) return '—';
    try { return new Date(raw).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  });
  readonly lugarEvento = computed(() => this.datetimeVal()?.venue ?? '');
  readonly tieneCosto = computed(() => !!(this.accessVal()?.has_cost));
  readonly allies = computed(() => (this.heroVal()?.allies as string[]) ?? []);

  /** URL de preview del hero — prioriza el archivo local subido, luego la URL del form. */
  readonly heroBgUrl = computed(() => {
    return this.bannerPreviewUrl() || (this.heroVal()?.banner_image_url as string || null);
  });

  get group() { return this.state.heroGroup; }

  onFileSelect(event: Event, field: ImageField): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    // Revocar URL anterior si existe
    const prev = field === 'banner' ? this.bannerPreviewUrl()
               : field === 'mobile' ? this.mobilePreviewUrl()
               : this.coverPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);

    const blobUrl = URL.createObjectURL(file);
    if (field === 'banner') this.bannerPreviewUrl.set(blobUrl);
    else if (field === 'mobile') this.mobilePreviewUrl.set(blobUrl);
    else this.coverPreviewUrl.set(blobUrl);

    // Registrar en el servicio para upload automático al guardar en Step 9
    // Mapear el nombre local al tipo que acepta el backend
    const apiType = field === 'banner' ? 'hero_desktop' : field === 'mobile' ? 'hero_mobile' : 'cover';
    this.state.pendingImageUploads.set(apiType, file);

    // Reset input
    input.value = '';
  }

  onDrop(event: DragEvent, field: ImageField): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    // Revocar URL anterior si existe
    const prev = field === 'banner' ? this.bannerPreviewUrl()
               : field === 'mobile' ? this.mobilePreviewUrl()
               : this.coverPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
    const blobUrl = URL.createObjectURL(file);
    if (field === 'banner') this.bannerPreviewUrl.set(blobUrl);
    else if (field === 'mobile') this.mobilePreviewUrl.set(blobUrl);
    else this.coverPreviewUrl.set(blobUrl);
    // Registrar en pendingImageUploads para upload automático al guardar
    const apiType = field === 'banner' ? 'hero_desktop' : field === 'mobile' ? 'hero_mobile' : 'cover';
    this.state.pendingImageUploads.set(apiType, file);
  }

  agregarAliado(): void {
    if (!this.nuevoAliado.trim()) return;
    this.state.addAlly(this.nuevoAliado.trim());
    this.nuevoAliado = '';
    this.mostrarAgregarAliado = false;
  }

  eliminarAliado(index: number): void {
    this.state.removeAlly(index);
  }

  irSiguiente(): void { this.state.next(); }
  irAtras(): void { this.state.prev(); }
}
