import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';

interface CheckinHistoryRecord {
  id: number;
  participant_name: string;
  participant_photo_url?: string;
  checked_in_at: string | null;
  checked_in_by_name: string;
  scanned_via?: 'staff' | 'portal_instructor';
  level_roman?: string | null;
  group_alias?: string | null;
}

@Component({
  selector: 'app-summer-course-checkin-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
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
      records = records.filter(r => r.checked_in_at && r.checked_in_at.startsWith(date));
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
