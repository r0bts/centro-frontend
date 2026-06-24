import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';
import { SummerCourseScannerService } from '../../../services/summer-course/sc-scanner.service';
import Swal from 'sweetalert2';

interface ChecklistRecord {
  attendance_id: number;
  checked_in_at: string | null;
  participant: {
    id: number;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
  assigned_level: number | null;
  level_roman: string | null;
  level_age: string | null;
  group_id: number | null;
  group_alias: string | null;
  has_group: boolean;
}

@Component({
  selector: 'app-summer-course-instructor-checklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './summer-course-instructor-checklist.html',
  styleUrl: './summer-course-instructor-checklist.scss',
})
export class SummerCourseInstructorChecklistComponent implements OnInit, OnDestroy {
  private scannerSvc = inject(SummerCourseScannerService);
  private cdr       = inject(ChangeDetectorRef);
  private ngZone    = inject(NgZone);

  // ── Estado principal ───────────────────────────────────────────────────────
  loading       = signal(false);
  error         = signal<string | null>(null);
  courseName    = signal<string>('Curso de Verano');
  checkins      = signal<ChecklistRecord[]>([]);
  selectedDate  = signal<string>(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString().split('T')[0]
  );

  // ── Filtros ────────────────────────────────────────────────────────────────
  filterLevel = signal<number | null>(null);
  filterGroup = signal<string | null>(null);

  availableLevels = computed(() => {
    const seen = new Set<number>();
    const levels: { roman: string; number: number }[] = [];
    for (const c of this.checkins()) {
      if (c.assigned_level && !seen.has(c.assigned_level)) {
        seen.add(c.assigned_level);
        levels.push({ roman: c.level_roman!, number: c.assigned_level });
      }
    }
    return levels.sort((a, b) => a.number - b.number);
  });

  availableGroups = computed(() => {
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const c of this.checkins()) {
      if (c.group_alias && !seen.has(c.group_alias)) {
        seen.add(c.group_alias);
        groups.push(c.group_alias);
      }
    }
    return groups.sort();
  });

  filteredCheckins = computed(() => {
    let list = this.checkins();
    const lvl = this.filterLevel();
    const grp = this.filterGroup();
    if (lvl !== null) list = list.filter(c => c.assigned_level === lvl);
    if (grp !== null) list = list.filter(c => c.group_alias === grp);
    return list;
  });

  totalCheckins  = computed(() => this.checkins().length);
  withoutGroup   = computed(() => this.checkins().filter(c => !c.has_group).length);

  // ── Escáner de lookup ──────────────────────────────────────────────────────
  scannerMode        = signal(false);
  scannerProcessing  = signal(false);
  lookupResult       = signal<any | null>(null);
  syncingPayment     = signal(false);
  html5QrCode: Html5Qrcode | null = null;
  manualLookupToken  = '';

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void { this.refresh(); }

  ngOnDestroy(): void { this.stopScanner(); }

  onDateChange(e: any): void {
    this.selectedDate.set(e.target.value);
    this.refresh();
  }

  setLevelFilter(lvl: number | null): void { this.filterLevel.set(lvl); }
  setGroupFilter(grp: string | null): void  { this.filterGroup.set(grp); }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.scannerSvc.getInstructorChecklist(this.selectedDate()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.courseName.set(res.data.course_name || 'Curso de Verano');
          this.checkins.set(res.data.checkins || []);
        } else {
          this.error.set(res.message || 'Error al cargar la lista.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar la lista.');
        this.loading.set(false);
      },
    });
  }

  // ── Escáner de lookup ──────────────────────────────────────────────────────

  openScanner(): void {
    this.lookupResult.set(null);
    this.scannerMode.set(true);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.html5QrCode = new Html5Qrcode('qr-lookup-reader');
      const config = { fps: 10, qrbox: { width: 230, height: 230 } };

      const tryStart = (facing: string) =>
        this.html5QrCode!.start(
          { facingMode: facing },
          config,
          (decoded) => { this.ngZone.run(() => this.onLookupScan(decoded)); },
          () => {}
        );

      tryStart('environment').catch(() => tryStart('user')).catch(() => {
        this.scannerMode.set(false);
        this.cdr.detectChanges();
        Swal.fire({ icon: 'error', title: 'Sin cámara', text: 'No se pudo acceder a la cámara.' });
      });
    }, 200);
  }

  stopScanner(): void {
    if (this.html5QrCode?.isScanning) {
      this.html5QrCode.stop().then(() => {
        this.html5QrCode?.clear();
        this.html5QrCode = null;
      }).catch(() => {});
    }
    this.scannerMode.set(false);
    this.cdr.detectChanges();
  }

  onLookupScan(raw: string): void {
    if (this.scannerProcessing()) return;
    this.stopScanner();
    let token = raw;
    if (token.includes('/credencial/')) {
      token = token.split('/credencial/').pop()!;
    } else if (token.includes('=')) {
      token = token.split('=').pop()!;
    }
    this.processLookup(token);
  }

  submitManualLookup(): void {
    const t = this.manualLookupToken.trim();
    if (!t) return;
    this.manualLookupToken = '';
    this.onLookupScan(t);
  }

  processLookup(token: string): void {
    this.scannerProcessing.set(true);
    this.lookupResult.set(null);
    this.cdr.detectChanges();

    this.scannerSvc.lookupParticipant(token).subscribe({
      next: (res: any) => {
        this.scannerProcessing.set(false);
        if (res.success) {
          this.lookupResult.set(res.data);
        } else {
          Swal.fire({ icon: 'warning', title: 'No encontrado', text: res.message });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.scannerProcessing.set(false);
        Swal.fire({ icon: 'warning', title: 'Error', text: err.error?.message || 'No se pudo identificar el participante.' });
        this.cdr.detectChanges();
      },
    });
  }

  closeLookupResult(): void { this.lookupResult.set(null); }

  onSyncPayment(): void {
    const r = this.lookupResult();
    if (!r || this.syncingPayment()) return;

    if (!r.ns_sales_order_id) {
      Swal.fire({
        icon: 'info',
        title: 'Sin orden en NetSuite',
        text: 'Esta inscripción no tiene una orden de compra registrada en NetSuite.',
      });
      return;
    }

    this.syncingPayment.set(true);
    this.cdr.detectChanges();

    this.scannerSvc.syncOnePayment(r.enrollment_id).subscribe({
      next: (res: any) => {
        this.syncingPayment.set(false);
        if (res.success) {
          // Actualizar el badge en pantalla sin recargar
          this.lookupResult.update(prev => ({
            ...prev,
            payment_status: res.data.payment_status,
          }));
          const msg = res.data.changed
            ? `Estado actualizado: ${this._paymentLabel(res.data.payment_status)}`
            : 'NetSuite confirma el mismo estado. Sin cambios.';
          Swal.fire({ icon: 'success', title: 'Sincronización completada', text: msg, timer: 2500, showConfirmButton: false });
        } else {
          Swal.fire({ icon: 'warning', title: 'Sin cambios', text: res.message });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.syncingPayment.set(false);
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo sincronizar con NetSuite.' });
        this.cdr.detectChanges();
      },
    });
  }

  private _paymentLabel(status: string): string {
    const map: Record<string, string> = {
      paid:      'Pagado',
      pending:   'Sin pago',
      partial:   'Pago parcial',
      cancelled: 'Cancelado',
    };
    return map[status] ?? status;
  }
}
