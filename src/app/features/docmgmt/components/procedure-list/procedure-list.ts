import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocmgmtService } from '../../docmgmt.service';
import { DocmgmtProcedure } from '../../models/docmgmt.model';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ContentMenu } from '../../../../components/content-menu/content-menu';

@Component({
  selector: 'app-procedure-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ContentMenu],
  templateUrl: './procedure-list.html',
  styleUrls: ['./procedure-list.scss']
})
export class ProcedureListComponent implements OnInit {
  private docmgmtService = inject(DocmgmtService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  canAdd = false;
  canEdit = false;
  canDelete = false;

  procedures: DocmgmtProcedure[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';

  // KPIs
  totalProcedures = 0;
  publishedCount = 0;
  draftCount = 0;
  totalDocuments = 0;

  ngOnInit() {
    this.canAdd = this.authService.hasPermission('procedimientos', 'create');
    this.canEdit = this.authService.hasPermission('procedimientos', 'update');
    this.canDelete = this.authService.hasPermission('procedimientos', 'delete');
    this.loadProcedures();
  }

  loadProcedures() {
    this.loading = true;
    this.error = null;
    this.docmgmtService.getProcedures()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res.docmgmtProcedures) {
            this.procedures = res.docmgmtProcedures;
            this.calculateKPIs();
          } else {
            this.error = res.message || 'Error al cargar procedimientos';
          }
        },
        error: (err) => {
          this.error = 'Error de conexión al servidor';
        }
      });
  }

  calculateKPIs() {
    this.totalProcedures = this.procedures.length;
    this.publishedCount = this.procedures.filter(p => p.status === 'published').length;
    this.draftCount = this.procedures.filter(p => p.status === 'draft').length;
    
    this.totalDocuments = this.procedures.reduce((total, p) => {
      return total + (p.docmgmt_procedure_documents ? p.docmgmt_procedure_documents.length : 0);
    }, 0);
  }

  deleteTarget: DocmgmtProcedure | null = null;
  deleting = false;

  confirmDelete(proc: DocmgmtProcedure) {
    this.deleteTarget = proc;
  }

  cancelDelete() {
    this.deleteTarget = null;
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    this.deleting = true;
    this.docmgmtService.deleteProcedure(this.deleteTarget.id!).subscribe({
      next: (res) => {
        this.deleting = false;
        if (res.success) {
          this.loadProcedures();
          this.deleteTarget = null;
        } else {
          alert((res as any).message || 'Error al eliminar');
        }
      },
      error: () => {
        this.deleting = false;
        alert('Error de conexión');
      }
    });
  }

  get filteredProcedures() {
    if (!this.searchTerm) return this.procedures;
    const term = this.searchTerm.toLowerCase();
    return this.procedures.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.description && p.description.toLowerCase().includes(term))
    );
  }

  getInitials(name: string): string {
    return name.substring(0, 2).toUpperCase();
  }
}
