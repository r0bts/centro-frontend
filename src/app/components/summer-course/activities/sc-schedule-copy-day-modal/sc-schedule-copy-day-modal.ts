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
  selector: 'app-sc-schedule-copy-day-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sc-schedule-copy-day-modal.html',
  styleUrl: './sc-schedule-copy-day-modal.scss',
})
export class ScScheduleCopyDayModalComponent implements OnInit {
  @Input() currentDayIdx!: number;
  @Input() days: ReadonlyArray<{ readonly idx: number; readonly label: string }> = [];

  @Output() confirmed = new EventEmitter<{ sourceDayIdx: number; targetDays: number[] }>();
  @Output() cancelled = new EventEmitter<void>();

  selectedSourceDay = signal<number>(0);
  selectedTargetDays = signal<Set<number>>(new Set());

  ngOnInit() {
    this.selectedSourceDay.set(this.currentDayIdx);
    this.updateTargetDaysDefaults(this.currentDayIdx);
  }

  setSourceDay(idx: number): void {
    this.selectedSourceDay.set(idx);
    this.updateTargetDaysDefaults(idx);
  }

  private updateTargetDaysDefaults(sourceIdx: number): void {
    const allOther = new Set(this.days.map(d => d.idx).filter(idx => idx !== sourceIdx));
    this.selectedTargetDays.set(allOther);
  }

  toggleDay(idx: number): void {
    if (idx === this.selectedSourceDay()) return;
    this.selectedTargetDays.update(set => {
      const newSet = new Set(set);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  }

  confirm(): void {
    this.confirmed.emit({
      sourceDayIdx: this.selectedSourceDay(),
      targetDays: Array.from(this.selectedTargetDays())
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
