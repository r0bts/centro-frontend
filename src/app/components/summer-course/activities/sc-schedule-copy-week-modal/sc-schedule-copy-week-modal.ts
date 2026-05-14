import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sc-schedule-copy-week-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sc-schedule-copy-week-modal.html',
  styleUrl: './sc-schedule-copy-week-modal.scss',
})
export class ScScheduleCopyWeekModalComponent implements OnInit {
  @Input() currentWeekId!: number;
  @Input() weeks: ReadonlyArray<{ readonly id: number; readonly label: string }> = [];

  @Output() confirmed = new EventEmitter<{ sourceWeekId: number; targetWeekIds: number[] }>();
  @Output() cancelled = new EventEmitter<void>();

  selectedSourceWeek = signal<number>(0);
  selectedTargetWeeks = signal<Set<number>>(new Set());

  ngOnInit() {
    const id = Number(this.currentWeekId);
    this.selectedSourceWeek.set(id);
    this.updateTargetWeeksDefaults(id);
  }

  setSourceWeek(id: number): void {
    this.selectedSourceWeek.set(id);
    this.updateTargetWeeksDefaults(id);
  }

  private updateTargetWeeksDefaults(sourceId: number): void {
    const allOther = new Set(this.weeks.map(w => Number(w.id)).filter(id => id !== sourceId));
    this.selectedTargetWeeks.set(allOther);
  }

  toggleWeek(id: number): void {
    if (id === this.selectedSourceWeek()) return;
    this.selectedTargetWeeks.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  confirm(): void {
    this.confirmed.emit({
      sourceWeekId: this.selectedSourceWeek(),
      targetWeekIds: Array.from(this.selectedTargetWeeks())
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
