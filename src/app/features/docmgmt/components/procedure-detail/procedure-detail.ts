import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DocmgmtService } from '../../docmgmt.service';
import { DocmgmtProcedure } from '../../models/docmgmt.model';
import { AuthService } from '../../../../services/auth.service';

import { ContentMenu } from '../../../../components/content-menu/content-menu';

@Component({
  selector: 'app-procedure-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ContentMenu],
  templateUrl: './procedure-detail.html',
  styleUrls: ['./procedure-detail.scss']
})
export class ProcedureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private docmgmtService = inject(DocmgmtService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  canEdit = false;

  procedure: DocmgmtProcedure | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.canEdit = this.authService.hasPermission('procedimientos', 'update');

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      if (isNaN(id)) {
        // Redirigir al listado si la URL es inválida (ej. /docmgmt/NaN)
        window.location.href = '/docmgmt';
        return;
      }
      this.loadProcedure(id);
    }
  }

  loadProcedure(id: number) {
    this.docmgmtService.getProcedure(id).subscribe({
      next: (res: any) => {
        if (res.docmgmtProcedure) {
          this.procedure = res.docmgmtProcedure;
        } else {
          this.error = 'Procedimiento no encontrado.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error de conexión.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDownloadUrl(fileName: string): string {
    if (!this.procedure) return '#';
    return this.docmgmtService.getDownloadUrl(this.procedure.id!, fileName);
  }

  getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bi-filetype-pdf text-danger';
    if (ext === 'doc' || ext === 'docx') return 'bi-filetype-docx text-primary';
    if (ext === 'xls' || ext === 'xlsx') return 'bi-filetype-xlsx text-success';
    return 'bi-file-earmark text-secondary';
  }

  getInitials(name: string): string {
    return name.substring(0, 2).toUpperCase();
  }
}
