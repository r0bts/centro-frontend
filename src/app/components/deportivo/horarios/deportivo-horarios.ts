import {
  Component, ChangeDetectionStrategy, OnInit,
  signal, inject, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorarioSustitucionService } from '../../../services/deportivo/horario-sustitucion.service';
import {
  ActividadConGrupos, GrupoConEquipos, EquipoConHorarios,
  HorarioEfectivo, HorarioSustitucion, DIAS_SEMANA,
} from '../../../models/deportivo/horario-sustitucion.model';
import { SustitucionFormComponent } from './sustitucion-form/sustitucion-form';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-deportivo-horarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SustitucionFormComponent, ConfirmDialogComponent],
  templateUrl: './deportivo-horarios.html',
  styleUrl: './deportivo-horarios.scss',
})
export class DeportivoHorariosComponent implements OnInit {
  private svc = inject(HorarioSustitucionService);

  // ── Estado ──────────────────────────────────────────────────────────────────
  actividades   = signal<ActividadConGrupos[]>([]);
  loading       = signal(true);
  error         = signal<string | null>(null);
  toast         = signal<{ msg: string; tipo: 'success' | 'danger' } | null>(null);

  // Confirm dialog
  confirmDialog = signal<{ title: string; message: string; confirmLabel?: string; action: () => void } | null>(null);

  // Filtros
  filtroActividad = signal<number | null>(null);
  filtroDia       = signal<number | null>(null);
  filtroSolo      = signal<'todas' | 'con_sustitucion' | 'sin_sustitucion'>('todas');

  // Modal formulario
  formOpen       = signal(false);
  formHorario    = signal<HorarioEfectivo | null>(null);
  formEquipo     = signal<EquipoConHorarios | null>(null);
  formSustitucion = signal<HorarioSustitucion | null>(null); // si es edición

  // Constantes para template
  readonly diasSemana = DIAS_SEMANA;

  // ── Computed ─────────────────────────────────────────────────────────────────
  actividadesFiltradas = computed(() => {
    let lista = this.actividades();

    if (this.filtroActividad()) {
      lista = lista.filter(a => a.id === this.filtroActividad());
    }

    // Filtro por día y por sustitución: aplica en profundidad
    if (this.filtroDia() || this.filtroSolo() !== 'todas') {
      lista = lista.map(a => ({
        ...a,
        grupos: a.grupos.map(g => ({
          ...g,
          equipos: g.equipos.map(e => ({
            ...e,
            horarios: e.horarios.filter(h => {
              const diaOk = !this.filtroDia() || h.dia_semana_efectivo === this.filtroDia();
              const sustOk = this.filtroSolo() === 'todas'
                || (this.filtroSolo() === 'con_sustitucion' && h.tiene_sustitucion)
                || (this.filtroSolo() === 'sin_sustitucion' && !h.tiene_sustitucion);
              return diaOk && sustOk;
            }),
          })).filter(e => e.horarios.length > 0),
        })).filter(g => g.equipos.length > 0),
      })).filter(a => a.grupos.length > 0);
    }

    return lista;
  });

  totalConSustitucion = computed(() => {
    let n = 0;
    this.actividades().forEach(a =>
      a.grupos.forEach(g =>
        g.equipos.forEach(e =>
          e.horarios.forEach(h => { if (h.tiene_sustitucion) n++; })
        )
      )
    );
    return n;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getGrupos().subscribe({
      next: res => {
        this.actividades.set(res.data?.actividades ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los horarios. Verifica tu conexión.');
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.svc.getGrupos().subscribe({
      next: res => this.actividades.set(res.data?.actividades ?? []),
    });
  }

  // ── Helpers de UI ────────────────────────────────────────────────────────────
  diaLabel(num: number): string {
    return this.diasSemana.find(d => d.num === num)?.label ?? `Día ${num}`;
  }

  horaFmt(time: string | null): string {
    if (!time) return '--';
    return time.substring(0, 5); // HH:MM
  }

  // ── Modal ────────────────────────────────────────────────────────────────────
  abrirFormulario(
    horario: HorarioEfectivo,
    equipo: EquipoConHorarios,
    sustitucion: HorarioSustitucion | null = null
  ): void {
    this.formHorario.set(horario);
    this.formEquipo.set(equipo);
    this.formSustitucion.set(sustitucion);
    this.formOpen.set(true);
  }

  onFormSaved(msg: string): void {
    this.formOpen.set(false);
    this.showToast(msg, 'success');
    this.refresh();
  }

  onFormCancelled(): void {
    this.formOpen.set(false);
  }

  onCancelarSustitucion(s: HorarioSustitucion): void {
    this.confirmDialog.set({
      title: 'Cancelar sustitución',
      message: `La sustitución vigente hasta ${s.fecha_fin} será eliminada.\nEl horario regresará al original de inmediato.`,
      confirmLabel: 'Sí, cancelar',
      action: () => this.svc.cancel(s.id).subscribe({
        next: res => { this.showToast(res.message, 'success'); this.refresh(); },
        error: () => this.showToast('Error al cancelar la sustitución.', 'danger'),
      }),
    });
  }

  executeConfirm(): void {
    const d = this.confirmDialog();
    this.confirmDialog.set(null);
    d?.action();
  }

  // ── Toast ────────────────────────────────────────────────────────────────────
  private showToast(msg: string, tipo: 'success' | 'danger' = 'success'): void {
    this.toast.set({ msg, tipo });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
