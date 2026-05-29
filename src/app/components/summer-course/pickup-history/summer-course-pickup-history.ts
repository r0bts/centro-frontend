import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';

interface PickupHistoryRecord {
  id: number;
  participant_name: string;
  participant_photo_url?: string;
  authorized_name: string;
  scanned_at: string | null;
  scanned_by_name: string;
  can_leave_alone: boolean;
}

@Component({
  selector: 'app-summer-course-pickup-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './summer-course-pickup-history.html',
  styleUrl: './summer-course-pickup-history.scss',
})
export class SummerCoursePickupHistoryComponent implements OnInit {
  courseName = signal<string>('Curso de Verano');
  history = signal<PickupHistoryRecord[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedDate = signal<string>(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  searchTerm = signal<string>('');

  filteredHistory = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const date = this.selectedDate();
    let records = this.history();

    if (date) {
      records = records.filter(r => r.scanned_at && r.scanned_at.startsWith(date));
    }

    if (term) {
      records = records.filter(r => r.participant_name.toLowerCase().includes(term));
    }

    return records;
  });

  private scannerService = inject(SummerCourseScannerService);

  ngOnInit() {
    this.refresh();
  }

  onDateChange(event: any) {
    this.selectedDate.set(event.target.value);
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);

    this.scannerService.getPickupPassHistory('all').subscribe({
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
        this.error.set(err.error?.message || 'Error al cargar el historial de salidas.');
        this.loading.set(false);
      }
    });
  }

}
