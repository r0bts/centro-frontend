import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';

interface PickupHistoryRecord {
  id: number;
  participant_name: string;
  authorized_name: string;
  scanned_at: string | null;
  scanned_by_name: string;
  can_leave_alone: boolean;
}

@Component({
  selector: 'app-summer-course-pickup-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './summer-course-pickup-history.html',
  styleUrl: './summer-course-pickup-history.scss',
})
export class SummerCoursePickupHistoryComponent implements OnInit {
  private scannerSvc = inject(SummerCourseScannerService);

  history = signal<PickupHistoryRecord[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);
    this.scannerSvc.getPickupPassHistory().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.history.set(res.data);
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

  refresh(): void {
    this.loadHistory();
  }
}
