import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScheduleState, CellEntry, DropTarget, DetailTarget } from '../summer-course-activities';
import { ScInstructor } from '../../../../models/summer-course/summer-course.model';
import { SC_LEVELS, SC_SLOTS, ScActivityType } from '../sc-schedule.constants';

@Component({
  selector: 'app-sc-schedule-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sc-schedule-grid.html',
  styleUrl: './sc-schedule-grid.scss',
})
export class ScScheduleGridComponent {
  @Input() scheduleState: ScheduleState = [];
  @Input() currentDayIdx = 0;
  @Input() slots = SC_SLOTS;
  @Input() levels: Array<{ n: number; roman: string; age: string }> = SC_LEVELS as any;
  @Input() instructors: ScInstructor[] = [];
  @Input() activityMap: Record<string, ScActivityType> = {};

  @Output() drop      = new EventEmitter<DropTarget>();
  @Output() chipClick = new EventEmitter<{ entry: CellEntry; target: DetailTarget }>();

  dragOverTarget = signal<string | null>(null);

  onDragOver(event: DragEvent, slotId: string, levelNum: number): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.dragOverTarget.set(`${slotId}_${levelNum}`);
  }

  onDragLeave(): void {
    this.dragOverTarget.set(null);
  }

  onDrop(event: DragEvent, slotId: string, levelNum: number): void {
    event.preventDefault();
    this.dragOverTarget.set(null);
    this.drop.emit({ dayIdx: this.currentDayIdx, slotId, levelNum });
  }

  onChipClick(entry: CellEntry, slotId: string, levelNum: number, entryIdx: number): void {
    this.chipClick.emit({
      entry,
      target: { dayIdx: this.currentDayIdx, slotId, levelNum, entryIdx },
    });
  }

  getEntries(slotId: string, levelNum: number): CellEntry[] {
    return this.scheduleState[this.currentDayIdx]?.[slotId]?.[levelNum] ?? [];
  }

  isDragOver(slotId: string, levelNum: number): boolean {
    return this.dragOverTarget() === `${slotId}_${levelNum}`;
  }

  getActivity(activityId: string): ScActivityType | undefined {
    return this.activityMap[activityId];
  }

  getInstructor(id: number | null): ScInstructor | undefined {
    if (!id) return undefined;
    return this.instructors.find(i => i.id === id);
  }

  instructorInitials(inst: ScInstructor): string {
    return `${inst.first_name[0]}${inst.last_name[0]}`.toUpperCase();
  }

  instructorBgColor(id: number): string {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
    return colors[id % colors.length];
  }
}
