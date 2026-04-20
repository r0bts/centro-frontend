import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScInstructor, ScArea } from '../../../../models/summer-course/summer-course.model';
import { ScActivityType, SC_LEVELS, SC_SLOTS, SC_DAYS } from '../sc-schedule.constants';
import { CellEntry, DetailTarget } from '../summer-course-activities';

@Component({
  selector: 'app-sc-schedule-detail-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sc-schedule-detail-modal.html',
  styleUrl: './sc-schedule-detail-modal.scss',
})
export class ScScheduleDetailModalComponent implements OnInit {
  @Input() entry!: CellEntry;
  @Input() target!: DetailTarget;
  @Input() instructors: ScInstructor[] = [];
  @Input() areas: ScArea[] = [];
  @Input() levels: Array<{ n: number; roman: string; age: string }> = SC_LEVELS as any;
  @Input() slots  = SC_SLOTS;
  @Input() days   = SC_DAYS;
  @Input() activityMap: Record<string, ScActivityType> = {};

  @Output() saved    = new EventEmitter<{ instructorId: number | null; areaId: number | null }>();
  @Output() removed  = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  selectedInstructorId = signal<number | null>(null);
  selectedAreaId       = signal<number | null>(null);

  get activity(): ScActivityType | undefined {
    return this.activityMap[this.entry.activityId];
  }
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
  get currentInstructor(): ScInstructor | undefined {
    return this.instructors.find(i => i.id === this.selectedInstructorId());
  }
  get currentArea(): ScArea | undefined {
    return this.areas.find(a => a.id === this.selectedAreaId());
  }

  ngOnInit(): void {
    this.selectedInstructorId.set(this.entry.instructorId);
    this.selectedAreaId.set(this.entry.areaId);
  }

  selectInstructor(id: number): void {
    const current = this.selectedInstructorId();
    this.selectedInstructorId.set(current === id ? null : id);
  }

  save(): void {
    this.saved.emit({ instructorId: this.selectedInstructorId(), areaId: this.selectedAreaId() });
  }

  remove(): void {
    this.removed.emit();
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
