import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContentMenu } from '../../../content-menu/content-menu';

@Component({
  selector: 'app-servicio-medico-dashboard',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './servicio-medico-dashboard.html',
  styleUrl: './servicio-medico-dashboard.scss'
})
export class ServicioMedicoDashboard {
  
  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([`/servicio-medico/${path}`]);
  }
}
