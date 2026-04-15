import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScActivityType, ScActivityCategory, SC_CATEGORIES } from '../sc-schedule.constants';

@Component({
  selector: 'app-sc-schedule-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sc-schedule-palette.html',
  styleUrl: './sc-schedule-palette.scss',
})
export class ScSchedulePaletteComponent {
  @Input() activities: ScActivityType[] = [];
  @Input() categories: Array<{ id: string; label: string; emoji: string; color: string }> = SC_CATEGORIES as any;
  @Output() activityDragStart = new EventEmitter<ScActivityType>();

  openCats = signal<Set<string>>(new Set(['aquatic', 'sports', 'martial', 'cultural']));

  toggleCat(cat: string): void {
    this.openCats.update(s => {
      const ns = new Set(s);
      ns.has(cat) ? ns.delete(cat) : ns.add(cat);
      return ns;
    });
  }

  activitiesForCat(cat: string): ScActivityType[] {
    return this.activities.filter(a => (a.cat as string) === cat);
  }

  onDragStart(event: DragEvent, act: ScActivityType): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('activityId', act.id);
      event.dataTransfer.effectAllowed = 'copy';
    }
    this.activityDragStart.emit(act);
  }
}
