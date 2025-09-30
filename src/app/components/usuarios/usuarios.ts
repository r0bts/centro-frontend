import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu } from '../content-menu/content-menu';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss']
})
export class UsuariosComponent {
  activeSection: string = 'usuarios';

  onSectionChange(section: string): void {
    this.activeSection = section;
  }
}