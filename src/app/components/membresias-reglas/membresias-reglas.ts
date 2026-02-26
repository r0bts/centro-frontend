import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenu } from '../content-menu/content-menu';

@Component({
  selector: 'app-membresias-reglas',
  standalone: true,
  imports: [CommonModule, ContentMenu],
  templateUrl: './membresias-reglas.html',
  styleUrls: ['./membresias-reglas.scss']
})
export class MembresiasReglasComponent {}
