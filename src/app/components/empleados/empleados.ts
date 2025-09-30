import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu } from '../content-menu/content-menu';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.scss']
})
export class EmpleadosComponent {
  activeSection: string = 'empleados';

  onSectionChange(section: string): void {
    this.activeSection = section;
  }
}