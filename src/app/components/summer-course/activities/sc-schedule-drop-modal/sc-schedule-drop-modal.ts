import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScInstructor } from '../../../../models/summer-course/summer-course.model';
import { ScActivityType, SC_LEVELS, SC_SLOTS, SC_DAYS } from '../sc-schedule.constants';
import { DropTarget } from '../summer-course-activities';

@Component({
  selector: 'app-sc-schedule-drop-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sc-schedule-drop-modal.html',
  styleUrl: './sc-schedule-drop-modal.scss',
})
export class ScScheduleDropModalComponent {
  @Input() activity!: ScActivityType;
  @Input() target!: DropTarget;
  @Input() instructors: ScInstructor[] = [];
  @Input() levels = SC_LEVELS;
  @Input() slots  = SC_SLOTS;
  @Input() days   = SC_DAYS;

  @Output() confirmed = new EventEmitter<number | null>();
  @Output() cancelled = new EventEmitter<void>();

  selectedInstructorId = signal<number | null>(null);

  get levelLabel(): string {
    return this.levels.find(l => l.n === this.target.levelNum)?.roman ?? String(this.target.levelNum);
  }
  get levelAge(): string {
    return this.levels.find(l => l.n === this.target.levelNum)?.age ?? '';
  }
  get slotLabel(): string {
    return this.slots.find(s => s.id === this.target.slotId)?.label ?? this.target.slotId;
  }
  get slotTime(): string {
    return (this.slots as unknown as any[]).find(s => s.id === this.target.slotId)?.display ?? '';
  }
  get dayLabel(): string {
    return this.days.find(d => d.idx === this.target.dayIdx)?.label ?? '';
  }

  selectInstructor(id: number): void {
    const current = this.selectedInstructorId();
    this.selectedInstructorId.set(current === id ? null : id);
  }

  confirm(): void {
    this.confirmed.emit(this.selectedInstructorId());
  }

  cancel(): void {
    this.cancelled.emit();
  }

  avatarBg(id: number): string {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
    return colors[id % colors.length];
  }

  initials(inst: ScInstructor): string {
    return `${inst.first_name[0]}${inst.last_name[0]}`.toUpperCase();
  }
}
