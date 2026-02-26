import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu } from '../content-menu/content-menu';

@Component({
  selector: 'app-membresias-buscar',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './membresias-buscar.html',
  styleUrls: ['./membresias-buscar.scss']
})
export class MembresiasBuscarComponent {}
