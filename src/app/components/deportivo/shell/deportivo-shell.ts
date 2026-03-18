import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ContentMenu } from '../../content-menu/content-menu';

/**
 * DeportivoShellComponent
 * Shell principal del módulo deportivo.
 * Todas las rutas hijas se renderizan dentro del <router-outlet>.
 */
@Component({
  selector: 'app-deportivo-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, ContentMenu],
  templateUrl: './deportivo-shell.html',
  styleUrl: './deportivo-shell.scss'
})
export class DeportivoShellComponent {}
