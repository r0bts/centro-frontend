import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu } from '../../../content-menu/content-menu';

@Component({
  selector: 'app-servicio-medico-visitas',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './servicio-medico-visitas.html',
  styleUrl: './servicio-medico-visitas.scss'
})
export class ServicioMedicoVisitas {

  nuevaVisita() {
    console.log('Crear nueva visita');
  }

}
