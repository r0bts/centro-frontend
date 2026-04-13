import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ContentMenu } from '../../content-menu/content-menu';

/**
 * SummerCourseShellComponent
 * Shell principal del módulo Curso de Verano (module_id=15).
 * Todas las rutas hijas se renderizan dentro del <router-outlet>.
 */
@Component({
  selector: 'app-summer-course-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, ContentMenu],
  templateUrl: './summer-course-shell.html',
  styleUrl: './summer-course-shell.scss'
})
export class SummerCourseShellComponent {}
