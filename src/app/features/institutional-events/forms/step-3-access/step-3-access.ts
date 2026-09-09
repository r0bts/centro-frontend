import { Component, ChangeDetectionStrategy, signal, computed, effect, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormGroup } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, tap } from 'rxjs';
import { EventFormStateService } from '../../services/event-form-state.service';
import { InstitutionalEventsService } from '../../services/institutional-events.service';
import { AccessType, ACCESS_TYPE_META, NsService } from '../../models/institutional-event.model';

@Component({
  selector: 'app-step-3-access',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-3-access.html',
  styleUrl: './step-3-access.scss',
})
export class Step3AccessComponent {
  /** Metadatos locales de UI (fallback si el API tarda en cargar) */
  readonly accessTypeMeta = ACCESS_TYPE_META;

  /** Lista dinámica desde el API — se usa en el template */
  get accessTypes() { return this.state.accessTypes(); }

  // ── Selector de servicio NetSuite (aparece sólo cuando has_cost = true) ──
  readonly nsServices = signal<NsService[]>([]);
  readonly nsQuery = signal<string>('');
  readonly showInactive = signal<boolean>(false);
  readonly nsLoading = signal<boolean>(false);
  readonly nsError = signal<string | null>(null);

  /** Servicio actualmente seleccionado (resuelto a partir del ns_item_id del form). */
  readonly selectedNsService = computed<NsService | null>(() => {
    const currentId = this.group.get('ns_item_id')?.value as number | null;
    if (!currentId) return null;
    return this.nsServices().find(s => s.id === currentId) ?? null;
  });

  /**
   * True cuando el evento en edición ya tenía asignado un `ns_item_id`,
   * pero ese ítem no aparece en el catálogo visible (por default filtramos
   * vendibles + activos). Cubre dos escenarios legacy:
   *   - Ítem NS marcado como inactivo posteriormente.
   *   - Ítem NS que no es vendible (`has_incomeaccount = false`), como el 4740.
   * En ambos casos el admin debe volver a elegir uno válido antes de guardar.
   */
  readonly legacyItemInvalid = computed<boolean>(() => {
    const currentId = this.group.get('ns_item_id')?.value as number | null;
    if (!currentId) return false;
    if (this.nsLoading()) return false;
    return this.selectedNsService() === null;
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(public state: EventFormStateService, private svc: InstitutionalEventsService) {
    // Recarga automática del catálogo cuando cambia la búsqueda o el toggle de inactivos.
    toObservable(this.nsQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.nsLoading.set(true);
        this.nsError.set(null);
        return this.svc.getNsServices({
          q: q.trim() || undefined,
          active: !this.showInactive(),
          sellable: true,
          limit: 200,
        }).pipe(
          catchError(err => {
            this.nsError.set(err?.error?.message ?? 'No se pudo cargar el catálogo de servicios.');
            return of<NsService[]>([]);
          }),
          tap(() => this.nsLoading.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(list => this.nsServices.set(list));

    // Al activar has_cost por primera vez, dispara una carga inicial.
    effect(() => {
      const hasCost = this.group.get('has_cost')?.value;
      if (hasCost && this.nsServices().length === 0 && !this.nsLoading()) {
        this.reloadNsServices();
      }
    });
  }

  get group() { return this.state.accessGroup; }
  get seleccionados(): AccessType[] { return this.group.get('access_types')!.value ?? []; }
  get seleccionadosLabel(): string {
    return this.seleccionados
      .map(t => this.accessTypes.find(a => a.id === t)?.label ?? this.accessTypeMeta[t]?.label ?? t)
      .join(', ');
  }

  toggleAcceso(tipo: AccessType): void {
    const actuales = this.seleccionados;
    const idx = actuales.indexOf(tipo);
    const nuevos = idx >= 0 ? actuales.filter(a => a !== tipo) : [...actuales, tipo];
    this.group.get('access_types')!.setValue(nuevos);
  }

  toggleHasCost(checked: boolean): void {
    this.group.get('has_cost')!.setValue(checked);
    if (checked) {
      // La matriz de precios es el único mecanismo de cobro: siempre encendida
      // cuando el evento tiene costo. El campo `cost` legacy queda en null.
      this.group.get('cost')!.setValue(null);
      this.group.get('has_matrix_pricing')!.setValue(true);
      this.state.syncMatrixPricesWithAccessTypes();
    } else {
      // Al apagar "con costo", limpia el ítem NS y desactiva la matriz.
      this.group.get('cost')!.setValue(null);
      this.group.get('ns_item_id')!.setValue(null);
      this.group.get('has_matrix_pricing')!.setValue(false);
    }
  }

  // ── Matriz de precios (evento base) ─────────────────────────────────────
  /** FormArray de la matriz de precios del evento base. Una fila por access_type. */
  get matrixPrices(): FormArray {
    return this.state.matrixPricesArray;
  }

  /** Cast tipado para el template — evita `$any(...)` repetido en Angular. */
  matrixRowGroup(i: number): FormGroup {
    return this.matrixPrices.at(i) as FormGroup;
  }

  /** Etiqueta legible del `access_type` de una fila de la matriz. */
  matrixRowLabel(i: number): string {
    const at = this.matrixRowGroup(i).get('access_type')!.value as AccessType;
    return this.accessTypes.find(a => a.id === at)?.label
      ?? this.accessTypeMeta[at]?.label
      ?? at;
  }

  /** True cuando ninguna fila de la matriz tiene cost > 0 (usado en template). */
  matrixTodosEnCero(): boolean {
    const filas = this.matrixPrices.controls as FormGroup[];
    if (filas.length === 0) return true;
    return !filas.some(g => Number(g.get('cost')!.value) > 0);
  }

  // ── Handlers del selector NS ────────────────────────────────────────────
  onNsQueryChange(value: string): void { this.nsQuery.set(value ?? ''); }

  toggleShowInactive(): void {
    this.showInactive.update(v => !v);
    this.reloadNsServices();
  }

  reloadNsServices(): void {
    this.nsLoading.set(true);
    this.nsError.set(null);
    this.svc.getNsServices({
      q: this.nsQuery().trim() || undefined,
      active: !this.showInactive(),
      sellable: true,
      limit: 200,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.nsServices.set(list); this.nsLoading.set(false); },
        error: err => {
          this.nsError.set(err?.error?.message ?? 'No se pudo cargar el catálogo de servicios.');
          this.nsLoading.set(false);
        },
      });
  }

  onSelectNsService(item: NsService): void {
    // Guard defensivo: nunca aceptar un ítem no vendible aunque llegara vía URL
    // o payload manipulado. El backend igual lo rechazaría al crear el SO.
    if (!item.has_incomeaccount) {
      this.nsError.set(`El ítem "${item.item_name}" no es vendible en NetSuite y no puede usarse para eventos con costo.`);
      return;
    }
    this.group.get('ns_item_id')!.setValue(item.id);
    // Asegura que el servicio elegido esté en la lista visible aunque estuviera fuera del filtro actual.
    if (!this.nsServices().some(s => s.id === item.id)) {
      this.nsServices.update(l => [item, ...l]);
    }
  }

  clearNsSelection(): void {
    this.group.get('ns_item_id')!.setValue(null);
  }

  submitted = false;

  irSiguiente(): void {
    this.submitted = true;
    if (this.seleccionados.length === 0) return;
    // Si el evento es de pago, exige servicio NS + matriz con al menos una fila > 0.
    const hasCost = !!this.group.get('has_cost')!.value;
    const nsItemId = this.group.get('ns_item_id')!.value as number | null;
    if (hasCost && !nsItemId) return;
    // Bloquea avanzar cuando el ítem asignado ya no es válido (legacy/inactivo/no vendible).
    if (hasCost && this.legacyItemInvalid()) return;
    // Matriz obligatoria: al menos una fila con cost > 0.
    if (hasCost && this.matrixTodosEnCero()) return;
    this.state.tryNext(this.group);
  }
  irAtras(): void { this.state.prev(); }
}
