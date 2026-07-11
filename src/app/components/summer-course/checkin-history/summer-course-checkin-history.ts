import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';

interface StaffEvent {
  at: string;
  by_name: string | null;
  scanned_via: 'staff' | 'portal_instructor';
}

interface InstructorEvent {
  at: string;
  by_name: string | null;
  out_of_group: boolean;
  group_alias?: string | null;
  final_group_alias?: string | null;
}

interface CheckinHistoryRecord {
  participant_id: number;
  participant_name: string;
  participant_photo_url?: string;
  level_roman?: string | null;
  group_alias?: string | null;
  staff_event?: StaffEvent | null;
  instructor_event?: InstructorEvent | null;
}

@Component({
  selector: 'app-summer-course-checkin-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './summer-course-checkin-history.html',
  styleUrl: './summer-course-checkin-history.scss',
})
export class SummerCourseCheckinHistoryComponent implements OnInit {
  private scannerService = inject(SummerCourseScannerService);

  courseName = signal<string>('Curso de Verano');
  history = signal<CheckinHistoryRecord[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedDate = signal<string>(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  searchTerm = signal<string>('');
  filterGroup = signal<string>('');

  availableGroups = computed(() => {
    const groups = new Set<string>();
    this.history().forEach(r => { if (r.group_alias) groups.add(r.group_alias); });
    return Array.from(groups).sort();
  });

  filteredHistory = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const date = this.selectedDate();
    const group = this.filterGroup();
    let records = this.history();

    if (date) {
      records = records.filter(r => {
        const at = r.staff_event?.at ?? r.instructor_event?.at ?? null;
        if (!at) return false;
        return new Date(at).toLocaleDateString('en-CA') === date;
      });
    }
    if (term) {
      records = records.filter(r => r.participant_name.toLowerCase().includes(term));
    }
    if (group) {
      records = records.filter(r => r.group_alias === group);
    }

    return records;
  });

  ngOnInit() {
    this.refresh();
  }

  onDateChange(event: any) {
    this.selectedDate.set(event.target.value);
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);

    this.scannerService.getCheckinHistory('all').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.courseName.set(res.data.course_name || 'Curso de Verano');
          this.history.set(res.data.history || []);
        } else {
          this.error.set(res.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar el historial de entradas.');
        this.loading.set(false);
      }
    });
  }

}
