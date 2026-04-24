import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  @Input() title        = '¿Estás seguro?';
  @Input() message      = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() confirmClass = 'btn-danger';
  @Input() cancelLabel  = 'Cancelar';
  @Input() icon         = 'bi-exclamation-triangle-fill';
  @Input() iconClass    = 'text-warning';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
