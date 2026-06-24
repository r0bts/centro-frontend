import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu } from '../../../content-menu/content-menu';

@Component({
  selector: 'app-servicio-medico-preregistros',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './servicio-medico-preregistros.html',
  styleUrl: './servicio-medico-preregistros.scss'
})
export class ServicioMedicoPreregistros {

}
