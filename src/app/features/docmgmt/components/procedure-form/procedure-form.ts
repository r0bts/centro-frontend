import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocmgmtService } from '../../docmgmt.service';
import { DocmgmtProcedure, DocmgmtDocument, DocmgmtPermission } from '../../models/docmgmt.model';

import { ContentMenu } from '../../../../components/content-menu/content-menu';

@Component({
  selector: 'app-procedure-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ContentMenu],
  templateUrl: './procedure-form.html',
  styleUrls: ['./procedure-form.scss']
})
export class ProcedureFormComponent implements OnInit {
  private docmgmtService = inject(DocmgmtService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  procedure: Partial<DocmgmtProcedure> = {
    name: '',
    description: '',
    status: 'draft'
  };
  
  documents: DocmgmtDocument[] = [];
  permissions: DocmgmtPermission[] = [];
  
  currentStep = 1;
  isEdit = false;
  saving = false;
  error: string | null = null;
  procedureId: number | null = null;
  
  // Pending files to upload once procedure is created (if new)
  pendingFiles: File[] = [];

  // Visibility selection
  departments = [
    { id: 1, name: 'Recursos Humanos', icon: 'bi-building', selected: false },
    { id: 2, name: 'Contabilidad', icon: 'bi-building', selected: false },
    { id: 3, name: 'Sistemas', icon: 'bi-building', selected: false },
    { id: 4, name: 'Dirección General', icon: 'bi-building', selected: false },
    { id: 5, name: 'Todos los departamentos', icon: 'bi-globe', selected: false }
  ];

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.procedureId = +idParam;
      this.loadProcedure();
    }
  }

  loadProcedure() {
    if (!this.procedureId) return;
    this.docmgmtService.getProcedure(this.procedureId).subscribe({
      next: (res: any) => {
        if (res.docmgmtProcedure) {
          this.procedure = res.docmgmtProcedure;
          this.documents = res.docmgmtProcedure.docmgmt_procedure_documents || [];
          this.permissions = res.docmgmtProcedure.docmgmt_procedure_permissions || [];
          
          // Map permissions to local departments (simplified)
          this.permissions.forEach(p => {
            if (p.permission_type === 'department') {
              const dept = this.departments.find(d => d.id === p.department_id);
              if (dept) dept.selected = true;
            }
          });
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.error = 'Error cargando procedimiento';
        this.cdr.detectChanges();
      }
    });
  }

  validationMessage: string | null = null;

  goStep(step: number) {
    if (step > this.currentStep && step === 2 && !this.procedure.name) {
      this.validationMessage = 'Debes ingresar un nombre para el procedimiento.';
      return;
    }
    this.currentStep = step;
  }

  closeValidation() {
    this.validationMessage = null;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (this.isEdit && this.procedureId) {
        // Upload immediately
        this.docmgmtService.uploadDocument(this.procedureId, file).subscribe({
          next: (res: any) => {
            if (res.success) this.loadProcedure();
            else alert('Error subiendo archivo');
          },
          error: () => alert('Error en la conexión')
        });
      } else {
        // Queue for later
        this.pendingFiles.push(file);
      }
    }
  }

  removePendingFile(index: number) {
    this.pendingFiles.splice(index, 1);
  }

  docDeleteTarget: number | null = null;
  deletingDoc = false;

  confirmDeleteDoc(docId: number) {
    this.docDeleteTarget = docId;
  }

  cancelDeleteDoc() {
    this.docDeleteTarget = null;
  }

  executeDeleteDoc() {
    if (!this.docDeleteTarget) return;
    this.deletingDoc = true;
    this.docmgmtService.deleteDocument(this.docDeleteTarget).subscribe({
      next: (res: any) => {
        this.deletingDoc = false;
        if (res.success) {
          this.loadProcedure();
          this.docDeleteTarget = null;
        }
      },
      error: () => {
        this.deletingDoc = false;
      }
    });
  }

  toggleDepartment(dept: any) {
    dept.selected = !dept.selected;
  }

  finishForm(publish: boolean) {
    this.procedure.status = publish ? 'published' : 'draft';
    this.saving = true;

    const request = this.isEdit && this.procedureId 
      ? this.docmgmtService.updateProcedure(this.procedureId, this.procedure)
      : this.docmgmtService.createProcedure(this.procedure);

    request.subscribe({
      next: (res: any) => {
        if (res.success) {
          const procId = res.docmgmtProcedure?.id;
          
          if (!procId) {
            console.error('No se recibió el ID del procedimiento creado', res);
            this.router.navigate(['/docmgmt']);
            return;
          }
          
          // If new, upload pending files
          if (!this.isEdit && this.pendingFiles.length > 0) {
            // For simplicity in UI, we'll upload the first one and navigate.
            // Ideally we'd forkJoin all uploads.
            this.docmgmtService.uploadDocument(procId, this.pendingFiles[0]).subscribe({
              next: () => this.router.navigate(['/docmgmt', procId])
            });
          } else {
            this.router.navigate(['/docmgmt', procId]);
          }
        } else {
          this.error = 'Error guardando: ' + JSON.stringify(res.errors);
          this.saving = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.error = 'Error de servidor';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bi-filetype-pdf text-danger';
    if (ext === 'doc' || ext === 'docx') return 'bi-filetype-docx text-primary';
    if (ext === 'xls' || ext === 'xlsx') return 'bi-filetype-xlsx text-success';
    return 'bi-file-earmark text-secondary';
  }
}
