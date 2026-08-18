import {
  Component, EventEmitter, Input, OnDestroy, Output,
  ChangeDetectionStrategy, signal, AfterViewInit, ViewChild, ElementRef, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventPlace } from '../../models/institutional-event.model';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import { firstValueFrom } from 'rxjs';

/**
 * Modal para crear o editar un EventPlace (lugar personalizado del evento).
 * Leaflet se importa dinámicamente en ngAfterViewInit — evita "window is not defined" en SSR.
 */
@Component({
  selector: 'app-event-place-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-place-modal.html',
  styleUrl: './event-place-modal.scss',
})
export class EventPlaceModalComponent implements AfterViewInit, OnDestroy {
  @Input() place: EventPlace | null = null;   // si se pasa, modo edición
  @Output() saved  = new EventEmitter<EventPlace>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('mapContainer') mapRef!: ElementRef<HTMLDivElement>;

  // Formulario
  form = {
    name: '',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    notes: '',
  };

  saving    = signal(false);
  error     = signal<string | null>(null);
  geocoding = signal(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private L: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private marker: any = null;

  private static readonly DEFAULT_LAT  =  19.4326;
  private static readonly DEFAULT_LNG  = -99.1332;
  private static readonly DEFAULT_ZOOM = 13;

  constructor(private svc: InstitutionalEventsService, private zone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    // Importación dinámica: Leaflet solo se carga en el browser (no en SSR)
    this.L = await import('leaflet');

    // Rellenar formulario si viene en modo edición
    if (this.place) {
      this.form.name    = this.place.name;
      this.form.address = this.place.address ?? '';
      this.form.lat     = this.place.lat ?? null;
      this.form.lng     = this.place.lng ?? null;
      this.form.notes   = this.place.notes ?? '';
    }

    const lat = this.form.lat ?? EventPlaceModalComponent.DEFAULT_LAT;
    const lng = this.form.lng ?? EventPlaceModalComponent.DEFAULT_LNG;

    setTimeout(() => this.initMap(lat, lng), 50);
  }

  private initMap(lat: number, lng: number): void {
    const L = this.L;
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.map = L.map(this.mapRef.nativeElement, {
      center: [lat, lng],
      zoom: EventPlaceModalComponent.DEFAULT_ZOOM,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { icon: iconDefault, draggable: true }).addTo(this.map);

    // Arrastrar el pin → actualiza lat/lng
    this.marker.on('dragend', (e: any) => {
      this.zone.run(() => {
        const pos = e.target.getLatLng();
        this.form.lat = +pos.lat.toFixed(7);
        this.form.lng = +pos.lng.toFixed(7);
      });
    });

    // Click en el mapa → mueve el pin
    this.map.on('click', (e: any) => {
      this.zone.run(() => {
        this.marker.setLatLng(e.latlng);
        this.form.lat = +e.latlng.lat.toFixed(7);
        this.form.lng = +e.latlng.lng.toFixed(7);
      });
    });
  }

  /** Geocodifica la dirección con Nominatim y mueve el mapa. */
  async buscarDireccion(): Promise<void> {
    if (!this.form.address.trim()) return;
    this.geocoding.set(true);
    this.error.set(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.form.address)}&format=json&limit=1&countrycodes=mx`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await resp.json();
      if (data?.length) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        this.form.lat = +lat.toFixed(7);
        this.form.lng = +lng.toFixed(7);
        this.map.setView([lat, lng], 16);
        this.marker.setLatLng([lat, lng]);
      } else {
        this.error.set('No se encontró esa dirección. Ajusta el pin manualmente en el mapa.');
      }
    } catch {
      this.error.set('Error al buscar la dirección. Verifica tu conexión.');
    } finally {
      this.geocoding.set(false);
    }
  }

  /** Actualiza el mapa cuando el usuario escribe lat/lng a mano. */
  onCoordsChange(): void {
    if (this.form.lat && this.form.lng) {
      this.map?.setView([this.form.lat, this.form.lng], 16);
      this.marker?.setLatLng([this.form.lat, this.form.lng]);
    }
  }

  async guardar(): Promise<void> {
    this.error.set(null);
    if (!this.form.name.trim()) {
      this.error.set('El nombre del lugar es obligatorio.');
      return;
    }
    this.saving.set(true);
    try {
      const payload = {
        name:    this.form.name.trim(),
        address: this.form.address.trim() || null,
        lat:     this.form.lat,
        lng:     this.form.lng,
        notes:   this.form.notes.trim() || null,
      };
      const result = this.place?.id
        ? await firstValueFrom(this.svc.updatePlace(this.place.id, payload))
        : await firstValueFrom(this.svc.createPlace(payload as Omit<EventPlace, 'id'>));
      this.saved.emit(result);
    } catch {
      this.error.set('Error al guardar. Inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  cancelar(): void { this.closed.emit(); }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
