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
  @Input() categories = SC_CATEGORIES;
  @Output() activityDragStart = new EventEmitter<ScActivityType>();

  openCats = signal<Set<ScActivityCategory>>(new Set(['aquatic', 'sports', 'martial', 'cultural']));

  toggleCat(cat: ScActivityCategory): void {
    this.openCats.update(s => {
      const ns = new Set(s);
      ns.has(cat) ? ns.delete(cat) : ns.add(cat);
      return ns;
    });
  }

  activitiesForCat(cat: ScActivityCategory): ScActivityType[] {
    return this.activities.filter(a => a.cat === cat);
  }

  onDragStart(event: DragEvent, act: ScActivityType): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('activityId', act.id);
      event.dataTransfer.effectAllowed = 'copy';
    }
    this.activityDragStart.emit(act);
  }
}
