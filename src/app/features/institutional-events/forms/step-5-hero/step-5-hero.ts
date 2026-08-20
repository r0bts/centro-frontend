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

  /** Error de validación de dimensiones del banner mobile. */
  readonly mobileDimError = signal<string | null>(null);

  /** Reglas de dimensiones para el banner mobile (px). */
  private readonly MOBILE_W_MIN = 390;
  private readonly MOBILE_W_MAX = 412;
  private readonly MOBILE_H_MIN = 844;
  private readonly MOBILE_H_MAX = 917;

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

  /** Valida dimensiones del banner mobile. Devuelve error string o null si es válido. */
  private checkMobileDimensions(blobUrl: string, file: File): void {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w < this.MOBILE_W_MIN || w > this.MOBILE_W_MAX ||
          h < this.MOBILE_H_MIN || h > this.MOBILE_H_MAX) {
        // Dimensiones fuera de rango — revocar y rechazar
        URL.revokeObjectURL(blobUrl);
        this.mobilePreviewUrl.set(null);
        this.state.pendingImageUploads.delete('hero_mobile');
        this.mobileDimError.set(
          `Dimensiones incorrectas: ${w}×${h} px. ` +
          `Se requiere entre ${this.MOBILE_W_MIN}–${this.MOBILE_W_MAX} px de ancho ` +
          `y ${this.MOBILE_H_MIN}–${this.MOBILE_H_MAX} px de alto.`
        );
      } else {
        this.mobileDimError.set(null);
      }
    };
    img.src = blobUrl;
  }

  private acceptFile(file: File, field: ImageField): void {
    const prev = field === 'banner' ? this.bannerPreviewUrl()
               : field === 'mobile' ? this.mobilePreviewUrl()
               : this.coverPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);

    const blobUrl = URL.createObjectURL(file);
    if (field === 'banner') this.bannerPreviewUrl.set(blobUrl);
    else if (field === 'mobile') this.mobilePreviewUrl.set(blobUrl);
    else this.coverPreviewUrl.set(blobUrl);

    const apiType = field === 'banner' ? 'hero_desktop'
                  : field === 'mobile' ? 'hero_mobile' : 'cover';
    this.state.pendingImageUploads.set(apiType, file);

    if (field === 'mobile') {
      this.mobileDimError.set(null); // limpiar error previo antes de validar
      this.checkMobileDimensions(blobUrl, file);
    }
  }

  onFileSelect(event: Event, field: ImageField): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.acceptFile(file, field);
    input.value = '';
  }

  onDrop(event: DragEvent, field: ImageField): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.acceptFile(file, field);
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
