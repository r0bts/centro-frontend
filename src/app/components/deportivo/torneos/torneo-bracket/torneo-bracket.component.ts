import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Inscripcion } from '../../../../models/deportivo/torneo.model';
import { TorneoService } from '../../../../services/deportivo/torneo.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-torneo-bracket',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './torneo-bracket.html',
  styleUrl: './torneo-bracket.scss'
})
export class TorneoBracketComponent implements OnInit {
  @Input({ required: true }) torneoId!: number;
  @Input({ required: true }) faseId!: number;
  @Input({ required: true }) inscripciones!: Inscripcion[];
  @Input() initialBracketData: any = null;

  private svc = inject(TorneoService);

  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  // Lista de participantes sin asignar al bracket
  bolsaParticipantes: Inscripcion[] = [];
  
  // Slots del Bracket (ejemplo simplificado de cuartos de final = 8 slots)
  bracketSlots: Inscripcion[][] = [[], [], [], [], [], [], [], []];

  ngOnInit(): void {
    if (this.initialBracketData && this.initialBracketData.slots) {
      // Reconstruir desde guardado (simplified)
      this.bracketSlots = this.initialBracketData.slots.map((s: any) => s);
      const usedIds = new Set(this.bracketSlots.flat().map(i => i.id));
      this.bolsaParticipantes = this.inscripciones.filter(i => !usedIds.has(i.id));
    } else {
      // Todos van a la bolsa inicialmente
      this.bolsaParticipantes = [...this.inscripciones];
    }
  }

  drop(event: CdkDragDrop<Inscripcion[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Si el contenedor destino (slot) ya tiene un equipo, regresarlo a la bolsa
      if (event.container.id !== 'bolsaList' && event.container.data.length > 0) {
        transferArrayItem(
          event.container.data,
          this.bolsaParticipantes,
          0,
          this.bolsaParticipantes.length
        );
      }
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  async saveBracket() {
    this.isSaving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const payload = {
      configuracion_llaves: {
        slots: this.bracketSlots
      }
    };

    try {
      await firstValueFrom(this.svc.saveBracket(this.torneoId, this.faseId, payload));
      this.successMsg.set('Bracket guardado exitosamente.');
      setTimeout(() => this.successMsg.set(null), 3000);
    } catch (e: any) {
      this.errorMsg.set(e?.error?.message ?? 'Error al guardar el bracket');
    } finally {
      this.isSaving.set(false);
    }
  }

  getEquipoNombre(insc: Inscripcion): string {
    if (insc.torneo_equipo) return insc.torneo_equipo.nombre;
    if (insc.equipo) return insc.equipo.nombre;
    if (insc.alumno) return `${insc.alumno.nombre} ${insc.alumno.apellido}`;
    return `#${insc.id}`;
  }
}
